require("dotenv").config({ path: "./server/.env" });
const mongoose = require("mongoose");
const Game = require("./models/Game");
const Pick = require("./models/Pick");
const Pool = require("./models/Pool");
const User = require("./models/User");

console.log("MongoDB URI:", process.env.MONGODB_URI);

const seedDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // Drop the entire database to clear any schema validations
    await mongoose.connection.dropDatabase();
    console.log("Dropped existing database");

    // Clear existing collections
    await Game.deleteMany({});
    await Pick.deleteMany({});
    await Pool.deleteMany({});
    console.log("Cleared existing collections");

    // Create a mock pool with all required fields
    try {
      const poolData = {
        name: "9X9 NFL Playoff Pool",
        isActive: true,
        startDate: new Date("2026-02-01T00:00:00Z"),
        endDate: new Date("2026-02-15T23:59:59Z"),
        totalGames: 13,
        participants: [],
      };
      console.log("Creating pool with data:", poolData);

      const newPool = new Pool(poolData);
      await newPool.save();
      console.log("Successfully created pool:", newPool.toObject());

      const POOL_ID = newPool._id;

      const games = [
        {
          poolId: POOL_ID,
          pool: POOL_ID,
          gameTitle: "AFC Wild Card Game 1",
          homeTeam: "Baltimore Ravens",
          awayTeam: "Los Angeles Chargers",
          startTime: new Date("2026-02-01T20:15:00Z"),
          gameTime: new Date("2026-02-01T20:15:00Z"),
          round: "Wild Card",
          tvNetwork: "ESPN",
          isComplete: false,
          winner: "",
        },
        {
          poolId: POOL_ID,
          pool: POOL_ID,
          gameTitle: "AFC Wild Card Game 2",
          homeTeam: "Buffalo Bills",
          awayTeam: "Pittsburgh Steelers",
          startTime: new Date("2026-02-01T16:30:00Z"),
          gameTime: new Date("2026-02-01T16:30:00Z"),
          round: "Wild Card",
          tvNetwork: "CBS",
          isComplete: false,
          winner: "",
        },
        {
          poolId: POOL_ID,
          pool: POOL_ID,
          gameTitle: "NFC Wild Card Game 1",
          homeTeam: "Philadelphia Eagles",
          awayTeam: "Green Bay Packers",
          startTime: new Date("2026-02-02T13:00:00Z"),
          gameTime: new Date("2026-02-02T13:00:00Z"),
          round: "Wild Card",
          tvNetwork: "FOX",
          isComplete: false,
          winner: "",
        },
        {
          poolId: POOL_ID,
          pool: POOL_ID,
          gameTitle: "NFC Wild Card Game 2",
          homeTeam: "Detroit Lions",
          awayTeam: "Washington Commanders",
          startTime: new Date("2026-02-02T16:30:00Z"),
          gameTime: new Date("2026-02-02T16:30:00Z"),
          round: "Wild Card",
          tvNetwork: "NBC",
          isComplete: false,
          winner: "",
        },
      ];

      // Insert games
      for (const game of games) {
        console.log("Inserting game:", game);
        try {
          const newGame = new Game(game);
          await newGame.save();
          console.log(`Successfully inserted game: ${game.gameTitle}`);
        } catch (gameError) {
          console.error(
            `Failed to insert game ${game.gameTitle}:`,
            gameError.message
          );
          if (gameError.errors) {
            // Log validation errors in detail
            Object.keys(gameError.errors).forEach((key) => {
              console.error(
                `Validation error for field "${key}":`,
                gameError.errors[key].message
              );
            });
          }
          throw gameError; // Re-throw to stop the seeding process
        }
      }

      // Create test users and their picks
      const testUsers = [
        { username: "testuser1", displayName: "Alice Smith" },
        { username: "testuser2", displayName: "Bob Johnson" },
        { username: "testuser3", displayName: "Carol Davis" },
        { username: "testuser4", displayName: "David Wilson" },
      ];

      for (const userData of testUsers) {
        const existingUser = await User.findOne({
          username: userData.username,
        });
        if (!existingUser) {
          await User.create({
            ...userData,
            email: `${userData.username}@example.com`,
            password: "password123",
            location: "Test Location",
          });
        }
      }

      // Add all users to pool participants
      const activePool = await Pool.findOne({ isActive: true });
      const allUsers = await User.find({
        username: { $in: [...testUsers.map((u) => u.username), "testuser"] },
      });

      if (activePool && allUsers.length > 0) {
        activePool.participants = allUsers.map((user) => user._id);
        await activePool.save();
        console.log("Added all test users to pool participants");

        // Create picks for each user
        for (const user of allUsers) {
          // Clear any existing picks
          await Pick.deleteMany({ userId: user._id, poolId: activePool._id });

          const games = await Game.find({ poolId: activePool._id });
          const picks = games.map((game, index) => ({
            userId: user._id,
            gameId: game._id,
            poolId: activePool._id,
            round: game.round,
            selectedTeam: Math.random() > 0.5 ? game.homeTeam : game.awayTeam,
            confidencePoints: 13 - index,
          }));

          await Pick.insertMany(picks);
          console.log(`Created picks for ${user.displayName}`);
        }
      }

      console.log("Database seeded successfully!");
      mongoose.connection.close();
    } catch (poolError) {
      console.error("Pool creation error:", poolError);
      if (poolError.errors) {
        Object.keys(poolError.errors).forEach((key) => {
          console.error(
            `Validation error for field "${key}":`,
            poolError.errors[key].message
          );
        });
      }
      throw poolError;
    }
  } catch (error) {
    console.error("Error seeding database:", error);
    if (error.errors) {
      Object.keys(error.errors).forEach((key) => {
        console.error(
          `Validation error for field "${key}":`,
          error.errors[key].message
        );
      });
    }
    process.exit(1);
  }
};

seedDatabase();
