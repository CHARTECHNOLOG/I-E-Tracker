const express = require("express");
const router = express.Router();
const Transaction = require("../models/transactionModel"); // Income/Expense model
const Budget = require("../models/budgetModel"); // For department-related data

// GET /report/income-vs-expenses
router.get("/report/income-vs-expenses", async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Start and end dates are required." });
  }

  try {
    // Fetch income and expenses within the specified date range
    const income = await Transaction.aggregate([
      {
        $match: {
          type: "income",
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const expenses = await Transaction.aggregate([
      {
        $match: {
          type: "expense",
          date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.status(200).json({
      income: income[0]?.total || 0,
      expenses: expenses[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch data: ${error.message}` });
  }
});

// GET /report/category-breakdown
router.get("/report/category-breakdown", async (req, res) => {
  const { startDate, endDate, department } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Start and end dates are required." });
  }

  try {
    const matchStage = {
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    };

    if (department) {
      matchStage.department = department; // Filter by department if specified
    }

    // Aggregate income and expenses by category
    const categoryData = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { category: "$category", type: "$type" },
          total: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.category",
          data: {
            $push: { type: "$_id.type", total: "$total" },
          },
        },
      },
    ]);

    res.status(200).json(categoryData);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch category breakdown: ${error.message}` });
  }
});

module.exports = router;