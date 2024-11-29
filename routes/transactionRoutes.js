const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  exportCSV,
} = require("../controllers/transactionController");

// Add a Transaction
router.post("/", authenticateToken, addTransaction);

// Get All Transactions
router.get("/", authenticateToken, getTransactions);

// Update a Transaction
router.put("/:id", authenticateToken, updateTransaction);

// Delete a Transaction
router.delete("/:id", authenticateToken, deleteTransaction);

// Export2CSV
router.get("/export/csv", authenticateToken, exportCSV);

module.exports = router;
