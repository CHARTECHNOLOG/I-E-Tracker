const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// Render Registration Page
router.get("/register", (req, res) => {
  res.render("register"); // Render 'register.ejs' from the views folder
});

// Render Login Page
router.get("/login", (req, res) => {
  res.render("login"); // Render 'login.ejs' from the views folder
});

// Render Dashboard (only for authenticated users)
router.get("/dashboard", authMiddleware, (req, res) => {
  res.render("dashboard"); // Render the dashboard page
});

// Logout Route
router.get("/logout", (req, res) => {
  res.clearCookie("token"); // Remove token if stored in cookies
  res.redirect("/login"); // Redirect to login page
});

// Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  // Code for generating reset token and sending email
});

// Reset Password Route
router.post("/reset-password/:token", async (req, res) => {
  // Code for verifying token and resetting password
});

// Code for changing password
router.put("/change-password", authMiddleware, async (req, res) => {
  // Code for changing password
  res.redirect("/change-password");
});

module.exports = router;
