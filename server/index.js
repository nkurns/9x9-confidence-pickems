require("dotenv").config({ path: "./server/.env" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const poolRoutes = require("./routes/pool");
const poolsRoutes = require("./routes/pools");
const gameRoutes = require("./routes/games");
const picksRoutes = require("./routes/picks");
const participantRoutes = require("./routes/participants");
const dashboardRoutes = require("./routes/dashboard");
const standingsRoutes = require("./routes/standings");

const app = express();
const PORT = process.env.PORT || 3333;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the client/public directory
app.use(express.static(path.join(__dirname, "../client/public")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/pool", poolRoutes);
app.use("/api/pools", poolsRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/picks", picksRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/pool/standings", standingsRoutes);

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Log navbar file location for debugging
const navbarPath = path.join(__dirname, "../client/public/navbar.html");
console.log("Navbar file path:", navbarPath);
console.log("File exists:", require("fs").existsSync(navbarPath));

// Serve navbar.html for direct requests
app.get("/navbar.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public/navbar.html"));
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(
        `Static files being served from: ${path.join(
          __dirname,
          "../client/public"
        )}`
      );
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
