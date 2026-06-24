const BASE = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

async function req(method, path, body) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  getDoctors:           ()      => req("GET",  "/doctor-stats"),
  getQueue:             (doctorId) => req("GET",  `/queue?doctorId=${doctorId}`),
  addPatient:           (body)  => req("POST", "/patients",             body),
  callNext:             (doctorId) => req("POST", "/call-next",         { doctorId }),
  completeConsultation: (doctorId) => req("POST", "/complete-consultation", { doctorId }),
  skipToken:            (doctorId, patientId) => req("POST", "/skip-token",  { doctorId, patientId }),
  pauseQueue:           ()      => req("POST", "/pause-queue"),
  resumeQueue:          ()      => req("POST", "/resume-queue"),
};
