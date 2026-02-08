const mongoose = require("mongoose");

// Schema for dependent/child accounts managed by a parent
const DependentSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ParticipantSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  location: {
    type: String,
  },
  profileImage: {
    type: String,  // Path to uploaded image or null for initials fallback
    default: null,
  },
  // Dependent accounts (children without their own email)
  dependents: [DependentSchema],
  participatingPools: [
    {
      poolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pool",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Participant", ParticipantSchema);
