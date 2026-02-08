const express = require("express");
const router = express.Router();
const Pick = require("../models/Pick");
const Game = require("../models/Game");
const Pool = require("../models/Pool");
const Participant = require("../models/Participant");
const auth = require("../middleware/auth");

// POST route to save multiple picks
// Supports dependentId for picking on behalf of a child/dependent
router.post("/", auth, async (req, res) => {
  try {
    console.log("Received picks payload:", req.body);
    const { participantId, dependentId, picks, upsert } = req.body;

    // Enhanced validation
    if (!participantId || !picks || !Array.isArray(picks)) {
      console.error("Invalid request format:", {
        hasUserId: !!participantId,
        hasPicks: !!picks,
        isArray: Array.isArray(picks),
      });
      return res.status(400).json({
        message: "Invalid request format",
        details: {
          participantId: !!participantId,
          picks: !!picks,
          isArray: Array.isArray(picks),
        },
      });
    }

    // If dependentId provided, verify it belongs to this participant
    if (dependentId) {
      const participant = await Participant.findById(participantId);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      const dependent = participant.dependents.id(dependentId);
      if (!dependent) {
        return res.status(404).json({ message: "Dependent not found" });
      }
    }

    // Validate each pick
    for (const pick of picks) {
      const missingFields = {
        gameId: !pick.gameId,
        selectedTeam: !pick.selectedTeam,
        confidencePoints: pick.confidencePoints === undefined || pick.confidencePoints === null,
        poolId: !pick.poolId,
        round: !pick.round,
      };

      if (Object.values(missingFields).some(missing => missing)) {
        console.error("Invalid pick data:", pick);
        return res.status(400).json({
          message: "Invalid pick data",
          details: {
            pick,
            missing: missingFields,
          },
        });
      }
    }

    // Check for duplicate point values within the same round
    const pointsByRound = {};
    for (const pick of picks) {
      if (!pointsByRound[pick.round]) {
        pointsByRound[pick.round] = new Set();
      }
      if (pointsByRound[pick.round].has(pick.confidencePoints)) {
        return res.status(400).json({
          message: `Duplicate points value ${pick.confidencePoints} found in ${pick.round} round`,
        });
      }
      pointsByRound[pick.round].add(pick.confidencePoints);
    }

    // Create/Update picks
    const createdPicks = await Promise.all(
      picks.map(async (pick) => {
        try {
          if (upsert) {
            // Try to find existing pick (include dependentId in search)
            const existingPick = await Pick.findOne({
              participantId,
              dependentId: dependentId || null,
              gameId: pick.gameId,
              poolId: pick.poolId,
            });

            if (existingPick) {
              console.log("Updating existing pick:", existingPick._id);
              Object.assign(existingPick, {
                selectedTeam: pick.selectedTeam,
                confidencePoints: pick.confidencePoints,
              });
              return existingPick.save();
            }
          }

          console.log("Creating new pick for game:", pick.gameId, dependentId ? `(dependent: ${dependentId})` : "");
          const newPick = new Pick({
            participantId,
            dependentId: dependentId || null,
            gameId: pick.gameId,
            poolId: pick.poolId,
            round: pick.round,
            selectedTeam: pick.selectedTeam,
            confidencePoints: pick.confidencePoints,
          });
          return newPick.save();
        } catch (error) {
          console.error("Error saving pick:", error);
          throw error;
        }
      })
    );

    console.log("Successfully saved picks:", createdPicks.length);
    res.status(201).json({
      message: "Picks saved successfully",
      picks: createdPicks,
    });
  } catch (error) {
    console.error("Error in /picks POST route:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET route to fetch picks summary
router.get("/summary", auth, async (req, res) => {
  try {
    // Get active pool
    const activePool = await Pool.findOne({ isActive: true });
    if (!activePool) {
      return res.status(404).json({ message: "No active pool found" });
    }

    // Get all games for the pool (newest first)
    const games = await Game.find({ poolId: activePool._id }).sort({
      gameTime: -1,
    });

    // Get all picks for these games
    const allPicks = await Pick.find({ poolId: activePool._id });

    // Get all participants who have picks in this pool
    const participantIds = await Pick.distinct("participantId", {
      poolId: activePool._id,
    });
    const participants = await Participant.find({ _id: { $in: participantIds } });

    // Build a list of all "pickers" (participants + their dependents who have picks)
    // Each picker gets a unique pickerId: participantId for self, participantId:dependentId for dependents
    const pickers = [];

    participants.forEach((participant) => {
      // Check if this participant has any self-picks (no dependentId)
      const selfPicks = allPicks.filter(
        (pick) => pick.participantId.toString() === participant._id.toString() && !pick.dependentId
      );
      if (selfPicks.length > 0) {
        pickers.push({
          pickerId: participant._id.toString(),
          participantId: participant._id,
          dependentId: null,
          displayName: participant.displayName || participant.username,
          isDependent: false,
        });
      }

      // Check for dependent picks
      if (participant.dependents && participant.dependents.length > 0) {
        participant.dependents.forEach((dep) => {
          const depPicks = allPicks.filter(
            (pick) => pick.participantId.toString() === participant._id.toString() &&
                      pick.dependentId && pick.dependentId.toString() === dep._id.toString()
          );
          if (depPicks.length > 0) {
            pickers.push({
              pickerId: `${participant._id}:${dep._id}`,
              participantId: participant._id,
              dependentId: dep._id,
              displayName: dep.displayName,
              parentName: participant.displayName || participant.username,
              isDependent: true,
            });
          }
        });
      }
    });

    // Calculate points summary for each picker
    const pointsSummary = {};
    pickers.forEach((picker) => {
      const pickerPicks = allPicks.filter((pick) => {
        const matchesParticipant = pick.participantId.toString() === picker.participantId.toString();
        if (picker.isDependent) {
          return matchesParticipant && pick.dependentId && pick.dependentId.toString() === picker.dependentId.toString();
        }
        return matchesParticipant && !pick.dependentId;
      });

      const totalPoints = pickerPicks.reduce(
        (sum, pick) => sum + (pick.isCorrect ? pick.confidencePoints : 0),
        0
      );
      const maxPoints = pickerPicks.reduce(
        (sum, pick) => sum + pick.confidencePoints,
        0
      );

      pointsSummary[picker.pickerId] = {
        totalPoints,
        maxPoints,
      };
    });

    // Format games with their picks
    const formattedGames = games.map((game) => {
      const gamePicks = allPicks.filter(
        (pick) => pick.gameId.toString() === game._id.toString()
      );
      const picks = {};

      gamePicks.forEach((pick) => {
        // Use pickerId format: participantId for self, participantId:dependentId for dependents
        const pickerId = pick.dependentId
          ? `${pick.participantId}:${pick.dependentId}`
          : pick.participantId.toString();

        picks[pickerId] = {
          selectedTeam: pick.selectedTeam,
          confidencePoints: pick.confidencePoints,
          isCorrect: pick.isCorrect,
        };
      });

      return {
        gameId: game._id,
        gameTitle: game.gameTitle,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        gameTime: game.gameTime,
        round: game.round,
        picks,
      };
    });

    res.json({
      poolId: activePool._id,
      poolName: activePool.name,
      round: activePool.round || "Wild Card Round",
      games: formattedGames,
      pickers, // New: list of all pickers (participants + dependents)
      pointsSummary,
    });
  } catch (error) {
    console.error("Error in picks summary:", error);
    res.status(500).json({ message: "Error fetching picks summary" });
  }
});

// Add this route to get user's picks
router.get("/user", auth, async (req, res) => {
  try {
    console.log("Fetching picks for user:", req.user.id);

    const picks = await Pick.find({ participantId: req.user.id })
      .populate("gameId")
      .lean();

    console.log("Found picks:", picks.length);

    if (!picks.length) {
      console.log("No picks found for user");
      return res.json([]);
    }

    const formattedPicks = picks.map((pick) => {
      console.log("Formatting pick:", pick);
      return {
        gameId: pick.gameId._id,
        gameTitle: pick.gameId.gameTitle,
        selectedTeam: pick.selectedTeam,
        confidencePoints: pick.confidencePoints,
        round: pick.round,
      };
    });

    console.log("Sending formatted picks:", formattedPicks);
    res.json(formattedPicks);
  } catch (error) {
    console.error("Error fetching user picks:", error);
    res
      .status(500)
      .json({ message: "Error fetching picks", error: error.message });
  }
});

router.get("/status", auth, async (req, res) => {
  try {
    // Get active pool
    const activePool = await Pool.findOne({ isActive: true });
    if (!activePool) {
      return res.status(404).json({ message: "No active pool found" });
    }

    // Get total number of upcoming games
    const totalGames = await Game.countDocuments({
      poolId: activePool._id,
      gameTime: { $gte: new Date() },
    });

    // Get number of games user has picked
    const pickedGames = await Pick.countDocuments({
      participantId: req.user.id,
      poolId: activePool._id,
      gameId: {
        $in: await Game.find({
          poolId: activePool._id,
          gameTime: { $gte: new Date() },
        }).distinct("_id"),
      },
    });

    res.json({ pickedGames, totalGames });
  } catch (error) {
    console.error("Error getting picks status:", error);
    res.status(500).json({ message: "Error getting picks status" });
  }
});

// Add this new route to get picks status
// Supports ?dependentId query param for checking dependent's picks
router.get("/status/:poolId", auth, async (req, res) => {
  try {
    const { dependentId } = req.query;

    const query = {
      participantId: req.user.id,
      poolId: req.params.poolId,
      dependentId: dependentId || null,
    };

    const picks = await Pick.find(query);

    const totalGames = await Game.countDocuments({ poolId: req.params.poolId });
    const picksMade = picks.length;

    res.json({
      picksMade,
      remainingPicks: totalGames - picksMade,
      isComplete: picksMade === totalGames,
    });
  } catch (error) {
    console.error("Error fetching picks status:", error);
    res.status(500).json({ message: "Error fetching picks status" });
  }
});

// Get picks by pool ID
// Supports ?dependentId query param for fetching dependent's picks
router.get("/pool/:poolId", auth, async (req, res) => {
  try {
    const { dependentId } = req.query;

    const query = {
      participantId: req.user.id,
      poolId: req.params.poolId,
      dependentId: dependentId || null,
    };

    const picks = await Pick.find(query)
      .populate("gameId")
      .lean();

    if (!picks || picks.length === 0) {
      return res.status(404).json({ message: "No picks found" });
    }

    const formattedPicks = picks.map((pick) => ({
      pickId: pick._id,
      gameId: pick.gameId._id,
      gameTitle: pick.gameId.gameTitle,
      homeTeam: pick.gameId.homeTeam,
      awayTeam: pick.gameId.awayTeam,
      selectedTeam: pick.selectedTeam,
      confidencePoints: pick.confidencePoints,
      isComplete: pick.gameId.isComplete,
      winner: pick.gameId.winner,
      isCorrect: pick.isCorrect,
      gameTime: pick.gameId.gameTime,
      round: pick.gameId.round,
      createdAt: pick._id.getTimestamp(),
      dependentId: pick.dependentId,
    }));

    res.json(formattedPicks);
  } catch (error) {
    console.error("Error fetching pool picks:", error);
    res.status(500).json({ message: "Error fetching pool picks" });
  }
});

// Get all picks for user AND their dependents for a pool
router.get("/pool/:poolId/all", auth, async (req, res) => {
  try {
    // Get participant with dependents
    const participant = await Participant.findById(req.user.id).select("dependents displayName username");
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    // Get all picks for this user (self + all dependents)
    const picks = await Pick.find({
      participantId: req.user.id,
      poolId: req.params.poolId,
    })
      .populate("gameId")
      .lean();

    // Group picks by picker (self or dependent)
    const selfPicks = picks.filter(p => !p.dependentId);
    const dependentPicks = {};

    participant.dependents.forEach(dep => {
      dependentPicks[dep._id.toString()] = {
        dependentId: dep._id,
        displayName: dep.displayName,
        picks: picks.filter(p => p.dependentId && p.dependentId.toString() === dep._id.toString()),
      };
    });

    res.json({
      self: {
        displayName: participant.displayName || participant.username,
        picks: selfPicks.map(formatPick),
      },
      dependents: Object.values(dependentPicks).map(d => ({
        ...d,
        picks: d.picks.map(formatPick),
      })),
    });

    function formatPick(pick) {
      return {
        pickId: pick._id,
        gameId: pick.gameId._id,
        gameTitle: pick.gameId.gameTitle,
        homeTeam: pick.gameId.homeTeam,
        awayTeam: pick.gameId.awayTeam,
        selectedTeam: pick.selectedTeam,
        confidencePoints: pick.confidencePoints,
        isComplete: pick.gameId.isComplete,
        winner: pick.gameId.winner,
        isCorrect: pick.isCorrect,
        gameTime: pick.gameId.gameTime,
        round: pick.gameId.round,
      };
    }
  } catch (error) {
    console.error("Error fetching all picks:", error);
    res.status(500).json({ message: "Error fetching picks" });
  }
});

module.exports = router;
