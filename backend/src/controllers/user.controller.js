const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const User = require('../models/user.model'); 

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'fullybooked-super-secret-jwt-token-key-2025';

// User login endpoint
exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Validate password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(200).json({ 
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                phone: user.phone || '',
                avatar: user.avatar || '',
                address: user.address || {}
            }
        });
    } catch (error) {
        console.error("Error in loginUser:", error);
        next(error);
    }
};

// Google authentication endpoint
exports.googleAuth = async (req, res, next) => {
    const { email, firebaseUid } = req.body;
    
    try {
        // Find user by email or firebaseUid
        let user = await User.findOne({ 
            $or: [{ email }, { firebaseUid }] 
        });
        
        // If user doesn't exist, create new user
        if (!user) {
            return res.status(404).json({ 
                message: "User not found. Please register first." 
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, firebaseUid: user.firebaseUid },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(200).json({ 
            message: "Google authentication successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                phone: user.phone || '',
                avatar: user.avatar || '',
                address: user.address || {}
            }
        });
    } catch (error) {
        console.error("Error in googleAuth:", error);
        next(error);
    }
};

exports.registerUser = async (req, res, next) => {
    const { username, email, password, firebaseUid } = req.body;

    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user with the same email or username already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ message: "User with this email or username already exists" });
        }

        const newUser = new User({ username, email, password, firebaseUid });
        await newUser.save();

        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role, firebaseUid: newUser.firebaseUid },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: "User created successfully!", 
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                phone: newUser.phone || '',
                avatar: newUser.avatar || '',
                address: newUser.address || {}
            }
        });
    } catch (error) {
        console.error("Error in registerUser:", error);
        next(error);
    }
};

exports.loginAdmin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await User.findOne({ username });
        if (!admin) {
            return res.status(404).send({ message: "Admin not found!" });
        }

        if (admin.role !== "admin") {
            return res.status(403).send({ message: "Access denied. Not an admin." });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).send({ message: "Invalid password" });
        }

        const token = jwt.sign(
            { id: admin._id, username: admin.username, role: admin.role },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        return res.status(200).json({
            message: "Authentication successful",
            token,
            user: { 
                id: admin._id,
                username: admin.username, 
                role: admin.role,
                phone: admin.phone || '',
                avatar: admin.avatar || '',
                address: admin.address || {}  
            },
        });
    } catch (error) {
        console.error("Failed to login as admin", error);
        return res.status(500).send({ message: "Failed to login as admin" });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        // Fetch all users, excluding the password field
        const users = await User.find()
            .select('-password') // Exclude the password field
            .sort({ createdAt: -1 }); // Sort by creation date (newest first)

        res.status(200).json(users); // Send the users as a JSON response
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users!" });
    }
};

exports.getSingleUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).send({ message: "User not found!" });
        }
        res.status(200).send(user);
    } catch (error) {
        console.error("Error: Fetching a User", error);
        res.status(500).send({ message: "Failed to fetch the user!" });
    }
};

exports.adminCreateUser = async (req, res, next) => {
    const { username, email, password, firebaseUid, role } = req.body;

    try {
        // Check if required fields are provided
        if (!username || !email || !password || !firebaseUid) {
            return res.status(400).json({ message: "All fields (username, email, password, firebaseUid) are required." });
        }

        // Check if the role is valid
        const validRoles = ["admin", "customer", "courier"];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role provided. Valid roles are: ${validRoles.join(', ')}` });
        }

        // Check if a user with the same email or username already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ message: "A user with this email or username already exists." });
        }

        // Create a new user
        const newUser = new User({
            username,
            email,
            password,
            firebaseUid,
            role: role || "customer", // Default to "customer" if no role is provided
        });
        await newUser.save();

        // Generate a token
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role, firebaseUid: newUser.firebaseUid },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.status(201).json({
            message: "User created successfully!",
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
            },
            token,
        });
    } catch (error) {
        console.error("Error in adminCreateUser:", error);
        next(error);
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the existing user
        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(404).send({ message: "User not found!" });
        }

        // Prepare updated data
        const updatedData = { ...req.body };

        // Handle avatar upload
        if (req.file && req.file.path) {
            updatedData.avatar = req.file.path; // Save Cloudinary URL
        }

        // Handle role update (only admins can update roles)
        if (updatedData.role) {
            if (req.user.role !== "admin") {
                return res.status(403).send({ message: "Only admins can update user roles!" });
            }
        }

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(id, updatedData, { new: true });
        res.status(200).send({
            message: "User updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).send({ message: "Failed to update the user!" });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).send({ message: "User not found!" });
        }
        res.status(200).send({
            message: "User deleted successfully",
            user: deletedUser,
        });
    } catch (error) {
        console.error("Error: Deleting a User", error);
        res.status(500).send({ message: "Failed to delete the user!" });
    }
};

// Firebase token endpoint
exports.getFirebaseToken = async (req, res, next) => {
    const { email, firebaseUid } = req.body;
    
    try {
        console.log(`[getFirebaseToken] Request received for: ${email}, ${firebaseUid}`);
        
        if (!email || !firebaseUid) {
            return res.status(400).json({ message: "Email and Firebase UID are required" });
        }
        
        // First check if a user with this firebaseUid already exists
        let user = await User.findOne({ firebaseUid });
        
        // If found by firebaseUid but email doesn't match
        if (user && user.email !== email) {
            console.log(`[getFirebaseToken] Warning: Firebase UID ${firebaseUid} already linked to different email ${user.email}`);
            // Return the existing user anyway, as this is likely the same user with a different Google account
        }
        
        // If no user with the firebaseUid, try to find by email
        if (!user) {
            user = await User.findOne({ email });
            
            // If found by email but no firebaseUid, update the user with the firebaseUid
            if (user && !user.firebaseUid) {
                user.firebaseUid = firebaseUid;
                try {
                    await user.save();
                    console.log(`[getFirebaseToken] Updated existing user with Firebase UID: ${user.email}`);
                } catch (saveError) {
                    console.error("[getFirebaseToken] Error updating user with Firebase UID:", saveError);
                    // Handle duplicate key error explicitly
                    if (saveError.code === 11000) {
                        console.log("[getFirebaseToken] Duplicate key error - another user already has this Firebase UID");
                        // Find the user with the conflicting Firebase UID
                        const conflictUser = await User.findOne({ firebaseUid });
                        if (conflictUser) {
                            // Use that user instead
                            user = conflictUser;
                            console.log(`[getFirebaseToken] Using existing user with Firebase UID: ${user.email}`);
                        }
                    }
                }
            }
        }
        
        // If user still not found, create a new user
        if (!user) {
            console.log(`[getFirebaseToken] Creating new user for email: ${email}`);
            
            // Generate a username from the email (make it unique)
            const usernameBase = email.split('@')[0];
            const timestamp = Date.now().toString().slice(-4);
            const username = `${usernameBase}_${timestamp}`;
            
            // Create a random password (not used for Firebase auth)
            const password = Math.random().toString(36).slice(-8);
            
            try {
                user = new User({
                    email,
                    firebaseUid,
                    username,
                    password,
                    role: "customer"
                });
                
                await user.save();
                console.log(`[getFirebaseToken] New user created: ${email}`);
            } catch (createError) {
                // Handle duplicate key error
                if (createError.code === 11000) {
                    console.log("[getFirebaseToken] Duplicate key error during user creation");
                    
                    // Determine which field caused the conflict
                    const errorMessage = createError.message;
                    if (errorMessage.includes('firebaseUid')) {
                        // If firebaseUid is duplicated, find and use that user
                        user = await User.findOne({ firebaseUid });
                        console.log(`[getFirebaseToken] Using existing user with Firebase UID: ${user?.email}`);
                    } else if (errorMessage.includes('email')) {
                        // If email is duplicated, find and use that user
                        user = await User.findOne({ email });
                        console.log(`[getFirebaseToken] Using existing user with email: ${user?.email}`);
                    } else if (errorMessage.includes('username')) {
                        // If username is duplicated, retry with a different username
                        const retryUsername = `${usernameBase}_${Math.floor(Math.random() * 10000)}`;
                        user = new User({
                            email,
                            firebaseUid,
                            username: retryUsername,
                            password,
                            role: "customer"
                        });
                        
                        await user.save();
                        console.log(`[getFirebaseToken] New user created with alternate username: ${retryUsername}`);
                    }
                    
                    if (!user) {
                        throw new Error("Failed to handle duplicate key error");
                    }
                } else {
                    // Rethrow if it's not a duplicate key error
                    throw createError;
                }
            }
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, firebaseUid },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log(`[getFirebaseToken] Token generated for user: ${user.email}`);
        
        res.status(200).json({
            success: true,
            message: "Firebase authentication successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                phone: user.phone || '',
                avatar: user.avatar || '',
                address: user.address || {}
            }
        });
    } catch (error) {
        console.error("[getFirebaseToken] Error:", error);
        next(error);
    }
};

// Simple test endpoint for debugging
exports.testEndpoint = async (req, res) => {
    try {
        res.status(200).json({ 
            message: "Test endpoint reached successfully",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error in test endpoint:", error);
        res.status(500).json({ message: "Test endpoint error" });
    }
};

// User profile update endpoint - for users to update their own profiles
exports.updateUserProfile = async (req, res) => {
    try {
        // The ID comes from the authenticated user token, not a URL parameter
        // This ensures users can only update their own profiles
        const userId = req.user.id;
        
        console.log(`User ${userId} attempting to update profile`);
        console.log('Request body:', req.body);
        
        if (req.file) {
            console.log('Avatar file received:', req.file.path);
        } else if (req.body.avatarUrl) {
            console.log('Using existing avatar URL:', req.body.avatarUrl);
        }

        // Find the existing user
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ message: "User not found!" });
        }

        // Parse address from JSON string if it comes as a string
        let addressData = req.body.address;
        if (typeof addressData === 'string') {
            try {
                addressData = JSON.parse(addressData);
            } catch (error) {
                console.error('Error parsing address JSON:', error);
                addressData = existingUser.address; // Fallback to existing address
            }
        }
        
        // Prepare updated data
        const updatedData = {
            username: req.body.username,
            email: req.body.email,
            phone: req.body.phone || '',
            address: {
                city: addressData?.city || existingUser.address?.city || '',
                country: addressData?.country || existingUser.address?.country || '',
                state: addressData?.state || existingUser.address?.state || '',
                zipcode: addressData?.zipcode || existingUser.address?.zipcode || '',
            }
        };

        // Handle avatar upload
        if (req.file) {
            // Use Cloudinary to upload the file that multer saved
            try {
                const uploadToCloudinary = require('../../utils/cloudinaryUploader');
                const uploadResult = await uploadToCloudinary(req.file, 'Fully Booked/avatars');
                
                if (uploadResult.success) {
                    console.log('Avatar uploaded to Cloudinary:', uploadResult.url);
                    updatedData.avatar = uploadResult.url;
                } else {
                    console.error('Failed to upload avatar to Cloudinary:', uploadResult.error);
                    // Keep existing avatar if upload fails
                    updatedData.avatar = existingUser.avatar;
                }
            } catch (uploadError) {
                console.error('Error uploading avatar to Cloudinary:', uploadError);
                // Keep existing avatar if upload fails
                updatedData.avatar = existingUser.avatar;
            }
        } else if (req.body.avatarUrl) {
            // If an existing URL was provided
            updatedData.avatar = req.body.avatarUrl;
        } else {
            // Keep existing avatar if none provided
            updatedData.avatar = existingUser.avatar;
        }

        console.log('Updating user with data:', updatedData);

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true });
        
        // Return success and the updated user
        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                phone: updatedUser.phone,
                avatar: updatedUser.avatar,
                role: updatedUser.role,
                address: updatedUser.address
            }
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ message: "Failed to update profile!" });
    }
};

// User "me" endpoint to get current user info
exports.getCurrentUser = async (req, res) => {
    try {
        // The user information is available from the token via req.user
        // that was attached by the verifyToken middleware
        const user = req.user;
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return the user information
        res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            phone: user.phone || '',
            avatar: user.avatar || '',
            address: user.address || {}
        });
    } catch (error) {
        console.error("Error in getCurrentUser:", error);
        res.status(500).json({ message: "Failed to fetch user information" });
    }
};


