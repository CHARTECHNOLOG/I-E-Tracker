const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ["Admin", "Team Lead", "Employee"],
  },
  resource: {
    type: String,
    required: true,
  },
  actions: {
    type: [String], // e.g., ["read", "write", "update", "delete"]
    default: ["read"],
  },
});

module.exports = mongoose.model("Permission", permissionSchema);
