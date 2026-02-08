const mongoose = require("mongoose");
const Pool = require("../models/Pool");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function createTestPool() {
  try {
    console.log("MongoDB URI:", process.env.MONGODB_URI);

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const testPool = new Pool({
      name: "2024 NFL Playoffs Pool",
      description: "Official pool for the 2024 NFL Playoffs",
      status: "active",
      startDate: new Date("2024-01-13"),
      endDate: new Date("2024-02-11"),
      entryFee: 0,
      participants: [],
      isActive: true,
      maxParticipants: 100,
      rules: {
        pickDeadline: new Date("2024-01-13T16:30:00Z"),
        scoringSystem: "standard",
        allowedPicks: 9,
      },
    });

    await testPool.save();
    console.log("Test pool created:", testPool);

    const pools = await Pool.find({ status: "active" });
    console.log("Active pools:", pools);
  } catch (error) {
    console.error("Error creating test pool:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

createTestPool();
