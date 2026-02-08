require("dotenv").config({ path: "./server/.env" });
const mongoose = require("mongoose");
const Pick = require("../models/Pick");
const User = require("../models/User");

async function checkPicks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Find picks with null userId
    const nullPicks = await Pick.find({ userId: null });
    console.log("Picks with null userId:", nullPicks.length);

    // Find picks with invalid userId
    const allPicks = await Pick.find().populate("userId");
    const invalidPicks = allPicks.filter((pick) => !pick.userId);
    console.log("Picks with invalid userId:", invalidPicks.length);

    if (invalidPicks.length > 0) {
      console.log("Sample invalid pick:", invalidPicks[0]);
    }

    // Get testuser info
    const testUser = await User.findOne({ username: "testuser" });
    console.log("TestUser:", testUser ? testUser._id : "Not found");

    // Find testuser's picks
    if (testUser) {
      const testUserPicks = await Pick.find({ userId: testUser._id });
      console.log("TestUser picks:", testUserPicks.length);
      if (testUserPicks.length > 0) {
        console.log("Sample testUser pick:", testUserPicks[0]);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
  }
}

checkPicks();
