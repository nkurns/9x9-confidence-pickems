const mongoose = require("mongoose");

const PoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Pool name is required"],
      trim: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Participant",
      required: [true, "Pool must have an admin"],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    round: {
      type: String,
      enum: ["Wild Card", "Divisional", "Conference", "Super Bowl"],
      default: "Wild Card",
    },
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Participant",
        },
      ],
      default: [],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      validate: {
        validator: function (v) {
          return v instanceof Date && !isNaN(v);
        },
        message: "Start date must be a valid date",
      },
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (v) {
          return v instanceof Date && !isNaN(v);
        },
        message: "End date must be a valid date",
      },
    },
    totalGames: {
      type: Number,
      default: 13,
      min: [1, "Pool must have at least 1 game"],
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Add validation to ensure endDate is after startDate
PoolSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate("endDate", "End date must be after start date");
  }
  next();
});

// Add logging to help debug validation issues
PoolSchema.pre("save", function (next) {
  console.log("Saving pool:", JSON.stringify(this.toObject(), null, 2));
  next();
});

module.exports = mongoose.model("Pool", PoolSchema);
