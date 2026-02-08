const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
const result = dotenv.config({ path: path.join(__dirname, "../../.env") });

if (result.error) {
  console.error("Error loading .env file:", result.error);
}

// Verify required environment variables
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
  }
});

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  // Add other environment variables as needed
};
