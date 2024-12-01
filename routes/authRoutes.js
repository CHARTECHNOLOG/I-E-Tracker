// AuthRoutes.js
const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  logoutUser,
  viewProfile,
  updateProfile,
  allUser,
  allUserUpdate,
} = require("../controllers/authController");
const authenticateToken = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Register route
router.post(
  "/register",
  [
    check("name", "Name is required").notEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters long").isLength({
      min: 6,
    }),
  ],
  registerUser
);

// Login route
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  loginUser
);

// Refresh token route
router.post("/refresh-token", refreshToken);

// Forgot password route
router.post("/forgot-password", forgotPassword);

// Reset password route
router.post("/reset-password/:token", resetPassword);

// Change password route
router.put("/change-password", authenticateToken, changePassword);

// Logout Route
router.post("/logout", authenticateToken, logoutUser);

// Profile route (accessible by any authenticated user)
router.get("/profile", authenticateToken, viewProfile);
router.put("/profile", authenticateToken, updateProfile);

// View all users (Admin-only route)
router.get("/admin/users", authenticateToken, roleMiddleware("Admin"), allUser);

// Update a user's role (Admin-only route)
router.put(
  "/admin/update-role/:id",
  authenticateToken,
  roleMiddleware("Admin"),
  allUserUpdate
);
module.exports = router;
