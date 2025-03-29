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
    testEndpoint
} = require('../controllers/user.controller');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-auth", googleAuth);
router.post("/firebase-token", getFirebaseToken);
router.get("/test", testEndpoint);
router.post("/admin", loginAdmin);

// Admin-protected routes
router.get("/", getAllUsers);
router.get("/:id", verifyAdminToken, getSingleUser);
router.post("/create-user", verifyAdminToken, adminCreateUser);
router.put("/update/:id", verifyAdminToken, updateUser);
router.delete("/:id", verifyAdminToken, deleteUser);

module.exports = router;
