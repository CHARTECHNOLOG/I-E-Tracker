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
} = require("../controllers/authController");
const authenticateToken = require("../middleware/authMiddleware");

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

module.exports = router;
