const Transaction = require("../models/transactionModel");
const { Parser } = require("json2csv");
const fs = require("fs");
const Budget = require("../models/budgetModel");
const sendNotification = require("../helpers/sendnotifications");
const transactionSchema = require("../middleware/transactionValidation");
const createLog = require("../helpers/logHelpers");

// Add a Transaction
const addTransaction = async (req, res) => {
  const {
    department,
    type,
    category,
    amount,
    date,
    description,
    payment_method,
  } = req.body;

  // Validate input
  const { error } = transactionSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    // Check and update budget
    const budget = await Budget.findOne({ department });
    if (!budget) {
      return res
        .status(404)
        .json({ message: "No budget found for the specified department" });
    }

    if (type === "expense" && budget.remaining_amount < amount) {
      sendNotification(
        req.user,
        `Transaction exceeds the budget for ${department}.`
      );
      return res
        .status(400)
        .json({ message: "Transaction exceeds the department budget" });
    }

    const transaction = new Transaction({
      user: req.user.id, // Extract user ID from authenticated request
      department,
      type,
      category,
      amount,
      date,
      description,
      payment_method,
      receipt: req.file ? req.file.path : null, // Save the file path
    });

    await transaction.save();

    // Update budget
    if (type === "expense") {
      budget.spent_amount += amount;
    } else if (type === "income") {
      budget.allocated_amount += amount;
    }
    budget.remaining_amount = budget.allocated_amount - budget.spent_amount;
    await budget.save();

    // Log the transaction
    await createLog({
      user: req.user.id,
      action: "create",
      resource: "transaction",
      performedBy: req.user.id,
      targetUser: req.user.id,
      details: `Created a ${type} transaction in ${department}: ${amount}`,
    });

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
  const { department, type, category, status, date, userId } = req.query;

  try {
    const filter = {};
    if (department) filter.department = department;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (date) filter.date = { $gte: new Date(date) };
    if (userId) filter.user = userId;

    const transactions = await Transaction.find(filter).populate(
      "user",
      "name email"
    );

    res.status(200).json({ transactions });
  } catch (error) {
    res
      .status(500)
      .json({ msg: `Failed to retrieve transactions: ${error.message}` });
  }
};

// Update a Transaction
const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { department, type, category, amount, description, payment_method } =
    req.body;

  // Validate input
  const { error } = transactionSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    const budget = await Budget.findOne({ department });
    if (!budget) {
      return res
        .status(404)
        .json({ message: "No budget found for the specified department" });
    }

    // Update budget (revert old amount, add new amount)
    if (transaction.type === "expense") {
      budget.spent_amount -= transaction.amount;
    }
    if (type === "expense") {
      budget.spent_amount += amount;
    }

    budget.remaining_amount = budget.allocated_amount - budget.spent_amount;
    if (budget.remaining_amount < 0) {
      sendNotification(
        req.user,
        `Updated transaction exceeds the budget for ${department}.`
      );
      return res
        .status(400)
        .json({ message: "Transaction exceeds the department budget" });
    }

    // Ensure the user owns the transaction
    // if (transaction.user.toString() !== req.user.id) {
    //   return res
    //     .status(403)
    //     .json({ msg: "Not authorized to update this transaction" });
    // }

    // Update transaction details
    transaction.department = department || transaction.department;
    transaction.type = type || transaction.type;
    transaction.category = category || transaction.category;
    transaction.amount = amount || transaction.amount;
    transaction.description = description || transaction.description;
    transaction.payment_method = payment_method || transaction.payment_method;

    // Update receipt if a new file is uploaded
    if (req.file) {
      transaction.receipt = req.file.path;
    }

    await transaction.save();
    await budget.save();

    // Log the update
    await createLog({
      user: req.user.id,
      action: "update",
      resource: "transaction",
      performedBy: req.user.id,
      targetUser: `${id}`,
      details: `Updated transaction ${id} in ${department}.`,
    });

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

// Update Transaction Status
const transactionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Status to update to

  // Allowed statuses
  const allowedStatuses = ["Approved", "Pending", "Processing", "Rejected"];

  // Validate status
  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status provided" });
  }

  try {
    // Find and update the transaction
    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Create log for status change
    await createLog({
      user: req.user.id,
      action: "update",
      resource: "transaction",
      performedBy: req.user.id,
      targetUser: `${id}`,
      details: `Updated transaction ${id} status to ${status}`,
    });

    // Send notification about the status change
    const notificationMessage = `Transaction #${transaction._id} status updated to ${status}`;
    sendNotification(transaction.user, notificationMessage);

    res.status(200).json({
      message: `Transaction status updated to ${status}`,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ msg: `Failed to update status: ${error.message}` });
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
    res.status(500).json({ msg: "Error exporting data", error: error.message });
  }
};

module.exports = {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  transactionStatus,
  exportCSV,
};
