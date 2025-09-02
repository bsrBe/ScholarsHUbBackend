const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["education", "scholarship", "applying", "other"],
      default: "other",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", articleSchema);
