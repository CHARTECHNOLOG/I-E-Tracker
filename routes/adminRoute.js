// routes/admin.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const createLog = require("../models/logModel");

router.get(
  "/logs",
  authenticateToken,
  roleMiddleware("Admin"),
  async (req, res) => {
    try {
      const logs = await createLog
        .find()
        .populate("user", "username email") // Populate user details
        .populate("performedBy", "username email") // Populate the performer
        .populate("targetUser", "username email") // Populate the target user
        .sort({ timestamp: -1 }); // Latest logs first

      res.status(200).json(logs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

router.get(
  "/logs",
  authenticateToken,
  roleMiddleware(["Admin", "Team Lead"]),
  async (req, res) => {
    const { user, action, resource, startDate, endDate } = req.query;

    const query = {};
    if (user) query.user = user;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    try {
      const logs = await Log.find(query).populate(
        "user performedBy targetUser",
        "name email role"
      );
      res.status(200).json({ logs });
    } catch (error) {
      console.error("Error fetching logs:", error.message);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  }
);

router.delete(
  "/logs",
  authenticateToken,
  roleMiddleware("Admin"),
  async (req, res) => {
    const { olderThan } = req.body; // Date string

    if (!olderThan) {
      return res.status(400).json({ message: "Please specify a date" });
    }

    try {
      const result = await createLog.deleteMany({
        timestamp: { $lt: new Date(olderThan) },
      });
      res.status(200).json({ message: `Deleted ${result.deletedCount} logs` });
    } catch (error) {
      // console.error("Error deleting logs:", error.message);
      res.status(500).json({ error: "Failed to delete logs" });
    }
  }
);

module.exports = router;
