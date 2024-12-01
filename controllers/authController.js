// AuthController.js

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");
const User = require("../models/User"); // Assuming you have a User model
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const createLog = require("../helpers/logHelpers");
const Notification = require("../models/notificationModel");

// Register user
const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, name, email, password, department, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      username,
      name,
      email,
      password: hashedPassword,
      department,
      role,
    });

    await user.save();

    // Generate JWT token
    const payload = {
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({ msg: "User registered successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Login user
const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User not Found" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    // Generate tokens
    const payload = {
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    });

    // Save refresh token to the user
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ msg: "User logged in", token, refreshToken });
    // res.json({ token, refreshToken });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

// Refresh Token
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res
      .status(400)
      .json({ msg: "No refresh token, authorization denied" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ msg: "Invalid refresh token" });
    }

    const newToken = jwt.sign(
      { userId: user.user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ msg: "Invalid or expired refresh token" });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send password reset email with token link
    const resetUrl = `http://yourdomain.com/reset-password?token=${resetToken}`;

    // Create a transporter to send the email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "youremail@gmail.com",
        pass: "yourpassword",
      },
    });

    const mailOptions = {
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).json({ msg: "Email sending failed" });
      }
      res.json({ msg: "Password reset email sent" });
    });

    // Send email (omitting actual email sending here for security reasons)
    res.json({ msg: `"Reset token sent to email" ${resetToken}` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Change password
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  // Ensure both oldPassword and newPassword are provided
  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ msg: "Both old and new passwords are required" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect old password" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Logout User
const logoutUser = async (req, res) => {
  let user = await User.findById(req.user.id);
  if (!user) {
    return res.status(400).json({ msg: "User not found" });
  }

  // Remove the refresh token from the database
  user.refreshToken = null;
  await user.save();

  res.json({ msg: "User logged out successfully" });
};

// View Profile
const viewProfile = async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select(
      "-password -refreshToken -resetPasswordToken -resetPasswordExpire"
    );
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  const { username, name, email, password } = req.body;
  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    // Update name and email
    if (username) user.username = username;
    if (name) user.name = name;
    if (email) user.email = email;

    // If password is provided, hash it before saving
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({ msg: "Profile updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// View all users (Admin-only route)
const allUser = async (req, res) => {
  try {
    User.find({}, "username name email department role")
      .then((users) => res.status(200).json(users))
      .catch((err) =>
        res
          .status(500)
          .json({ msg: "Error fetching users", error: err.message })
      );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
// Update a user's role (Admin-only route)
const allUserUpdate = async (req, res) => {
  const { id } = req.params;
  const { newRole } = req.body;
  const performedBy = req.user.id; // Logged-in user's ID

  // Validate role
  const validRoles = ["Admin", "Team Lead", "Employee"];
  if (!validRoles.includes(newRole)) {
    return res.status(400).json({ msg: "Invalid role specified" });
  }

  try {
    // Find user by ID
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Update user's role
    targetUser.role = newRole;
    // Ensure all required fields are populated
    if (!targetUser.username || !targetUser.name || !targetUser.email) {
      return res.status(400).json({ msg: "User has missing required fields" });
    }

    await targetUser.save();

    // Log the action
    try {
      const log = await createLog({
        user: targetUser._id,
        action: "promoted",
        resource: "user",
        performedBy,
        targetUser: targetUser._id,
        details: `Promoted ${targetUser.username} to ${newRole}`,
      });
      // console.log("Log saved successfully:", log);
    } catch (logError) {
      console.error("Error saving log:", logError.message);
    }
    // After role update
    await Notification.create({
      recipient: targetUser._id,
      message: `Your role has been updated to ${newRole}`,
    });
    // Respond with success
    res.status(200).json({
      msg: "Role updated successfully",
      user: targetUser,
      message: `${targetUser.name} promoted to ${newRole}`,
    });
  } catch (err) {
    res.status(500).json({ msg: "Error updating role", error: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  logoutUser,
  viewProfile,
  updateProfile,
  allUser,
  allUserUpdate,
};
