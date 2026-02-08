const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

// Import all necessary models
const User = require("../models/User");
const Participant = require("../models/Participant");
const Pool = require("../models/Pool");

async function migrateUsers() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get all users
    const users = await User.find({}).populate("participatingPools.poolId");
    console.log(`Found ${users.length} users to migrate`);

    // Migrate each user
    for (const user of users) {
      console.log(`Migrating user: ${user.username}`);
      console.log("User pools:", user.participatingPools);

      // Check if participant already exists
      const existingParticipant = await Participant.findOne({
        username: user.username,
      });

      if (existingParticipant) {
        console.log(
          `Participant already exists for ${user.username}, updating pools...`
        );
        // Update existing participant's pools
        existingParticipant.participatingPools = user.participatingPools;
        await existingParticipant.save();
        console.log("Updated pools for existing participant");
        continue;
      }

      // Create new participant
      const participant = new Participant({
        username: user.username,
        password: user.password,
        displayName: user.displayName,
        email: user.email,
        location: user.location,
        participatingPools: user.participatingPools.map((pool) => ({
          poolId: pool.poolId,
          joinedAt: pool.joinedAt || new Date(),
        })),
        createdAt: user.createdAt,
      });

      await participant.save();
      console.log(
        `Successfully migrated ${user.username} with pools:`,
        participant.participatingPools
      );
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

migrateUsers();
