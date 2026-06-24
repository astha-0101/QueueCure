const Doctor = require("../models/Doctor");

/** GET /api/doctor-stats */
exports.getDoctorStats = async (req, res) => {
  try {
    const doctors = await Doctor.find({});
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** POST /api/doctors — seed/create a doctor */
exports.createDoctor = async (req, res) => {
  try {
    const { name, specialization, avgConsultationTime } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    const doctor = await Doctor.create({ name, specialization, avgConsultationTime: avgConsultationTime || 8 });
    res.status(201).json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** GET /api/system-health */
exports.systemHealth = async (req, res) => {
  const { mongoose } = require("mongoose");
  res.json({
    status: "ok",
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
};
