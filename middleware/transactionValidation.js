const Joi = require("joi");

const transactionSchema = Joi.object({
  department: Joi.string().required(),
  type: Joi.string().valid("income", "expense").required(),
  category: Joi.string().required(),
  amount: Joi.number().positive().required(),
  date: Joi.date().iso().required(),
  description: Joi.string().allow(""),
  payment_method: Joi.string().required(),
  status: Joi.string().valid("Pending", "Processing", "Approved", "Rejected"),
});
module.exports = transactionSchema;
