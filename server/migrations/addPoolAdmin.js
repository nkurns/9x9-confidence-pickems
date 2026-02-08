/**
 * Migration script to add admin field to existing pools.
 * This sets the first participant of each pool as the admin.
 * Run with: node server/migrations/addPoolAdmin.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const Pool = require("../models/Pool");
const Participant = require("../models/Participant");

async function migratePoolAdmins() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all pools without an admin
    const poolsWithoutAdmin = await Pool.find({ admin: { $exists: false } });
    console.log(`Found ${poolsWithoutAdmin.length} pools without admin`);

    for (const pool of poolsWithoutAdmin) {
      // Find the first participant in this pool
      const firstParticipant = await Participant.findOne({
        "participatingPools.poolId": pool._id
      }).sort({ "participatingPools.joinedAt": 1 });

      if (firstParticipant) {
        pool.admin = firstParticipant._id;
        await pool.save();
        console.log(`Set ${firstParticipant.displayName || firstParticipant.username} as admin of pool "${pool.name}"`);
      } else {
        console.log(`Warning: Pool "${pool.name}" has no participants. Cannot set admin.`);
      }
    }

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

migratePoolAdmins();
