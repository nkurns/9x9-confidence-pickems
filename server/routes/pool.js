const express = require("express");
const router = express.Router();
const Pool = require("../models/Pool");
const Game = require("../models/Game");
const Pick = require("../models/Pick");
const Participant = require("../models/Participant");
const auth = require("../middleware/auth");

// GET /api/pool - Get the active pool
router.get("/", async (req, res) => {
  console.log("Pool route hit!");
  try {
    const pool = await Pool.findOne({ isActive: true });
    console.log("Pool found:", pool);

    if (!pool) {
      return res.status(404).json({ message: "No active pool found" });
    }

    res.json(pool);
  } catch (error) {
    console.error("Pool route error:", error);
    res
      .status(500)
      .json({ message: "Error fetching pool", error: error.message });
  }
});

// Example route for getting participating pools
router.get("/participating", auth, async (req, res) => {
  try {
    // Logic to fetch participating pools for the authenticated user
    const pools = await Pool.find({ participants: req.user.userId }); // Example query
    res.json(pools);
  } catch (error) {
    console.error("Error fetching participating pools:", error);
    res.status(500).json({ message: "Error fetching participating pools" });
  }
});

// Get active pool
router.get("/active", async (req, res) => {
  try {
    const activePool = await Pool.findOne({ isActive: true });
    if (!activePool) {
      return res.status(404).json({ message: "No active pool found" });
    }
    res.json(activePool);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pool participants
router.get("/:poolId/participants", async (req, res) => {
  try {
    const { poolId } = req.params;
    console.log("Looking for participants in pool:", poolId);

    // Get participants who have joined this pool
    const participants = await Participant.find(
      { "participatingPools.poolId": poolId },
      "_id displayName username"
    ).lean();

    console.log("Found participants in pool:", participants);
    res.json(participants);
  } catch (error) {
    console.error("Error fetching pool participants:", error);
    res.status(500).json({ message: error.message });
  }
});

// Add this route to your existing pool routes
router.get("/available", auth, async (req, res) => {
  try {
    console.log("Fetching available pools for user:", req.user.id);

    // Log all pools first
    const allPools = await Pool.find({});
    console.log("All pools in database:", allPools);

    // Update query to use isActive instead of status
    const pools = await Pool.find({
      participants: { $ne: req.user.id },
      isActive: true, // Changed from status: "active"
    });

    console.log("Query criteria:", {
      participantsExclude: req.user.id,
      isActive: true,
    });

    console.log("Found available pools:", pools);
    res.json(pools);
  } catch (error) {
    console.error("Error fetching available pools:", error);
    res.status(500).json({ message: "Error fetching available pools" });
  }
});

// Add this route to handle joining pools
router.post("/:poolId/join", auth, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.poolId);

    if (!pool) {
      return res.status(404).json({ message: "Pool not found" });
    }

    if (pool.participants.includes(req.user.id)) {
      return res.status(400).json({ message: "Already a member of this pool" });
    }

    pool.participants.push(req.user.id);
    await pool.save();

    res.json({ message: "Successfully joined pool" });
  } catch (error) {
    console.error("Error joining pool:", error);
    res.status(500).json({ message: "Error joining pool" });
  }
});

module.exports = router;
