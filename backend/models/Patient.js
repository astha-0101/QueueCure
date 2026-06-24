const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  tokenNumber: { type: Number, required: true, unique: true },
  name:        { type: String, required: true, trim: true },
  phone:       { type: String, required: true, trim: true },
  doctor:      { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  visitType:   { type: String, enum: ["General", "Follow-up", "New patient", "Emergency"], default: "General" },
  priority:    { type: Number, default: 0 }, // higher = served sooner
  status:      { type: String, enum: ["waiting", "in-room", "completed", "skipped", "no-show"], default: "waiting" },
  createdAt:   { type: Date, default: Date.now },
});

// Auto-generate unique token number
patientSchema.statics.nextToken = async function () {
  const last = await this.findOne({}, {}, { sort: { tokenNumber: -1 } });
  return last ? last.tokenNumber + 1 : 1;
};

module.exports = mongoose.model("Patient", patientSchema);
