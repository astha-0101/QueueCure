const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctorId:  { type: mongoose.Schema.Types.ObjectId, ref: "Doctor",  required: true },
  startTime: { type: Date },
  endTime:   { type: Date },
  duration:  { type: Number }, // minutes — computed on completion
});

module.exports = mongoose.model("Consultation", consultationSchema);
