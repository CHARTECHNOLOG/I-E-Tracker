// routes/admin.js
const express = require("express");
const router = express.Router();
const checkRole = require("../middleware/roleMiddleware");

// Protecting the admin route with RBAC
router.get("/admin-dashboard", checkRole("admin"), (req, res) => {
  res.send("Welcome to the Admin Dashboard");
});

module.exports = router;
