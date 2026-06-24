const mongoose = require("mongoose");

// Single-document collection for global system state
const systemStateSchema = new mongoose.Schema({
  _id:       { type: String, default: "singleton" },
  paused:    { type: Boolean, default: false },
  // Active consultation per doctor: { doctorId: consultationId }
  activeConsultations: { type: Map, of: String, default: {} },
});

module.exports = mongoose.model("SystemState", systemStateSchema);
