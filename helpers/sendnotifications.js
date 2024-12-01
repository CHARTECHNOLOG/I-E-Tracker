const Notification = require("../models/notificationModel");
const User = require("../models/User"); // Assuming you have a User model

const sendNotification = async (userId, message) => {
  try {
    // Fetch user data from DB (user model should be connected to your system)
    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found, notification not sent.");
      return;
    }

    // Log the notification to console or use an email service
    console.log(`Sending notification to ${user.email}: ${message}`);

    // Save the notification to the database (optional)
    const notification = new Notification({
      recipient: userId,
      message,
      timestamp: new Date(),
    });
    await notification.save();
  } catch (error) {
    console.error("Error sending notification:", error.message);
  }
};

module.exports = sendNotification;
