const Permission = require("../models/permissionModel");

const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.role;

      // Check if the role has permissions for the action on the resource
      const permission = await Permission.findOne({
        role: userRole,
        resource,
        actions: { $in: [action] },
      });

      if (!permission) {
        return res.status(403).json({
          msg: "Access denied. You do not have the required permissions.",
        });
      }

      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  };
};

module.exports = checkPermission;

// const Permission = require("./models/Permission");

// const seedPermissions = async () => {
//   await Permission.create([
//     { role: "Admin", resource: "dashboard", actions: ["read"] },
//     { role: "Team Lead", resource: "projects", actions: ["read", "write"] },
//     { role: "Employee", resource: "tasks", actions: ["read"] },
//   ]);
//   console.log("Permissions seeded");
// };

// seedPermissions();
