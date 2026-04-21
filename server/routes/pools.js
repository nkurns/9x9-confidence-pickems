const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Pool = require("../models/Pool");
const Participant = require("../models/Participant");
const Game = require("../models/Game");
const Pick = require("../models/Pick");
const auth = require("../middleware/auth");
const poolAdmin = require("../middleware/poolAdmin");

function generateInviteCode(poolName) {
  const prefix = poolName
    .slice(0, 4)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const suffix = crypto.randomBytes(3).toString("hex");
  return prefix ? `${prefix}-${suffix}` : suffix;
}

// Get active pool - this must come BEFORE the /:id route
router.get("/active", auth, async (req, res) => {
  try {
    console.log("Fetching active pool...");
    console.log("User ID:", req.user.id);

    const activePool = await Pool.findOne({ isActive: true });
    console.log("Found active pool:", activePool);

    if (!activePool) {
      console.log("No active pool found");
      return res.status(404).json({ message: "No active pool found" });
    }

    // Get participant's pool data
    console.log("Finding participant...");
    const participant = await Participant.findById(req.user.id)
      .populate("participatingPools.poolId")
      .select("participatingPools");
    console.log("Found participant:", participant);

    if (!participant) {
      console.log("Participant not found");
      return res.status(404).json({ message: "Participant not found" });
    }

    // Check if participant is in this pool
    const participantPool = participant.participatingPools.find(
      (p) => p.poolId._id.toString() === activePool._id.toString()
    );
    console.log("Participant pool:", participantPool);

    if (!participantPool) {
      console.log("User not in active pool");
      return res.status(403).json({
        message: "You are not a participant in the active pool",
      });
    }

    // Return pool with participant-specific data
    const response = {
      _id: activePool._id,
      name: activePool.name,
      startDate: activePool.startDate,
      endDate: activePool.endDate,
      isActive: activePool.isActive,
      totalGames: activePool.totalGames,
      joinedAt: participantPool.joinedAt,
    };
    console.log("Sending response:", response);
    res.json(response);
  } catch (error) {
    console.error("Error in /pools/active:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: "Error fetching active pool",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Get available pools
router.get("/available", auth, async (req, res) => {
  try {
    console.log("Fetching available pools for user:", req.user.id);
    const pools = await Pool.find({ isActive: true });
    console.log("Found pools:", pools.length);

    // Add participant count to each pool
    const poolsWithCount = pools.map(pool => ({
      _id: pool._id,
      name: pool.name,
      startDate: pool.startDate,
      endDate: pool.endDate,
      isActive: pool.isActive,
      entryFee: pool.entryFee,
      participantCount: pool.participants ? pool.participants.length : 0,
    }));

    res.json(poolsWithCount);
  } catch (error) {
    console.error("Error fetching available pools:", error);
    res.status(500).json({ message: "Error fetching available pools" });
  }
});

// Get pools where user is admin
router.get("/admin", auth, async (req, res) => {
  try {
    console.log("Fetching admin pools for user:", req.user.id);
    const pools = await Pool.find({ admin: req.user.id });
    console.log("Found admin pools:", pools.length);
    res.json(pools);
  } catch (error) {
    console.error("Error fetching admin pools:", error);
    res.status(500).json({ message: "Error fetching admin pools" });
  }
});

// GET /api/pools/invite/:inviteCode — public, fetch pool info by invite code
router.get("/invite/:inviteCode", async (req, res) => {
  try {
    const pool = await Pool.findOne({ inviteCode: req.params.inviteCode });
    if (!pool) {
      return res.status(404).json({ message: "Invite link not found" });
    }
    res.json({ _id: pool._id, name: pool.name, inviteCode: pool.inviteCode });
  } catch (error) {
    console.error("Error fetching pool by invite code:", error);
    res.status(500).json({ message: "Error fetching pool" });
  }
});

// Get pool by ID - this must come AFTER /active, /available, and /invite
router.get("/:id", auth, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);
    if (!pool) {
      return res.status(404).json({ message: "Pool not found" });
    }
    res.json(pool);
  } catch (error) {
    console.error("Error fetching pool:", error);
    res.status(500).json({ message: "Error fetching pool" });
  }
});

// Join a pool
router.post("/:id/join", auth, async (req, res) => {
  try {
    const pool = await Pool.findById(req.params.id);
    if (!pool) {
      return res.status(404).json({ message: "Pool not found" });
    }

    // Check if participant is already in the pool
    const participant = await Participant.findById(req.user.id);
    const alreadyJoined = participant.participatingPools.some(
      (p) => p.poolId.toString() === pool._id.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({ message: "Already joined this pool" });
    }

    // Add pool to participant's list
    participant.participatingPools.push({
      poolId: pool._id,
      joinedAt: new Date(),
    });
    await participant.save();

    // Add participant to pool's participants array
    if (!pool.participants.includes(req.user.id)) {
      pool.participants.push(req.user.id);
      await pool.save();
    }

    res.json({ message: "Successfully joined pool" });
  } catch (error) {
    console.error("Error joining pool:", error);
    res.status(500).json({ message: "Error joining pool" });
  }
});

// Leave a pool
router.post("/:id/leave", auth, async (req, res) => {
  try {
    const participant = await Participant.findById(req.user.id);
    participant.participatingPools = participant.participatingPools.filter(
      (p) => p.poolId.toString() !== req.params.id
    );
    await participant.save();

    // Remove participant from pool's participants array
    const pool = await Pool.findById(req.params.id);
    if (pool) {
      pool.participants = pool.participants.filter(
        (p) => p.toString() !== req.user.id
      );
      await pool.save();
    }

    res.json({ message: "Successfully left pool" });
  } catch (error) {
    console.error("Error leaving pool:", error);
    res.status(500).json({ message: "Error leaving pool" });
  }
});

// Delete a pool (admin only) — cascades to games, picks, and participant records
router.delete("/:id", auth, poolAdmin, async (req, res) => {
  try {
    const poolId = req.params.id;

    // Remove all games and picks for this pool
    await Game.deleteMany({ poolId });
    await Pick.deleteMany({ poolId });

    // Remove pool from all participants' participatingPools arrays
    await Participant.updateMany(
      { "participatingPools.poolId": poolId },
      { $pull: { participatingPools: { poolId } } }
    );

    await Pool.findByIdAndDelete(poolId);

    res.json({ message: "Pool deleted successfully" });
  } catch (error) {
    console.error("Error deleting pool:", error);
    res.status(500).json({ message: "Error deleting pool" });
  }
});

// Update pool settings (admin only)
router.put("/:id", auth, poolAdmin, async (req, res) => {
  try {
    const { name, totalGames, startDate, endDate, isActive } = req.body;

    // Pool is already attached by poolAdmin middleware
    const pool = req.pool;

    // Update fields if provided
    if (name) pool.name = name;
    if (totalGames) pool.totalGames = totalGames;
    if (startDate) pool.startDate = startDate;
    if (endDate) pool.endDate = endDate;
    if (isActive !== undefined) pool.isActive = isActive;

    await pool.save();
    res.json(pool);
  } catch (error) {
    console.error("Error updating pool:", error);
    res.status(500).json({ message: "Error updating pool" });
  }
});

// POST /api/pools/invite/:inviteCode/join — auth required, join via invite
router.post("/invite/:inviteCode/join", auth, async (req, res) => {
  try {
    const pool = await Pool.findOne({ inviteCode: req.params.inviteCode });
    if (!pool) {
      return res.status(404).json({ message: "Invite link not found" });
    }

    const participant = await Participant.findById(req.user.id);
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    const alreadyJoined = participant.participatingPools.some(
      (p) => p.poolId.toString() === pool._id.toString()
    );

    if (alreadyJoined) {
      return res.json({ message: "Already in this pool", poolId: pool._id });
    }

    participant.participatingPools.push({ poolId: pool._id, joinedAt: new Date() });
    await participant.save();

    if (!pool.participants.includes(req.user.id)) {
      pool.participants.push(req.user.id);
      await pool.save();
    }

    res.json({ message: "Successfully joined pool", poolId: pool._id });
  } catch (error) {
    console.error("Error joining pool via invite:", error);
    res.status(500).json({ message: "Error joining pool" });
  }
});

// POST /api/pools/:id/invite-code — generate invite code for existing pool (admin only)
router.post("/:id/invite-code", auth, poolAdmin, async (req, res) => {
  try {
    const pool = req.pool;
    pool.inviteCode = generateInviteCode(pool.name);
    await pool.save();
    res.json({ inviteCode: pool.inviteCode });
  } catch (error) {
    console.error("Error generating invite code:", error);
    res.status(500).json({ message: "Error generating invite code" });
  }
});

// Create a new pool - creator becomes the admin
router.post("/", auth, async (req, res) => {
  try {
    const { name, startDate, endDate, totalGames, entryFee } = req.body;

    const pool = new Pool({
      name,
      startDate,
      endDate,
      totalGames: totalGames || 13,
      entryFee,
      isActive: true,
      admin: req.user.id, // Creator becomes admin
      participants: [req.user.id], // Admin is automatically a participant
      inviteCode: generateInviteCode(name),
    });

    await pool.save();

    // Also add pool to admin's participatingPools
    const participant = await Participant.findById(req.user.id);
    if (participant) {
      participant.participatingPools.push({
        poolId: pool._id,
        joinedAt: new Date(),
      });
      await participant.save();
    }

    res.status(201).json(pool);
  } catch (error) {
    console.error("Error creating pool:", error);
    res.status(500).json({ message: "Error creating pool" });
  }
});

module.exports = router;
