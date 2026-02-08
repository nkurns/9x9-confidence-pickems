const Pool = require("../models/Pool");

/**
 * Middleware to verify the authenticated user is the admin of the specified pool.
 * Must be used after auth middleware.
 *
 * Looks for poolId in: req.params.poolId, req.params.id, req.body.poolId, or req.query.poolId
 */
const poolAdminMiddleware = async (req, res, next) => {
  try {
    // Get poolId from various sources
    const poolId = req.params.poolId || req.params.id || req.body.poolId || req.query.poolId;

    if (!poolId) {
      return res.status(400).json({ message: "Pool ID is required" });
    }

    // Get the pool and check admin
    const pool = await Pool.findById(poolId);

    if (!pool) {
      return res.status(404).json({ message: "Pool not found" });
    }

    // Check if the current user is the admin of this pool
    if (pool.admin.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied. You are not the admin of this pool."
      });
    }

    // Attach pool to request for use in route handlers
    req.pool = pool;
    next();
  } catch (error) {
    console.error("Pool admin middleware error:", error);
    res.status(500).json({ message: "Error verifying pool admin status" });
  }
};

module.exports = poolAdminMiddleware;
