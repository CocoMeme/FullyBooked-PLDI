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
                role: user.role
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
                role: user.role
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
                role: newUser.role
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
            user: { username: admin.username, role: admin.role },
        });
    } catch (error) {
        console.error("Failed to login as admin", error);
        return res.status(500).send({ message: "Failed to login as admin" });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.status(200).send(users);
    } catch (error) {
        console.error("Error: Fetching Users", error);
        res.status(500).send({ message: "Failed to fetch users!" });
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


