const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Pool = require("../models/Pool");
const Participant = require("../models/Participant");
const auth = require("../middleware/auth");

// Register
router.post("/register", async (req, res) => {
  console.log("Registration attempt:", req.body);
  try {
    const { email, password, displayName } = req.body;

    // Validate input
    const errors = {};
    if (!email || !email.includes("@")) {
      errors.email = "Valid email is required";
    }
    if (!password || password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }
    if (!displayName || displayName.length < 2) {
      errors.displayName = "Display name must be at least 2 characters long";
    }

    if (Object.keys(errors).length > 0) {
      console.log("Validation errors:", errors);
      return res.status(400).json({ errors });
    }

    // Check if participant already exists
    const existingParticipant = await Participant.findOne({ email });

    if (existingParticipant) {
      return res.status(400).json({
        message: "An account with this email already exists",
      });
    }

    // Auto-generate username from email
    const username = email.split("@")[0] + "_" + Date.now().toString(36);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create participant
    const participant = await Participant.create({
      username,
      email,
      password: hashedPassword,
      displayName,
      participatingPools: [],
    });

    // Generate JWT
    const token = jwt.sign(
      { id: participant._id, username: participant.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      token,
      user: {
        id: participant._id,
        username: participant.username,
        displayName: participant.displayName,
        hasPoolParticipation: false,
        pools: [],
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    // Support both email and username for backwards compatibility
    const loginIdentifier = email || username;
    console.log("Login attempt for:", loginIdentifier);

    // Find participant by email or username
    const participant = await Participant.findOne({
      $or: [{ email: loginIdentifier }, { username: loginIdentifier }]
    });
    console.log("Found participant:", participant ? "Yes" : "No");

    if (!participant) {
      console.log("Login failed: Participant not found");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, participant.password);
    console.log("Password match:", isMatch ? "Yes" : "No");

    if (!isMatch) {
      console.log("Login failed: Invalid password");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Login successful, generating token...");

    // Create JWT payload
    const payload = {
      id: participant._id,
      username: participant.username,
    };

    console.log("Creating token with payload:", payload);
    console.log(
      "Using JWT_SECRET:",
      process.env.JWT_SECRET ? "defined" : "undefined"
    );

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
      (err, token) => {
        if (err) {
          console.error("Token signing error:", err);
          throw err;
        }
        console.log("Token generated successfully");
        res.json({
          token: token,
          user: {
            id: participant._id,
            username: participant.username,
            displayName: participant.displayName,
            hasPoolParticipation: participant.participatingPools?.length > 0,
            pools: participant.participatingPools,
          },
        });
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/test", (req, res) => {
  try {
    console.log("Test endpoint hit");
    res.json({ message: "Auth API is working" });
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({
      message: "Server error in test endpoint",
      error: error.message,
    });
  }
});

router.post("/refresh", auth, async (req, res) => {
  try {
    console.log("Token refresh requested for user:", req.user.id);
    const participant = await Participant.findById(req.user.id).select(
      "-password"
    );
    if (!participant) {
      console.log("Participant not found during refresh:", req.user.id);
      return res.status(404).json({ message: "Participant not found" });
    }

    // Create new token
    const payload = {
      id: participant._id,
      username: participant.username,
    };

    console.log("Creating new token for participant:", participant.username);
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    console.log("New token generated successfully");
    res.json({
      token,
      user: {
        id: participant._id,
        username: participant.username,
        displayName: participant.displayName,
        hasPoolParticipation: participant.participatingPools?.length > 0,
        pools: participant.participatingPools,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Error refreshing token" });
  }
});

module.exports = router;
