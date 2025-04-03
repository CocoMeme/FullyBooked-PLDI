const express = require('express');
const {
    registerUser,
    loginUser,
    googleAuth,
    loginAdmin,
    getAllUsers,
    getSingleUser,
    updateUser,
    deleteUser,
    adminCreateUser,
    getFirebaseToken,
    testEndpoint,
    updateUserProfile
} = require('../controllers/user.controller');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const { verifyToken } = require('../middleware/verifyToken');
const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-auth", googleAuth);
router.post("/firebase-token", getFirebaseToken);
router.get("/test", testEndpoint);
router.post("/admin", loginAdmin);

// User-protected routes (requires authentication but not admin)
router.put("/profile/update", verifyToken, updateUserProfile);
router.post("/profile/update", verifyToken, updateUserProfile);

// Admin-protected routes
router.get("/all", verifyAdminToken, getAllUsers);
router.get("/:id", verifyAdminToken, getSingleUser);
router.post("/create-user", verifyAdminToken, adminCreateUser);
router.put("/update/:id", verifyAdminToken, updateUser); // Update user by ID
router.delete("/:id", verifyAdminToken, deleteUser);

module.exports = router;
