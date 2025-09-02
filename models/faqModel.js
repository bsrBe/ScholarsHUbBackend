const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    callbackKey: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

faqSchema.pre("save", function (next) {
  if (this.isModified("question")) {
    this.callbackKey = this.question
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  }
  next();
});

module.exports = mongoose.model("Faq", faqSchema);
