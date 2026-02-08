const express = require("express");
const router = express.Router();
const Pick = require("../models/Pick");
const Game = require("../models/Game");
const Pool = require("../models/Pool");
const Participant = require("../models/Participant");
const auth = require("../middleware/auth");

// GET /api/dashboard
router.get("/", async (req, res) => {
  try {
    const participantId = req.query.participantId || req.query.userId; // Support both for backwards compat
    console.log("Dashboard request for participantId:", participantId);

    if (!participantId) {
      return res.status(400).json({ message: "Participant ID is required" });
    }

    // Get active pool
    const activePool = await Pool.findOne({ isActive: true });
    console.log("Active pool:", activePool);

    if (!activePool) {
      return res.status(404).json({ message: "No active pool found" });
    }

    // Get pool participants
    const poolParticipants = await Participant.find({
      "participatingPools.poolId": activePool._id,
    });
    console.log("Pool participants count:", poolParticipants.length);

    // Get participant's picks for active pool
    const userPicks = await Pick.find({
      participantId,
      poolId: activePool._id,
    });

    // Get all games for active pool
    const games = await Game.find({
      poolId: activePool._id,
    }).sort({ gameTime: 1 });

    // Get all participants' picks for standings calculation
    const allPicks = await Pick.find({ poolId: activePool._id });
    const participantPoints = {};

    // Calculate points for each participant
    allPicks.forEach((pick) => {
      if (pick.isCorrect) {
        participantPoints[pick.participantId] =
          (participantPoints[pick.participantId] || 0) + pick.confidencePoints;
      }
    });

    // Convert to array and sort by points
    const standings = Object.entries(participantPoints)
      .map(([participantId, points]) => ({ participantId, points }))
      .sort((a, b) => b.points - a.points);

    // Find participant's rank
    const userRank =
      standings.findIndex((s) => s.participantId.toString() === participantId) + 1;

    const dashboardData = {
      poolInfo: {
        name: activePool.name,
        round: activePool.round || "Wild Card",
      },
      picksStatus: {
        submitted: userPicks.length,
        total: games.length,
        isComplete: userPicks.length === games.length,
      },
      standings: {
        rank: userRank || poolParticipants.length,
        totalPlayers: poolParticipants.length,
        points: participantPoints[participantId] || 0,
      },
      upcomingGames: games
        .filter((game) => new Date(game.gameTime) > new Date())
        .map((game) => ({
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          gameTime: game.gameTime,
          deadline: game.pickDeadline,
        })),
    };

    console.log("Sending dashboard data:", dashboardData);
    res.json(dashboardData);
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
});

router.get("/dashboard", auth, async (req, res) => {
  try {
    const participantId = req.user.id;

    // Get all games
    const games = await Game.find({}).sort({ gameTime: 1 });

    // Get participant's picks
    const picks = await Pick.find({ participantId });

    // Get next deadline from earliest game
    const nextDeadline = games.length > 0 ? games[0].gameTime : null;

    res.json({
      submittedPicks: picks.length,
      totalGames: games.length,
      nextDeadline,
      games: games.map((game) => ({
        gameId: game._id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        gameTime: game.gameTime,
        gameTitle: game.gameTitle,
      })),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
});

module.exports = router;
