const Transaction = require("../models/transactionModel");
const { Parser } = require("json2csv");
const fs = require("fs");

// Add a Transaction
const addTransaction = async (req, res) => {
  const { type, category, amount, date, description } = req.body;

  try {
    const transaction = new Transaction({
      user: req.user.id, // Extract user ID from authenticated request
      type,
      category,
      amount,
      date,
      description,
    });

    await transaction.save();
    res
      .status(201)
      .json({ msg: "Transaction added successfully", transaction });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Error adding transaction", error: error.message });
  }
};

// Get All Transactions for a User
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort({
      date: -1,
    });
    res.status(200).json(transactions);
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Error fetching transactions", error: error.message });
  }
};

// Update a Transaction
const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { type, category, amount, date, description } = req.body;

  try {
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    // Ensure the user owns the transaction
    if (transaction.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ msg: "Not authorized to update this transaction" });
    }

    // Update transaction fields
    transaction.type = type || transaction.type;
    transaction.category = category || transaction.category;
    transaction.amount = amount || transaction.amount;
    transaction.date = date || transaction.date;
    transaction.description = description || transaction.description;

    await transaction.save();
    res
      .status(200)
      .json({ msg: "Transaction updated successfully", transaction });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Error updating transaction", error: error.message });
  }
};

// Delete a Transaction
const deleteTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    // Ensure the user owns the transaction
    if (transaction.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ msg: "Not authorized to delete this transaction" });
    }

    await transaction.remove();
    res.status(200).json({ msg: "Transaction deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Error deleting transaction", error: error.message });
  }
};

// Export transactions as CSV
const exportCSV = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });

    const fields = ["type", "category", "amount", "description", "date"];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(transactions);

    res.header("Content-Type", "text/csv");
    res.attachment("transactions.csv");
    res.send(csv);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error exporting data", error: error.message });
  }
};

module.exports = {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  exportCSV,
};
