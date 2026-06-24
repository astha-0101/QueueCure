/**
 * Run: node seed.js
 * Seeds 2 doctors and 6 patients into MongoDB.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Doctor   = require("./models/Doctor");
const Patient  = require("./models/Patient");
const SystemState = require("./models/SystemState");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");

  await Doctor.deleteMany({});
  await Patient.deleteMany({});
  await SystemState.deleteMany({});

  const d1 = await Doctor.create({ name: "Dr. Anita Mehta", specialization: "General physician", avgConsultationTime: 8, recentDurations: [8,9,7,8,10] });
  const d2 = await Doctor.create({ name: "Dr. Rajiv Singh",  specialization: "Cardiology",        avgConsultationTime: 14, recentDurations: [14,15,13,12,14] });

  const patients = [
    { tokenNumber: 1, name: "Priya Sharma",  phone: "9000000001", doctor: d1._id, visitType: "General",     status: "in-room"  },
    { tokenNumber: 2, name: "Ravi Gupta",    phone: "9000000002", doctor: d1._id, visitType: "Follow-up",   status: "waiting"  },
    { tokenNumber: 3, name: "Anon",          phone: "9000000003", doctor: d1._id, visitType: "General",     status: "waiting"  },
    { tokenNumber: 4, name: "Arjun Patel",   phone: "9000000004", doctor: d1._id, visitType: "New patient", status: "waiting"  },
    { tokenNumber: 5, name: "Anon",          phone: "9000000005", doctor: d1._id, visitType: "General",     status: "waiting"  },
    { tokenNumber: 6, name: "Anon",          phone: "9000000006", doctor: d1._id, visitType: "Follow-up",   status: "waiting"  },
  ];
  await Patient.insertMany(patients);
  await SystemState.create({ _id: "singleton" });

  await Doctor.findByIdAndUpdate(d1._id, { currentQueueDepth: 5 });

  console.log("✅ Seeded: 2 doctors, 6 patients");
  await mongoose.disconnect();
}

seed().catch(console.error);
