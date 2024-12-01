const sendNotification = require("./sendnotifications");
const User = require("../models/User"); // Assuming you have a User model

const sendBudgetNotification = async (department, remainingBudget) => {
  try {
    // Fetch users responsible for the department (or admins)
    const users = await User.find({ department, role: "Admin" }); // Adjust query as needed

    if (!users.length) {
      console.log(`No users found for department: ${department}`);
      return;
    }

    // Compose message
    const message = `The budget for ${department} is nearing or exceeding its limit. Remaining budget: $${remainingBudget}`;

    // Notify all relevant users
    for (const user of users) {
      await sendNotification(user._id, message); // Reuse existing user-specific notification function
    }

    console.log(`Notifications sent for department: ${department}`);
  } catch (error) {
    console.error("Error sending budget notifications:", error.message);
  }
};

module.exports = sendBudgetNotification;
