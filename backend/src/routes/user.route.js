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
    updateUserProfile,
    updateFcmToken,
    removeFcmToken,
    cleanStaleFcmTokens,
    sendNotificationToUser
} = require('../controllers/user.controller');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const { verifyToken } = require('../middleware/verifyToken');
const { upload } = require('../../utils/multer.config');
const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-auth", googleAuth);
router.post("/firebase-token", getFirebaseToken);
// Add a test route to debug the endpoint
router.get("/firebase-token-check", (req, res) => {
  res.status(200).json({ 
    message: "Firebase token route is accessible", 
    timestamp: new Date().toISOString() 
  });
});
// Add a more debug-friendly version for troubleshooting
router.post("/firebase-token-test", (req, res) => {
  console.log("Firebase token test route hit!");
  console.log("Request body:", req.body);
  res.status(200).json({ success: true, message: "Test endpoint working" });
});
router.get("/test", testEndpoint);
router.post("/admin", loginAdmin);

// User-protected routes (requires authentication but not admin)
router.get("/profile-test", verifyToken, testEndpoint); 
// Update profile route with multer middleware for avatar upload
router.put("/profile/update", verifyToken, upload.single('avatar'), updateUserProfile);
router.post("/profile/update", verifyToken, upload.single('avatar'), updateUserProfile);

// Push notification token routes
router.post("/update-fcm-token", verifyToken, updateFcmToken);
router.delete("/remove-fcm-token", verifyToken, removeFcmToken);

// Admin-protected routes
router.get("/all", verifyAdminToken, getAllUsers);
router.get("/:id", verifyAdminToken, getSingleUser);
router.post("/create-user", verifyAdminToken, adminCreateUser);
router.put("/update/:id", verifyAdminToken, updateUser); // Update user by ID
router.delete("/:id", verifyAdminToken, deleteUser);
router.post("/clean-stale-tokens", verifyAdminToken, cleanStaleFcmTokens);
router.post("/send-notification", verifyAdminToken, sendNotificationToUser);

module.exports = router;
