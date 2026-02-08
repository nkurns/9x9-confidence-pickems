const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Participant = require("../models/Participant");
const Pool = require("../models/Pool");
const Pick = require("../models/Pick");
const Game = require("../models/Game");
const auth = require("../middleware/auth");
const poolAdmin = require("../middleware/poolAdmin");

// GET participant profile
router.get("/profile", auth, async (req, res) => {
  try {
    console.log("Fetching profile for participant ID:", req.user.id);
    const participant = await Participant.findById(req.user.id).select(
      "-password"
    );

    if (!participant) {
      console.log("Participant not found for ID:", req.user.id);
      return res.status(404).json({ message: "Participant not found" });
    }

    console.log("Found participant:", participant);
    res.json(participant);
  } catch (error) {
    console.error("Error fetching participant profile:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// Update participant profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { displayName, email, location } = req.body;

    // Validate email format if provided
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate display name length
    if (displayName && (displayName.length < 2 || displayName.length > 50)) {
      return res.status(400).json({
        message: "Display name must be between 2 and 50 characters",
      });
    }

    // Find participant and update
    const participant = await Participant.findById(req.user.id);
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    // Update fields if provided
    if (displayName) participant.displayName = displayName;
    if (email) participant.email = email;
    if (location) participant.location = location;

    await participant.save();

    // Return updated participant without password
    const updatedParticipant = await Participant.findById(req.user.id).select(
      "-password"
    );
    res.json(updatedParticipant);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// Add test route at the top of the file
router.get("/test-auth", auth, (req, res) => {
  res.json({
    message: "Auth successful",
    user: req.user,
  });
});

// ==========================================
// DEPENDENT MANAGEMENT ROUTES
// (Must come before /:id routes to avoid "dependents" being parsed as an ID)
// ==========================================

// Get all dependents for current user
router.get("/dependents", auth, async (req, res) => {
  try {
    const participant = await Participant.findById(req.user.id).select("dependents");
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }
    res.json(participant.dependents || []);
  } catch (error) {
    console.error("Error fetching dependents:", error);
    res.status(500).json({ message: "Error fetching dependents" });
  }
});

// Add a new dependent
router.post("/dependents", auth, async (req, res) => {
  try {
    const { displayName } = req.body;

    if (!displayName || displayName.trim().length < 2) {
      return res.status(400).json({ message: "Display name must be at least 2 characters" });
    }

    const participant = await Participant.findById(req.user.id);
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    // Initialize dependents array if it doesn't exist
    if (!participant.dependents) {
      participant.dependents = [];
    }

    // Check for duplicate name among dependents
    const existingDependent = participant.dependents.find(
      d => d.displayName.toLowerCase() === displayName.trim().toLowerCase()
    );
    if (existingDependent) {
      return res.status(400).json({ message: "A dependent with this name already exists" });
    }

    // Add the new dependent
    const newDependent = {
      displayName: displayName.trim(),
      createdAt: new Date(),
    };
    participant.dependents.push(newDependent);
    await participant.save();

    // Return the newly created dependent (last one in array)
    const createdDependent = participant.dependents[participant.dependents.length - 1];
    res.status(201).json(createdDependent);
  } catch (error) {
    console.error("Error adding dependent:", error);
    res.status(500).json({ message: "Error adding dependent" });
  }
});

// Update a dependent's name
router.put("/dependents/:id", auth, async (req, res) => {
  try {
    const { displayName } = req.body;
    const dependentId = req.params.id;

    if (!displayName || displayName.trim().length < 2) {
      return res.status(400).json({ message: "Display name must be at least 2 characters" });
    }

    const participant = await Participant.findById(req.user.id);
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    const dependent = participant.dependents.id(dependentId);
    if (!dependent) {
      return res.status(404).json({ message: "Dependent not found" });
    }

    // Check for duplicate name (excluding current dependent)
    const existingDependent = participant.dependents.find(
      d => d._id.toString() !== dependentId &&
           d.displayName.toLowerCase() === displayName.trim().toLowerCase()
    );
    if (existingDependent) {
      return res.status(400).json({ message: "A dependent with this name already exists" });
    }

    dependent.displayName = displayName.trim();
    await participant.save();

    res.json(dependent);
  } catch (error) {
    console.error("Error updating dependent:", error);
    res.status(500).json({ message: "Error updating dependent" });
  }
});

// Delete a dependent
router.delete("/dependents/:id", auth, async (req, res) => {
  try {
    const dependentId = req.params.id;
    const participant = await Participant.findById(req.user.id);

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    if (!participant.dependents) {
      return res.status(404).json({ message: "Dependent not found" });
    }

    const dependent = participant.dependents.id(dependentId);
    if (!dependent) {
      return res.status(404).json({ message: "Dependent not found" });
    }

    // Remove the dependent
    participant.dependents.pull(dependentId);
    await participant.save();

    res.json({ message: "Dependent removed successfully" });
  } catch (error) {
    console.error("Error removing dependent:", error);
    res.status(500).json({ message: "Error removing dependent" });
  }
});

// ==========================================
// PARTICIPANT-SPECIFIC ROUTES (with :id parameter)
// ==========================================

// Get participant's pools
router.get("/:id/pools", auth, async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id)
      .populate("participatingPools.poolId")
      .select("participatingPools");

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    const pools = participant.participatingPools.map((pool) => ({
      poolId: pool.poolId._id,
      name: pool.poolId.name,
      joinedAt: pool.joinedAt,
      isActive: pool.poolId.isActive,
    }));

    res.json({ pools });
  } catch (error) {
    console.error("Error fetching participant pools:", error);
    res.status(500).json({ message: "Error fetching pools" });
  }
});

// Get all participants in a pool (admin only)
// Includes dependents for each participant
router.get("/pool/:poolId", auth, poolAdmin, async (req, res) => {
  try {
    const participants = await Participant.find({
      "participatingPools.poolId": req.params.poolId
    }).select("_id displayName email username dependents");

    const totalGames = await Game.countDocuments({ poolId: req.params.poolId });

    // Get picks count for each participant and their dependents
    const participantsWithPicks = await Promise.all(
      participants.map(async (p) => {
        const picksCount = await Pick.countDocuments({
          participantId: p._id,
          poolId: req.params.poolId,
          dependentId: null
        });

        // Get picks count for each dependent
        const dependentsWithPicks = await Promise.all(
          (p.dependents || []).map(async (dep) => {
            const depPicksCount = await Pick.countDocuments({
              participantId: p._id,
              dependentId: dep._id,
              poolId: req.params.poolId
            });
            return {
              _id: dep._id,
              displayName: dep.displayName,
              parentId: p._id,
              parentName: p.displayName,
              picksCount: depPicksCount,
              totalGames,
              picksComplete: depPicksCount === totalGames
            };
          })
        );

        return {
          _id: p._id,
          displayName: p.displayName,
          email: p.email,
          username: p.username,
          picksCount,
          totalGames,
          picksComplete: picksCount === totalGames,
          dependents: dependentsWithPicks
        };
      })
    );

    res.json(participantsWithPicks);
  } catch (error) {
    console.error("Error fetching pool participants:", error);
    res.status(500).json({ message: "Error fetching participants" });
  }
});

// Create participant and add to pool (admin only)
router.post("/admin/create", auth, poolAdmin, async (req, res) => {
  try {
    const { displayName, email, poolId } = req.body;

    // Check if participant already exists
    let participant = await Participant.findOne({ email });

    if (participant) {
      // Check if already in this pool
      const alreadyInPool = participant.participatingPools.some(
        p => p.poolId.toString() === poolId
      );
      if (!alreadyInPool) {
        participant.participatingPools.push({ poolId, joinedAt: new Date() });
        await participant.save();
      }
      return res.json(participant);
    }

    // Create new participant with random password
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    const username = email.split("@")[0] + "_" + Math.random().toString(36).slice(-4);

    participant = new Participant({
      displayName,
      email,
      username,
      password: hashedPassword,
      participatingPools: [{ poolId, joinedAt: new Date() }]
    });

    await participant.save();
    res.status(201).json(participant);
  } catch (error) {
    console.error("Error creating participant:", error);
    res.status(500).json({ message: "Error creating participant", error: error.message });
  }
});

// Save picks on behalf of participant (admin only)
// Supports dependentId for saving picks for a dependent
// Only updates picks for games that are NOT complete
router.post("/admin/picks", auth, poolAdmin, async (req, res) => {
  try {
    const { participantId, dependentId, poolId, picks } = req.body;

    console.log("Admin saving picks:", { participantId, dependentId, poolId, picksCount: picks?.length });

    if (!participantId || !poolId || !picks || !Array.isArray(picks)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Convert dependentId to ObjectId if provided (it comes as string from frontend)
    const depId = dependentId ? new mongoose.Types.ObjectId(dependentId) : null;

    // Get list of completed game IDs - we won't touch picks for these
    const completedGames = await Game.find({ poolId, isComplete: true }).select('_id');
    const completedGameIds = completedGames.map(g => g._id.toString());

    // Filter out any picks for completed games (shouldn't happen but safety check)
    const validPicks = picks.filter(pick => !completedGameIds.includes(pick.gameId));

    if (validPicks.length === 0) {
      return res.json({ message: "No picks to save (all games already complete)", count: 0 });
    }

    // Get the gameIds we're updating
    const gameIdsToUpdate = validPicks.map(p => p.gameId);

    // Only delete existing picks for the games we're updating (not completed games)
    const deleteResult = await Pick.deleteMany({
      participantId,
      dependentId: depId,
      poolId,
      gameId: { $in: gameIdsToUpdate }
    });
    console.log("Deleted existing picks for incomplete games:", deleteResult.deletedCount);

    // Create new picks
    const newPicks = validPicks.map(pick => ({
      participantId,
      dependentId: depId,
      poolId,
      gameId: pick.gameId,
      selectedTeam: pick.selectedTeam,
      confidencePoints: pick.confidencePoints,
      round: pick.round
    }));

    const insertResult = await Pick.insertMany(newPicks);
    console.log("Inserted picks:", insertResult.length);

    res.json({ message: "Picks saved successfully", count: insertResult.length });
  } catch (error) {
    console.error("Error saving admin picks:", error);
    res.status(500).json({ message: "Error saving picks", error: error.message });
  }
});

// Get participant's picks for a pool
// Supports ?dependentId query param for fetching dependent's picks
router.get("/:participantId/picks/:poolId", auth, async (req, res) => {
  try {
    const { dependentId } = req.query;

    const query = {
      participantId: req.params.participantId,
      poolId: req.params.poolId,
      dependentId: dependentId || null
    };

    const picks = await Pick.find(query);
    res.json(picks);
  } catch (error) {
    console.error("Error fetching participant picks:", error);
    res.status(500).json({ message: "Error fetching picks" });
  }
});

module.exports = router;
