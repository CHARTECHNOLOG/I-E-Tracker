const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true,
    unique: true, // Each department should have one budget
  },
  allocated_amount: {
    type: Number,
    required: true,
  },
  spent_amount: {
    type: Number,
    default: 0,
  },
  notifications_sent: {
    type: Boolean,
    default: false, // To track if notification has already been sent
  },
  remaining_amount: {
    type: Number,
    default: function () {
      return this.allocated_amount - this.spent_amount;
    },
  },
});

module.exports = mongoose.model("Budget", BudgetSchema);
