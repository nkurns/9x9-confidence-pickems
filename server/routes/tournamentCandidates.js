const express = require("express");
const router = express.Router();
const TournamentCandidate = require("../models/TournamentCandidate");
const Pool = require("../models/Pool");
const auth = require("../middleware/auth");

// Check if user is admin of any pool
async function isAnyPoolAdmin(userId) {
  const pool = await Pool.findOne({ admin: userId });
  return !!pool;
}

// GET /api/tournament-candidates — public, visible only
router.get("/", async (req, res) => {
  try {
    const candidates = await TournamentCandidate.find({ isVisible: true }).sort({
      startDate: 1,
    });
    res.json(candidates);
  } catch (error) {
    console.error("Error fetching tournament candidates:", error);
    res.status(500).json({ message: "Error fetching tournament candidates" });
  }
});

// GET /api/tournament-candidates/all — admin only, all records
router.get("/all", auth, async (req, res) => {
  try {
    if (!(await isAnyPoolAdmin(req.user.id))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const candidates = await TournamentCandidate.find().sort({ startDate: 1 });
    res.json(candidates);
  } catch (error) {
    console.error("Error fetching all tournament candidates:", error);
    res.status(500).json({ message: "Error fetching tournament candidates" });
  }
});

// POST /api/tournament-candidates — admin only, create
router.post("/", auth, async (req, res) => {
  try {
    if (!(await isAnyPoolAdmin(req.user.id))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const { name, sport, description, startDate, endDate, isVisible } = req.body;
    const candidate = new TournamentCandidate({
      name,
      sport,
      description,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      isVisible: isVisible !== undefined ? isVisible : true,
    });
    await candidate.save();
    res.status(201).json(candidate);
  } catch (error) {
    console.error("Error creating tournament candidate:", error);
    res.status(500).json({ message: "Error creating tournament candidate" });
  }
});

// PUT /api/tournament-candidates/:id — admin only, update
router.put("/:id", auth, async (req, res) => {
  try {
    if (!(await isAnyPoolAdmin(req.user.id))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const { name, sport, description, startDate, endDate, isVisible } = req.body;
    const updates = { name, sport, description, isVisible };
    if (startDate !== undefined) updates.startDate = startDate || null;
    if (endDate !== undefined) updates.endDate = endDate || null;

    const candidate = await TournamentCandidate.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!candidate) {
      return res.status(404).json({ message: "Tournament candidate not found" });
    }
    res.json(candidate);
  } catch (error) {
    console.error("Error updating tournament candidate:", error);
    res.status(500).json({ message: "Error updating tournament candidate" });
  }
});

// DELETE /api/tournament-candidates/:id — admin only
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!(await isAnyPoolAdmin(req.user.id))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const candidate = await TournamentCandidate.findByIdAndDelete(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: "Tournament candidate not found" });
    }
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting tournament candidate:", error);
    res.status(500).json({ message: "Error deleting tournament candidate" });
  }
});

module.exports = router;
