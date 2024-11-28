const express = require("express");
const router = express.Router();

// Home Page Route
router.get("/", (req, res) => {
  res.render("index", { title: "I E Tracker" });
});

module.exports = router;
