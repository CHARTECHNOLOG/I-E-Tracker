const express = require("express");
const { getFinancialSummary } = require("../controllers/dashboardController");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Dashboard route
router.get("/", authenticateToken, getFinancialSummary);

module.exports = router;
