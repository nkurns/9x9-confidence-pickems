require("dotenv").config({ path: "./server/.env" });
const mongoose = require("mongoose");
const Game = require("../models/Game");
const Pool = require("../models/Pool");
const User = require("../models/User");
const Pick = require("../models/Pick");

async function testPicks() {
  try {
    console.log("MongoDB URI:", process.env.MONGODB_URI);

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const pool = await Pool.findOne({ isActive: true });
    if (!pool) {
      throw new Error("No active pool found");
    }
    console.log("Found active pool:", pool.name);

    const games = await Game.find({ poolId: pool._id });
    if (games.length === 0) {
      throw new Error("No games found");
    }
    console.log(`Found ${games.length} games`);

    let testUser = await User.findOne({ username: "testuser" });
    if (!testUser) {
      testUser = await User.create({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        displayName: "Test User",
        location: "Test Location",
      });
    }
    console.log("Test user ID:", testUser._id);

    // Clear ALL existing picks for this user in this pool
    await Pick.deleteMany({
      userId: testUser._id,
      poolId: pool._id,
    });
    console.log("Cleared existing picks for test user in this pool");

    // Create picks one at a time for better error handling
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      try {
        // First check if a pick already exists
        const existingPick = await Pick.findOne({
          userId: testUser._id,
          gameId: game._id,
          poolId: pool._id,
        });

        const pickData = {
          userId: testUser._id,
          gameId: game._id,
          poolId: pool._id,
          round: game.round,
          selectedTeam: game.homeTeam,
          confidencePoints: 13 - i,
        };

        console.log(`Creating/Updating pick ${i + 1}:`, pickData);

        let savedPick;
        if (existingPick) {
          // Update existing pick
          Object.assign(existingPick, pickData);
          savedPick = await existingPick.save();
          console.log(`Updated existing pick ${i + 1}`);
        } else {
          // Create new pick
          const newPick = new Pick(pickData);
          savedPick = await newPick.save();
          console.log(`Created new pick ${i + 1}`);
        }

        console.log("Saved pick:", savedPick);
      } catch (pickError) {
        console.error(`Error with pick ${i + 1}:`, pickError);
        throw pickError;
      }
    }

    // Verify final picks
    const verifyPicks = await Pick.find({
      userId: testUser._id,
      poolId: pool._id,
    })
      .populate("gameId")
      .lean();

    console.log("\nVerification - Final Picks in database:");
    verifyPicks.forEach((pick) => {
      console.log(
        `Game: ${pick.gameId.gameTitle}, Team: ${pick.selectedTeam}, Points: ${pick.confidencePoints}`
      );
    });
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

testPicks();
