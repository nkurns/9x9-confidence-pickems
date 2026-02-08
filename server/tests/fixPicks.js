require("dotenv").config({ path: "./server/.env" });
const mongoose = require("mongoose");
const Pick = require("../models/Pick");
const User = require("../models/User");

async function fixPicks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Get testuser
    const testUser = await User.findOne({ username: "testuser" });
    if (!testUser) {
      throw new Error("TestUser not found");
    }

    // Update picks with null userId
    const result = await Pick.updateMany(
      { userId: null },
      { $set: { userId: testUser._id } }
    );

    console.log("Updated picks:", result.modifiedCount);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
  }
}

fixPicks();
