const express = require("express");
const router = express.Router();
const Game = require("../models/Game");
const Pool = require("../models/Pool");
const Pick = require("../models/Pick");
const auth = require("../middleware/auth");

// Get upcoming games
router.get("/upcoming", auth, async (req, res) => {
  try {
    console.log("Fetching upcoming games, current time:", new Date());

    // Get active pool
    const activePool = await Pool.findOne({ isActive: true });
    if (!activePool) {
      console.log("No active pool found");
      return res.status(404).json({ message: "No active pool found" });
    }

    // Find games for this pool
    const games = await Game.find({
      poolId: activePool._id,
      $or: [{ gameTime: { $gt: new Date() } }, { isComplete: false }],
    })
      .sort({ gameTime: 1 })
      .select(
        "gameTitle homeTeam awayTeam gameTime round tvNetwork isComplete winner poolId"
      )
      .lean();

    console.log("Found games:", games);

    // Format games for the frontend
    const formattedGames = games.map((game) => ({
      _id: game._id,
      gameTitle: game.gameTitle,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      round: game.round,
      gameTime: game.gameTime,
      tvNetwork: game.tvNetwork,
      isComplete: game.isComplete,
      winner: game.winner,
      poolId: game.poolId,
      status: game.isComplete ? "Final" : "Scheduled",
    }));

    if (formattedGames.length === 0) {
      console.log("No upcoming games found for pool:", activePool._id);
      // Debug: Let's check all games
      const allGames = await Game.find({ poolId: activePool._id }).lean();
      console.log("All games in pool:", allGames);
    }

    res.json(formattedGames);
  } catch (error) {
    console.error("Error fetching upcoming games:", error);
    res.status(500).json({ message: "Error fetching upcoming games" });
  }
});

// Add route to get games by pool ID (returns ALL games, not just upcoming)
router.get("/pool/:poolId", auth, async (req, res) => {
  try {
    const games = await Game.find({
      poolId: req.params.poolId,
    })
      .sort({ gameTime: 1 })
      .select(
        "gameTitle homeTeam awayTeam gameTime round tvNetwork isComplete winner poolId"
      )
      .lean();

    const formattedGames = games.map((game) => ({
      _id: game._id,
      gameTitle: game.gameTitle,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      round: game.round,
      gameTime: game.gameTime,
      tvNetwork: game.tvNetwork,
      isComplete: game.isComplete,
      winner: game.winner,
      poolId: game.poolId,
      status: game.isComplete ? "Final" : "Scheduled",
    }));

    res.json(formattedGames);
  } catch (error) {
    console.error("Error fetching pool games:", error);
    res.status(500).json({ message: "Error fetching pool games" });
  }
});

// Create a new game
router.post("/", auth, async (req, res) => {
  try {
    const { gameTitle, homeTeam, awayTeam, gameTime, round, tvNetwork, poolId } = req.body;

    const game = new Game({
      gameTitle,
      homeTeam,
      awayTeam,
      gameTime: new Date(gameTime),
      startTime: new Date(gameTime),
      round,
      tvNetwork,
      poolId,
      pool: poolId,
      isComplete: false,
      winner: ""
    });

    await game.save();
    res.status(201).json(game);
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({ message: "Error creating game", error: error.message });
  }
});

// Mark game as complete with winner
router.put("/:gameId/complete", auth, async (req, res) => {
  try {
    const { winner, isComplete } = req.body;
    const gameId = req.params.gameId;

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    game.winner = winner;
    game.isComplete = isComplete;
    await game.save();

    // Update all picks for this game to set isCorrect
    if (isComplete && winner) {
      await Pick.updateMany(
        { gameId: gameId },
        [
          {
            $set: {
              isCorrect: { $eq: ["$selectedTeam", winner] }
            }
          }
        ]
      );
      console.log(`Updated isCorrect for all picks on game ${gameId}`);
    } else if (!isComplete) {
      // If game is reopened, reset isCorrect to null
      await Pick.updateMany(
        { gameId: gameId },
        { $set: { isCorrect: null } }
      );
    }

    res.json({
      message: isComplete ? "Game marked as complete" : "Game reopened",
      game: {
        _id: game._id,
        gameTitle: game.gameTitle,
        winner: game.winner,
        isComplete: game.isComplete
      }
    });
  } catch (error) {
    console.error("Error updating game:", error);
    res.status(500).json({ message: "Error updating game" });
  }
});

// Update game attributes (title, teams, time, etc.)
router.put("/:gameId", auth, async (req, res) => {
  try {
    const { gameTitle, round, homeTeam, awayTeam, gameTime, tvNetwork } = req.body;
    const gameId = req.params.gameId;

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Update fields if provided
    if (gameTitle) game.gameTitle = gameTitle;
    if (round) game.round = round;
    if (homeTeam) game.homeTeam = homeTeam;
    if (awayTeam) game.awayTeam = awayTeam;
    if (gameTime) {
      game.gameTime = new Date(gameTime);
      game.startTime = new Date(gameTime);
    }
    if (tvNetwork !== undefined) game.tvNetwork = tvNetwork;

    await game.save();

    res.json({
      message: "Game updated successfully",
      game
    });
  } catch (error) {
    console.error("Error updating game:", error);
    res.status(500).json({ message: "Error updating game" });
  }
});

module.exports = router;
