const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name:               { type: String, required: true },
  specialization:     { type: String, default: "General physician" },
  patientsSeen:       { type: Number, default: 0 },
  avgConsultationTime:{ type: Number, default: 8 }, // minutes
  currentQueueDepth:  { type: Number, default: 0 },
  // Rolling window of last 5 consultation durations (minutes)
  recentDurations:    { type: [Number], default: [] },
  isAvailable:        { type: Boolean, default: true },
});

module.exports = mongoose.model("Doctor", doctorSchema);
