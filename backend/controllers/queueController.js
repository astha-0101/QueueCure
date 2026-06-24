const lockService  = require("../services/lockService");
const { callNext, completeConsultation, getQueueSnapshot, getState } = require("../services/queueService");
const Patient      = require("../models/Patient");
const Doctor       = require("../models/Doctor");

/** POST /api/call-next */
exports.callNext = async (req, res) => {
  const { doctorId } = req.body;
  if (!doctorId) return res.status(400).json({ error: "doctorId required" });

  try {
    const result = await lockService.withLock(doctorId, () => callNext(doctorId, req.io));
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

/** POST /api/complete-consultation */
exports.completeConsultation = async (req, res) => {
  const { doctorId } = req.body;
  if (!doctorId) return res.status(400).json({ error: "doctorId required" });

  try {
    const result = await completeConsultation(doctorId, req.io);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

/** POST /api/skip-token */
exports.skipToken = async (req, res) => {
  const { doctorId, patientId } = req.body;
  if (!doctorId || !patientId) return res.status(400).json({ error: "doctorId and patientId required" });

  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: patientId, doctor: doctorId, status: "waiting" },
      { status: "skipped" },
      { new: true }
    );
    if (!patient) return res.status(404).json({ error: "Patient not found or not in waiting state." });

    await Doctor.findByIdAndUpdate(doctorId, { $inc: { currentQueueDepth: -1 } });

    const snapshot = await getQueueSnapshot(doctorId);
    req.io.emit("queueUpdated", snapshot);
    req.io.emit("waitTimeUpdated", snapshot);

    res.json({ patient, snapshot });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** POST /api/pause-queue */
exports.pauseQueue = async (req, res) => {
  try {
    const state = await getState();
    state.paused = true;
    await state.save();
    req.io.emit("systemStatusUpdated", { paused: true });
    res.json({ paused: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** POST /api/resume-queue */
exports.resumeQueue = async (req, res) => {
  try {
    const state = await getState();
    state.paused = false;
    await state.save();
    req.io.emit("systemStatusUpdated", { paused: false });
    res.json({ paused: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
