const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({
  path: "/Users/nickkurns/Desktop/Programming/CursorPlayoffs/server/.env",
});

console.log("MongoDB URI:", process.env.MONGODB_URI);
console.log("Current directory:", __dirname);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");

    // Test a simple query
    const User = mongoose.model(
      "User",
      new mongoose.Schema({ username: String })
    );
    const user = await User.findOne({ username: "nkurns" }); // Replace with an actual username
    console.log("User found:", user);

    mongoose.connection.close(); // Close the connection
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

connectDB();
