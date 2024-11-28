const checkRole = (roles) => (req, res, next) => {
  if (!req.user || !req.user.roles) {
    return res.status(403).json({ msg: "Access denied" });
  }

  if (req.user.roles !== roles) {
    return res.status(403).json({ msg: "You do not have permission" });
  }
  next();
};

module.exports = checkRole;
