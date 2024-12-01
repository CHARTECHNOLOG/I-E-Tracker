const express = require("express");
const router = express.Router();
const Budget = require("../models/budgetModel");
const authenticateToken = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const sendBudgetNotification = require("../helpers/sendBudgetNotification");

// POST /budget - Create or update a department budget
router.post(
  "/budget",
  authenticateToken,
  roleMiddleware("Admin"),
  async (req, res) => {
    const { department, allocated_amount } = req.body;

    try {
      let budget = await Budget.findOne({ department });

      if (budget) {
        // Update existing budget
        budget.allocated_amount = allocated_amount;
      } else {
        // Create a new budget entry
        budget = new Budget({ department, allocated_amount });
      }

      await budget.save();

      res.status(200).json({
        message: budget.isNew
          ? "Budget created successfully"
          : "Budget updated successfully",
        budget,
      });
    } catch (error) {
      res.status(500).json({ error: `Failed to set budget: ${error.message}` });
    }
  }
);

// GET /budget - Retrieve all budget details
router.get(
  "/budget",
  authenticateToken,
  roleMiddleware("Admin"),
  async (req, res) => {
    try {
      const budgets = await Budget.find();
      res.status(200).json(budgets);
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to retrieve budgets: ${error.message}` });
    }
  }
);

// PUT /budget/:department/spend - Update spending for a department budget
router.put(
  "/budget/:department/spend",
  authenticateToken,
  roleMiddleware("Admin"),
  async (req, res) => {
    const { department } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount specified" });
    }

    try {
      const budget = await Budget.findOne({ department });

      if (!budget) {
        return res
          .status(404)
          .json({ error: "Budget not found for the specified department" });
      }

      // Update spent amount
      budget.spent_amount = (budget.spent_amount || 0) + amount;

      // Check remaining budget
      const remainingBudget = budget.allocated_amount - budget.spent_amount;
      if (
        remainingBudget < 0 ||
        (remainingBudget < 500 && !budget.notifications_sent)
      ) {
        await sendBudgetNotification(department, remainingBudget); // Use the new function
        budget.notifications_sent = true; // Mark notification as sent
      }

      await budget.save();

      res.status(200).json({ message: "Budget updated successfully", budget });
    } catch (error) {
      res
        .status(500)
        .json({ error: `Failed to update budget: ${error.message}` });
    }
  }
);

module.exports = router;
