/**
 * Migration script to rename userId to participantId in picks collection.
 * Run with: node server/migrations/migratePicksToParticipantId.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

async function migratePicks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const picksCollection = db.collection("picks");

    // First, drop old index if exists
    try {
      await picksCollection.dropIndex("userId_1_gameId_1_poolId_1");
      console.log("Dropped old userId index");
    } catch (e) {
      console.log("Old userId index not found or already dropped");
    }

    // Also try to drop participantId index if exists (in case re-running)
    try {
      await picksCollection.dropIndex("participantId_1_gameId_1_poolId_1");
      console.log("Dropped existing participantId index");
    } catch (e) {
      console.log("No existing participantId index to drop");
    }

    // Remove picks with null userId (invalid data)
    const deleteResult = await picksCollection.deleteMany({ userId: null });
    console.log(`Removed ${deleteResult.deletedCount} picks with null userId`);

    // Check if userId field exists
    const samplePick = await picksCollection.findOne({ userId: { $exists: true } });

    if (samplePick) {
      console.log("Found picks with userId field. Migrating...");

      // Rename userId to participantId
      const result = await picksCollection.updateMany(
        { userId: { $exists: true } },
        { $rename: { "userId": "participantId" } }
      );

      console.log(`Renamed userId to participantId in ${result.modifiedCount} picks`);
    } else {
      console.log("No picks with userId field found. Migration may have already run.");
    }

    // Create new index
    await picksCollection.createIndex(
      { participantId: 1, gameId: 1, poolId: 1 },
      { unique: true }
    );
    console.log("Created new participantId index");

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

migratePicks();
