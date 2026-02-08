const express = require("express");
const Participant = require("../models/Participant");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../client/public/uploads/profiles");
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use participant ID + timestamp for unique filename
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
});

// Get Participant Profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const participantId = req.user.id;
    const participant = await Participant.findById(participantId).select("-password");
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }
    res.json(participant);
  } catch (error) {
    console.error("Error fetching participant profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Participant Profile
router.put("/profile", authMiddleware, async (req, res) => {
  const { username, email, displayName, location } = req.body;

  try {
    const participantId = req.user.id;
    const updatedParticipant = await Participant.findByIdAndUpdate(
      participantId,
      { username, email, displayName, location },
      { new: true, runValidators: true }
    ).select("-password");
    if (!updatedParticipant) {
      return res.status(404).json({ message: "Participant not found" });
    }
    res.json(updatedParticipant);
  } catch (error) {
    console.error("Error updating participant profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload profile image
router.post("/profile/image", authMiddleware, upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const participantId = req.user.id;
    const participant = await Participant.findById(participantId);

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    // Delete old profile image if exists
    if (participant.profileImage) {
      const oldImagePath = path.join(__dirname, "../../client/public", participant.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Save new image path (relative to public folder)
    const imagePath = `/uploads/profiles/${req.file.filename}`;
    participant.profileImage = imagePath;
    await participant.save();

    res.json({
      message: "Profile image uploaded successfully",
      profileImage: imagePath,
    });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    res.status(500).json({ message: "Error uploading image" });
  }
});

// Delete profile image
router.delete("/profile/image", authMiddleware, async (req, res) => {
  try {
    const participantId = req.user.id;
    const participant = await Participant.findById(participantId);

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    if (participant.profileImage) {
      const imagePath = path.join(__dirname, "../../client/public", participant.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      participant.profileImage = null;
      await participant.save();
    }

    res.json({ message: "Profile image removed" });
  } catch (error) {
    console.error("Error removing profile image:", error);
    res.status(500).json({ message: "Error removing image" });
  }
});

// ==========================================
// DEPENDENT MANAGEMENT ROUTES
// ==========================================

// Get all dependents for current user
router.get("/dependents", authMiddleware, async (req, res) => {
  try {
    const participant = await Participant.findById(req.user.id).select("dependents");
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }
    res.json(participant.dependents || []);
  } catch (error) {
    console.error("Error fetching dependents:", error);
    res.status(500).json({ message: "Error fetching dependents" });
  }
});

// Add a new dependent
router.post("/dependents", authMiddleware, async (req, res) => {
  try {
    const { displayName } = req.body;

    if (!displayName || displayName.trim().length < 2) {
      return res.status(400).json({ message: "Display name must be at least 2 characters" });
    }

    const participant = await Participant.findById(req.user.id);
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    // Check for duplicate name among dependents
    const existingDependent = participant.dependents.find(
      d => d.displayName.toLowerCase() === displayName.trim().toLowerCase()
    );
    if (existingDependent) {
      return res.status(400).json({ message: "A dependent with this name already exists" });
    }

    // Add the new dependent
    const newDependent = {
      displayName: displayName.trim(),
      createdAt: new Date(),
    };
    participant.dependents.push(newDependent);
    await participant.save();

    // Return the newly created dependent (last one in array)
    const createdDependent = participant.dependents[participant.dependents.length - 1];
    res.status(201).json(createdDependent);
  } catch (error) {
    console.error("Error adding dependent:", error);
    res.status(500).json({ message: "Error adding dependent" });
  }
});

// Update a dependent's name
router.put("/dependents/:id", authMiddleware, async (req, res) => {
  try {
    const { displayName } = req.body;
    const dependentId = req.params.id;

    if (!displayName || displayName.trim().length < 2) {
      return res.status(400).json({ message: "Display name must be at least 2 characters" });
    }

    const participant = await Participant.findById(req.user.id);
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    const dependent = participant.dependents.id(dependentId);
    if (!dependent) {
      return res.status(404).json({ message: "Dependent not found" });
    }

    // Check for duplicate name (excluding current dependent)
    const existingDependent = participant.dependents.find(
      d => d._id.toString() !== dependentId &&
           d.displayName.toLowerCase() === displayName.trim().toLowerCase()
    );
    if (existingDependent) {
      return res.status(400).json({ message: "A dependent with this name already exists" });
    }

    dependent.displayName = displayName.trim();
    await participant.save();

    res.json(dependent);
  } catch (error) {
    console.error("Error updating dependent:", error);
    res.status(500).json({ message: "Error updating dependent" });
  }
});

// Delete a dependent
router.delete("/dependents/:id", authMiddleware, async (req, res) => {
  try {
    const dependentId = req.params.id;
    const participant = await Participant.findById(req.user.id);

    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    const dependent = participant.dependents.id(dependentId);
    if (!dependent) {
      return res.status(404).json({ message: "Dependent not found" });
    }

    // Remove the dependent
    participant.dependents.pull(dependentId);
    await participant.save();

    // Note: Picks for this dependent will remain in the database but won't be shown
    // You may want to also delete picks here if desired

    res.json({ message: "Dependent removed successfully" });
  } catch (error) {
    console.error("Error removing dependent:", error);
    res.status(500).json({ message: "Error removing dependent" });
  }
});

module.exports = router;
