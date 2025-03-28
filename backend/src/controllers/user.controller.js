const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const User = require('../users/user.model'); 

const JWT_SECRET = process.env.JWT_SECRET_KEY;

exports.registerUser = async (req, res, next) => {
    const { username, email, password, firebaseUid } = req.body;

    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash password
        const newUser = new User({ username, email, password: hashedPassword, firebaseUid });
        await newUser.save();

        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role, firebaseUid: newUser.firebaseUid },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({ message: "User created successfully!", token });
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
            { expiresIn: "1h" }
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
        const validRoles = ["admin", "user"];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role provided. Valid roles are: admin, user." });
        }

        // Check if a user with the same email or username already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ message: "A user with this email or username already exists." });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            firebaseUid,
            role: role || "customer", // Default to "user" if no role is provided
        });
        await newUser.save();

        // Generate a token
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role, firebaseUid: newUser.firebaseUid },
            JWT_SECRET,
            { expiresIn: "1h" }
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

// COURIER FUNCTIONALITIES

exports.submitCourierApplication = async (req, res) => {
    try {
        const { userId } = req.params;  // Assuming the user ID is sent as a URL parameter
        const { vehicleInfo, serviceArea, validId } = req.body;

        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'customer') {
            return res.status(400).json({ message: 'Only customers can apply to be a courier' });
        }
        
        if (user.courierApplicationStatus === 'pending') {
            return res.status(400).json({ message: 'Application already submitted and is under review' });
        }

        // Update user fields for courier application
        user.courierApplicationStatus = 'pending';
        user.applicationDate = new Date();
        user.vehicleInfo = vehicleInfo;
        user.serviceArea = serviceArea;
        user.validId = validId;

        // Save the updated user data
        await user.save();

        res.status(200).json({ message: 'Courier application submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while submitting the application' });
    }
};

exports.processCourierApplication = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;  // 'approved' or 'rejected'

        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.courierApplicationStatus !== 'pending') {
            return res.status(400).json({ message: 'No pending application found for this user' });
        }

        // Approve the application
        if (status === 'approved') {
            user.courierApplicationStatus = 'approved';
            user.approvalDate = new Date();
            user.role = 'courier';  // Update the role to courier
            user.isAvailable = true;  // Set initial availability status
        } 
        // Reject the application
        else if (status === 'rejected') {
            user.courierApplicationStatus = 'rejected';
            user.applicationDate = null;
            user.approvalDate = null;
            user.vehicleInfo = null;
            user.serviceArea = { country: null, city: null };
            user.validId = null;
        } else {
            return res.status(400).json({ message: 'Invalid status. Must be either "approved" or "rejected".' });
        }

        // Save the updated user data
        await user.save();

        res.status(200).json({ message: `Courier application ${status} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while processing the application' });
    }
};


  