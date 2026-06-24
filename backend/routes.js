const router  = require("express").Router();
const patient = require("./controllers/patientController");
const queue   = require("./controllers/queueController");
const doctor  = require("./controllers/doctorController");

// Patient
router.post("/patients",     patient.addPatient);
router.get("/queue",         patient.getQueue);

// Queue operations
router.post("/call-next",             queue.callNext);
router.post("/complete-consultation", queue.completeConsultation);
router.post("/skip-token",            queue.skipToken);
router.post("/pause-queue",           queue.pauseQueue);
router.post("/resume-queue",          queue.resumeQueue);

// Doctors
router.get("/doctor-stats",  doctor.getDoctorStats);
router.post("/doctors",      doctor.createDoctor);

// System
router.get("/system-health", doctor.systemHealth);

module.exports = router;
