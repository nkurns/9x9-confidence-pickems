/**
 * Script to sync Pool.participants array from Participant.participatingPools
 * This fixes the participant count showing 0 on the select-pools page
 *
 * Run with: node server/scripts/syncPoolParticipants.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Pool = require("../models/Pool");
const Participant = require("../models/Participant");

async function syncPoolParticipants() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/playoffPools"
    );
    console.log("Connected to MongoDB");

    // Get all pools
    const pools = await Pool.find({});
    console.log(`Found ${pools.length} pools`);

    // Get all participants with their pool memberships
    const participants = await Participant.find({
      "participatingPools.0": { $exists: true },
    });
    console.log(`Found ${participants.length} participants with pool memberships`);

    // Build a map of poolId -> participantIds
    const poolParticipantsMap = new Map();

    for (const participant of participants) {
      for (const poolMembership of participant.participatingPools) {
        const poolId = poolMembership.poolId.toString();
        if (!poolParticipantsMap.has(poolId)) {
          poolParticipantsMap.set(poolId, []);
        }
        poolParticipantsMap.get(poolId).push(participant._id);
      }
    }

    // Update each pool with the correct participants
    for (const pool of pools) {
      const poolId = pool._id.toString();
      const participantIds = poolParticipantsMap.get(poolId) || [];

      console.log(
        `Pool "${pool.name}": Current participants: ${pool.participants.length}, Should be: ${participantIds.length}`
      );

      if (participantIds.length !== pool.participants.length) {
        pool.participants = participantIds;
        await pool.save();
        console.log(`  -> Updated pool with ${participantIds.length} participants`);
      } else {
        console.log(`  -> No update needed`);
      }
    }

    console.log("\nSync complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error syncing pool participants:", error);
    process.exit(1);
  }
}

syncPoolParticipants();
