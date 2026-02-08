const express = require("express");
const router = express.Router();
const Pool = require("../models/Pool");
const Pick = require("../models/Pick");
const Participant = require("../models/Participant");
const Game = require("../models/Game");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    // Get active pool
    const activePool = await Pool.findOne({ isActive: true });
    if (!activePool) {
      return res.status(404).json({ message: "No active pool found" });
    }

    // Get total games from pool config (default to 13 for NFL playoffs)
    const totalGames = activePool.totalGames || 13;

    // Get all games for this pool
    const allGames = await Game.find({ poolId: activePool._id });
    const completedGames = allGames.filter(game => game.isComplete);
    const gamesCreated = allGames.length;

    // Get all participants in this pool (including their dependents)
    const participants = await Participant.find({
      "participatingPools.poolId": activePool._id
    });

    // Get all picks for this pool
    const allPicks = await Pick.find({ poolId: activePool._id });

    // Calculate total available points: n*(n+1)/2 where n = total games
    const totalAvailablePoints = (totalGames * (totalGames + 1)) / 2;

    // Helper function to calculate standings for a set of picks
    function calculateStandings(picks) {
      let earnedPoints = 0;
      let lostPoints = 0;
      let correctPicks = 0;

      picks.forEach(pick => {
        const completedGame = completedGames.find(
          g => g._id.toString() === pick.gameId.toString()
        );

        if (completedGame) {
          if (completedGame.winner === pick.selectedTeam) {
            earnedPoints += pick.confidencePoints;
            correctPicks++;
          } else {
            lostPoints += pick.confidencePoints;
          }
        }
      });

      const possiblePoints = totalAvailablePoints - lostPoints;
      const completedPicksCount = picks.filter(pick => {
        return completedGames.some(
          g => g._id.toString() === pick.gameId.toString()
        );
      }).length;

      return {
        earnedPoints,
        possiblePoints,
        lostPoints,
        correctPicks,
        totalPicks: picks.length,
        completedPicks: completedPicksCount
      };
    }

    // Build standings array including both participants and their dependents
    const standings = [];

    participants.forEach(participant => {
      // Get participant's own picks (where dependentId is null)
      const selfPicks = allPicks.filter(
        pick => pick.participantId.toString() === participant._id.toString() &&
                !pick.dependentId
      );

      const selfStats = calculateStandings(selfPicks);
      standings.push({
        odataId: participant._id,
        odataType: "participant",
        username: participant.displayName || participant.username,
        profileImage: participant.profileImage,
        ...selfStats
      });

      // Add each dependent as a separate standings entry
      if (participant.dependents && participant.dependents.length > 0) {
        participant.dependents.forEach(dependent => {
          const dependentPicks = allPicks.filter(
            pick => pick.participantId.toString() === participant._id.toString() &&
                    pick.dependentId &&
                    pick.dependentId.toString() === dependent._id.toString()
          );

          const dependentStats = calculateStandings(dependentPicks);
          standings.push({
            odataId: dependent._id,
            odataType: "dependent",
            parentId: participant._id,
            parentName: participant.displayName || participant.username,
            username: dependent.displayName,
            profileImage: null, // Dependents don't have profile images
            ...dependentStats
          });
        });
      }
    });

    // Sort by earned points (descending), then by possible points as tiebreaker
    standings.sort((a, b) => {
      if (b.earnedPoints !== a.earnedPoints) {
        return b.earnedPoints - a.earnedPoints;
      }
      return b.possiblePoints - a.possiblePoints;
    });

    // Add rank
    standings.forEach((player, index) => {
      player.rank = index + 1;
    });

    res.json({
      poolName: activePool.name,
      completedGames: completedGames.length,
      gamesCreated,
      totalGames,
      totalAvailablePoints,
      standings
    });
  } catch (error) {
    console.error("Error in standings route:", error);
    res.status(500).json({
      message: "Error fetching standings",
      error: error.message
    });
  }
});

module.exports = router;
