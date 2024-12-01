const Log = require("../models/logModel");

const createLog = async ({
  user,
  action,
  resource,
  performedBy,
  targetUser,
  details,
}) => {
  try {
    const log = new Log({
      user,
      action,
      resource,
      performedBy,
      targetUser,
      details,
    });
    return await log.save();
  } catch (error) {
    console.error("Error creating log:", error.message);
    throw new Error("Failed to create log");
  }
};

module.exports = createLog;
