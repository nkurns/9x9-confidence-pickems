const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Participant = require("../models/Participant");

router.get("/profile", auth, async (req, res) => {
  try {
    const participant = await Participant.findById(req.user.id).select("-password");
    res.json(participant);
  } catch (error) {
    console.error("Profile fetch error:", error.message);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

module.exports = router;
