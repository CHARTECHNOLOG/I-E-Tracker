const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const checkPermission = require("../middleware/checkPermission");
const createLog = require("../helpers/logHelpers");

const router = express.Router();

// Admin only route
router.get(
  "/admin",
  authenticateToken,
  roleMiddleware(["Admin"]),
  checkPermission("dashboard", "read"),
  //createLog("projects", "created", "User created a new project"),
  (req, res) => {
    res.send("Welcome Admin");
  }
);

// Team Lead only route
router.get(
  "/team-lead",
  authenticateToken,
  roleMiddleware(["Admin", "Team Lead"]),
  (req, res) => {
    res.send("Welcome Team Lead");
  }
);

// Employee only route (accessible by all roles)
router.get(
  "/employee",
  authenticateToken,
  roleMiddleware(["Admin", "Team Lead", "Employee"]),
  (req, res) => {
    res.send("Welcome Employee");
  }
);

// Admin-only route (restricted to Admin role)
router.get(
  "/admin/dashboard",
  authenticateToken,
  roleMiddleware("Admin"),
  (req, res) => {
    res.json({ msg: "Welcome to the Admin Dashboard" });
  }
);

// Team Lead-only route (restricted to Team Lead role)
router.get(
  "/teamlead/overview",
  authenticateToken,
  roleMiddleware("Team Lead"),
  (req, res) => {
    res.json({ msg: "Welcome to the Team Lead Overview" });
  }
);

// Employee-only route (restricted to Employee role)
router.get(
  "/employee/summary",
  authenticateToken,
  roleMiddleware("Employee"),
  (req, res) => {
    res.json({ msg: "Welcome to the Employee Summary" });
  }
);

module.exports = router;
