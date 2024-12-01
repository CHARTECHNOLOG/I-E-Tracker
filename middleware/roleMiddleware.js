const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ msg: "Forbidden: You don't have the right role" });
    }
    next();
  };
};

module.exports = roleMiddleware;
