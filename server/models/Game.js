const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  poolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pool",
    required: true,
  },
  round: {
    type: String,
    required: true,
    enum: ["First Round", "Second Round", "Conference Finals", "NBA Finals"],
  },
  gameTitle: {
    type: String,
    required: true,
  },
  homeTeam: {
    type: String,
    required: true,
  },
  awayTeam: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    required: false,
  },
  gameTime: {
    type: Date,
    required: false,
  },
  tvNetwork: {
    type: String,
    required: false,
  },
  isComplete: {
    type: Boolean,
    default: false,
  },
  final: {
    type: Boolean,
    default: false,
  },
  winner: {
    type: String,
    default: null,
  },
  pool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pool",
    required: true,
  },
});

module.exports = mongoose.model("Game", gameSchema);
