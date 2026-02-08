const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
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

module.exports = mongoose.model("User", UserSchema);
