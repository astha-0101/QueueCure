/**
 * Wait-Time & AI Prediction Service
 *
 * - Rolling average of last 5 consultations per doctor
 * - ETA = patientsAhead × rollingAvg
 * - AI drift: if rollingAvg > baseline by >20%, flag and adjust message
 * - Confidence = 100 - normalised variance (lower variance → higher confidence)
 */

const Doctor = require("../models/Doctor");

/**
 * Compute variance of an array of numbers.
 */
function variance(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, x) => sum + (x - mean) ** 2, 0) / arr.length;
}

/**
 * Predict wait info for a doctor.
 * @param {Object} doctor - Mongoose Doctor doc
 * @param {number} patientsAhead - number of waiting patients before this patient
 * @returns {{ etaMinutes, confidence, aiAdjusted, aiMessage }}
 */
function predict(doctor, patientsAhead) {
  const durations = doctor.recentDurations || [];
  const baseline  = doctor.avgConsultationTime || 8;

  // Rolling average of last 5
  const rollingAvg = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : baseline;

  const etaMinutes = Math.round(patientsAhead * rollingAvg);

  // Confidence: based on variance (capped 0-100)
  const v   = variance(durations);
  const maxVariance = 25; // variance > 25 min² → 0% confidence
  const confidence  = Math.max(0, Math.round(100 - (v / maxVariance) * 100));

  // AI drift detection: flag if rollingAvg exceeds baseline by >20%
  const drift = rollingAvg - baseline;
  const aiAdjusted = drift > baseline * 0.2;
  const aiMessage   = aiAdjusted
    ? `AI detected recent consultations are running ~${Math.round(drift)} min longer than expected. ETA adjusted.`
    : null;

  return { etaMinutes, rollingAvg: Math.round(rollingAvg * 10) / 10, confidence, aiAdjusted, aiMessage };
}

/**
 * After a consultation completes, update doctor's rolling window and stats.
 * @param {string} doctorId
 * @param {number} durationMinutes
 */
async function recordConsultation(doctorId, durationMinutes) {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return;

  // Keep only last 5 durations
  const updated = [...doctor.recentDurations, durationMinutes].slice(-5);
  const newAvg  = updated.reduce((a, b) => a + b, 0) / updated.length;

  await Doctor.findByIdAndUpdate(doctorId, {
    recentDurations:      updated,
    avgConsultationTime:  Math.round(newAvg * 10) / 10,
    $inc: { patientsSeen: 1, currentQueueDepth: -1 },
  });
}

/**
 * Build a wait-time snapshot for every waiting patient of a doctor.
 * @param {Array} waitingPatients - sorted array of Patient docs
 * @param {Object} doctor - Doctor doc
 * @returns Array of { patient, etaMinutes, confidence, aiAdjusted, aiMessage }
 */
function buildQueueEtas(waitingPatients, doctor) {
  return waitingPatients.map((patient, index) => ({
    patient,
    ...predict(doctor, index + 1), // index+1 = patients ahead (including self if 1-based)
  }));
}

module.exports = { predict, recordConsultation, buildQueueEtas };
