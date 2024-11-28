const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  // Retrieve token from the Authorization header
  const token = req.header("Authorization")?.split(" ")[1];

  // Check if no token is present
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // Verify the token with the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user information to the request object
    // req.user = decoded.user; // Ensure the decoded token contains 'user'
    // req.userRole = decoded.role; // Optionally attach the user's role to the request
    req.user = { id: decoded.userId, role: decoded.role }; // Attach userId to req.user
    req.userRole = decoded.role;
    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    // If the token is invalid or expired
    res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = authenticateToken;
