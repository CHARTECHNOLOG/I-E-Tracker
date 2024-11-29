const Transaction = require("../models/transactionModel");

// Get financial summary for the dashboard
const getFinancialSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });

    // Calculate total income and expenses
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({ income, expenses });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching financial summary",
        error: error.message,
      });
  }
};

module.exports = { getFinancialSummary };
