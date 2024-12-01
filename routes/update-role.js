const logRoleChange = async (adminId, userId, oldRole, newRole) => {
  const Log = require("../models/logModel"); // Create a Log model if not already done
  await Log.create({
    action: "Role Change",
    performedBy: adminId,
    targetUser: userId,
    details: `Changed role from ${oldRole} to ${newRole}`,
    timestamp: new Date(),
  });
};

// Inside the update-role route
if (user.role !== newRole) {
  await logRoleChange(req.user.id, id, user.role, newRole);
}
