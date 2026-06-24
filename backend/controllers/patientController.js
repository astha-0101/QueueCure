const Patient       = require("../models/Patient");
const Doctor        = require("../models/Doctor");
const { getQueueSnapshot } = require("../services/queueService");

/** POST /api/patients — Add patient to queue */
exports.addPatient = async (req, res) => {
  try {
    const { name, phone, doctor: doctorId, visitType, priority } = req.body;
    if (!name || !phone || !doctorId) {
      return res.status(400).json({ error: "name, phone, and doctor are required." });
    }

    // Duplicate phone guard (same day)
    const today = new Date(); today.setHours(0,0,0,0);
    const dup = await Patient.findOne({ phone, createdAt: { $gte: today }, status: { $nin: ["completed","skipped","no-show"] } });
    if (dup) return res.status(409).json({ error: "This phone number already has an active token today.", token: dup.tokenNumber });

    const tokenNumber = await Patient.nextToken();

    const patient = await Patient.create({
      tokenNumber,
      name: name.trim(),
      phone: phone.trim(),
      doctor: doctorId,
      visitType: visitType || "General",
      priority: priority || 0,
    });

    await Doctor.findByIdAndUpdate(doctorId, { $inc: { currentQueueDepth: 1 } });

    const snapshot = await getQueueSnapshot(doctorId);
    req.io.emit("patientAdded", { patient, snapshot });
    req.io.emit("queueUpdated", snapshot);

    res.status(201).json({ patient, tokenNumber, snapshot });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/** GET /api/queue?doctorId=... */
exports.getQueue = async (req, res) => {
  try {
    const { doctorId } = req.query;
    if (!doctorId) return res.status(400).json({ error: "doctorId required" });
    const snapshot = await getQueueSnapshot(doctorId);
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
