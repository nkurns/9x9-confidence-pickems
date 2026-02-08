const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    console.log("Auth header received:", authHeader);

    const token = authHeader?.replace("Bearer ", "");
    console.log("Processed token:", token);

    if (!token) {
      return res
        .status(401)
        .json({ message: "No authentication token, access denied" });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Successfully decoded token:", decoded);

      // Check token expiration
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return res.status(401).json({
          message: "Token expired",
          expired: true,
        });
      }

      // Add user info to request
      req.user = decoded;
      console.log("Auth middleware - User set:", req.user);
      next();
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return res.status(401).json({
        message: "Token verification failed",
        error: jwtError.message,
        expired: jwtError.name === "TokenExpiredError",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Authorization failed" });
  }
};

module.exports = authMiddleware;
