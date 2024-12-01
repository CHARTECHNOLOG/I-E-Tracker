require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const pagesRoutes = require("./routes/pages");
const protectedRoutes = require("./routes/protectedRoutes");
const adminRoutes = require("./routes/adminRoute");
const transactionRoutes = require("./routes/transactionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const budgetRoutes = require("./routes/budgetRoutes");

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes Placeholder
app.use("/", require("./routes/index"));
app.use("/api/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use("/api", adminRoutes);
app.use("/", pagesRoutes); // Use the pages routes
app.use("/api/transactions", transactionRoutes);
app.use("/api", budgetRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/uploads", express.static("uploads"));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Database connection error:", err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
