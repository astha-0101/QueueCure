const Patient      = require("../models/Patient");
const Doctor       = require("../models/Doctor");
const Consultation = require("../models/Consultation");
const SystemState  = require("../models/SystemState");
const { buildQueueEtas, recordConsultation } = require("./etaService");

/** Return or create the singleton system state doc. */
async function getState() {
  let state = await SystemState.findById("singleton");
  if (!state) state = await SystemState.create({ _id: "singleton" });
  return state;
}

/**
 * Full queue snapshot for a doctor — used to broadcast after every mutation.
 * Returns the structured payload that both screens consume.
 */
async function getQueueSnapshot(doctorId) {
  const doctor  = await Doctor.findById(doctorId);
  const state   = await getState();
  const active  = state.activeConsultations?.get?.(doctorId.toString()) || null;

  // All non-terminal patients, sorted by priority desc then createdAt asc
  const patients = await Patient.find({
    doctor: doctorId,
    status: { $in: ["waiting", "in-room"] },
  }).sort({ priority: -1, createdAt: 1 });

  const waiting = patients.filter(p => p.status === "waiting");
  const serving = patients.find(p => p.status === "in-room") || null;

  const etas = buildQueueEtas(waiting, doctor);

  return {
    doctor,
    serving,
    queue: etas.map(({ patient, etaMinutes, confidence, aiAdjusted, aiMessage }, i) => ({
      _id:         patient._id,
      tokenNumber: patient.tokenNumber,
      name:        patient.name,
      visitType:   patient.visitType,
      priority:    patient.priority,
      status:      patient.status,
      createdAt:   patient.createdAt,
      patientsAhead: i,
      etaMinutes,
      confidence,
      aiAdjusted,
      aiMessage,
    })),
    paused:          state.paused,
    activeConsultId: active,
  };
}

/**
 * Advance queue: mark next waiting patient as "in-room", open consultation.
 * Caller is responsible for concurrency locking.
 */
async function callNext(doctorId, io) {
  const state = await getState();
  if (state.paused) throw Object.assign(new Error("Queue is paused."), { status: 409 });

  // Find current in-room patient
  const currentInRoom = await Patient.findOne({ doctor: doctorId, status: "in-room" });
  if (currentInRoom) throw Object.assign(new Error("A patient is already in the room. Complete current consultation first."), { status: 409 });

  const next = await Patient.findOne({ doctor: doctorId, status: "waiting" }).sort({ priority: -1, createdAt: 1 });
  if (!next) throw Object.assign(new Error("Queue is empty."), { status: 404 });

  next.status = "in-room";
  await next.save();

  // Create consultation record
  const consult = await Consultation.create({ patientId: next._id, doctorId, startTime: new Date() });

  // Store active consultation id
  state.activeConsultations.set(doctorId.toString(), consult._id.toString());
  state.markModified("activeConsultations");
  await state.save();

  await Doctor.findByIdAndUpdate(doctorId, { $inc: { currentQueueDepth: -1 } });

  const snapshot = await getQueueSnapshot(doctorId);
  io.emit("queueUpdated", snapshot);
  io.emit("tokenAdvanced", { token: next.tokenNumber, name: next.name, doctorId });
  io.emit("consultationStarted", { patientId: next._id, tokenNumber: next.tokenNumber, doctorId });

  return { patient: next, consultation: consult, snapshot };
}

/**
 * Complete current consultation: compute duration, update stats, emit events.
 */
async function completeConsultation(doctorId, io) {
  const serving = await Patient.findOne({ doctor: doctorId, status: "in-room" });
  if (!serving) throw Object.assign(new Error("No active consultation."), { status: 404 });

  const state = await getState();
  const consultId = state.activeConsultations?.get?.(doctorId.toString());

  let durationMinutes = 8; // fallback

  if (consultId) {
    const consult = await Consultation.findById(consultId);
    if (consult) {
      consult.endTime  = new Date();
      consult.duration = Math.round((consult.endTime - consult.startTime) / 60000) || 1;
      durationMinutes  = consult.duration;
      await consult.save();
    }
    state.activeConsultations.delete(doctorId.toString());
    state.markModified("activeConsultations");
    await state.save();
  }

  serving.status = "completed";
  await serving.save();

  // Update rolling average
  await recordConsultation(doctorId, durationMinutes);

  const snapshot = await getQueueSnapshot(doctorId);
  const doctor   = await Doctor.findById(doctorId);

  io.emit("consultationCompleted", { patientId: serving._id, tokenNumber: serving.tokenNumber, durationMinutes });
  io.emit("queueUpdated", snapshot);
  io.emit("waitTimeUpdated", snapshot);
  io.emit("doctorStatsUpdated", { doctorId, patientsSeen: doctor.patientsSeen, avgConsultationTime: doctor.avgConsultationTime });

  return { serving, durationMinutes, snapshot };
}

module.exports = { getQueueSnapshot, callNext, completeConsultation, getState };
