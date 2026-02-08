const mongoose = require("mongoose");

const PickSchema = new mongoose.Schema(
  {
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Participant",
      required: true,
    },
    // Optional: if picking for a dependent, this is their _id from parent's dependents array
    dependentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
    poolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pool",
      required: true,
    },
    round: {
      type: String,
      required: true,
      enum: ["Wild Card", "Divisional", "Conference", "Super Bowl"],
    },
    selectedTeam: {
      type: String,
      required: true,
    },
    confidencePoints: {
      type: Number,
      required: true,
      min: 1,
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add pre-save middleware to log the document
PickSchema.pre("save", function (next) {
  console.log("Saving pick:", this.toObject());
  next();
});

// Ensure a participant/dependent can only have one pick per game per pool
// Include dependentId in the unique index
PickSchema.index({ participantId: 1, dependentId: 1, gameId: 1, poolId: 1 }, { unique: true });

module.exports = mongoose.model("Pick", PickSchema);
