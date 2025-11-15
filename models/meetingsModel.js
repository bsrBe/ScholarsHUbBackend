// Example MongoDB Schema (using Mongoose)
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const meetingSchema = new mongoose.Schema({
  id: { type: String, default: () => uuidv4(), unique: true },
  title: { type: String, required: true },
  description: { type: String },
  hostName: { type: String, required: true },
  hostEmail: { type: String },
  participants: { type: [String], default: [] },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  timeZone: { type: String, required: true },
  jitsiMeetingId: { type: String, required: true },
  jitsiMeetingLink: { type: String, required: true },
  status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Meeting = mongoose.model("Meeting", meetingSchema);
module.exports = Meeting;
