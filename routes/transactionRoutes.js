const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  transactionStatus,
  exportCSV,
} = require("../controllers/transactionController");

// Add a Transaction
router.post("/", authenticateToken, upload.single("receipt"), addTransaction);

// Get All Transactions
router.get("/", authenticateToken, getTransactions);

// Update a Transaction
router.put(
  "/:id",
  authenticateToken,
  upload.single("receipt"),
  updateTransaction
);

// Delete a Transaction
router.delete("/:id", authenticateToken, deleteTransaction);

// Update Status of Transaction
router.patch(
  "/status/:id",
  authenticateToken,
  roleMiddleware("Admin"),
  transactionStatus
);

// Export2CSV
router.get("/export/csv", authenticateToken, exportCSV);

module.exports = router;
