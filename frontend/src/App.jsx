import { useState, useEffect, useCallback } from "react";
import socket from "./socket";
import { api } from "./api";

const C = {
  teal: "#1A7A5E", tealDark: "#0F5C47", tealLight: "#E8F5F0", tealMid: "#2D9E7A",
  purple: "#6B5CE7", purpleLight: "#F0EEFF",
  amber: "#D97706", amberLight: "#FEF3C7",
  green: "#059669", greenLight: "#ECFDF5",
  blue: "#2563EB", blueLight: "#EFF6FF",
  red: "#DC2626", redLight: "#FEF2F2",
  bg: "#F4F6F8", white: "#FFFFFF",
  gray50: "#F9FAFB", gray100: "#F3F4F6", gray200: "#E5E7EB",
  gray300: "#D1D5DB", gray400: "#9CA3AF", gray500: "#6B7280",
  gray600: "#4B5563", gray700: "#374151", gray800: "#1F2937", gray900: "#111827",
};

// ─── Shared ──────────────────────────────────────────────────────────────────

function Badge({ children, color, bg }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 10px",
      borderRadius:20, fontSize:12, fontWeight:600, color, background:bg, whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}

function LiveDot({ color = C.green }) {
  return (
    <span style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center", width:10, height:10 }}>
      <span style={{ position:"absolute", width:10, height:10, borderRadius:"50%", background:color, opacity:0.3, animation:"ping 1.5s ease-in-out infinite" }} />
      <span style={{ width:7, height:7, borderRadius:"50%", background:color, position:"relative" }} />
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background:C.white, borderRadius:14, border:`1px solid ${C.gray200}`,
      boxShadow:"0 1px 4px rgba(0,0,0,0.06)", ...style }}>
      {children}
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:C.teal, color:"#fff", padding:"12px 24px", borderRadius:12,
      fontSize:14, fontWeight:600, boxShadow:"0 8px 24px rgba(0,0,0,0.2)", zIndex:9999 }}>
      {msg}
    </div>
  );
}

// ─── Add Patient Modal ────────────────────────────────────────────────────────

function AddPatientPanel({ doctors, onAdded, onClose }) {
  const [form, setForm] = useState({ name:"", phone:"", doctor:"", visitType:"General", priority:0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.doctor) {
      setError("Name, phone, and doctor are required."); return;
    }
    setLoading(true); setError("");
    try {
      const data = await api.addPatient({ ...form });
      setSuccess(`Token T-${String(data.tokenNumber).padStart(2,"0")} issued for ${form.name}`);
      setForm({ name:"", phone:"", doctor:form.doctor, visitType:"General", priority:0 });
      onAdded(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const inputStyle = {
    width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${C.gray200}`,
    fontSize:14, color:C.gray800, outline:"none", boxSizing:"border-box",
    background:C.gray50, fontFamily:"inherit",
  };
  const labelStyle = { fontSize:12, fontWeight:600, color:C.gray500, marginBottom:4, display:"block" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:500,
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Card style={{ width:420, padding:28, position:"relative" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <span style={{ fontSize:18, fontWeight:800, color:C.gray900 }}>Add patient</span>
          <button onClick={onClose} style={{ border:"none", background:"none", fontSize:20, color:C.gray400, cursor:"pointer" }}>×</button>
        </div>

        {success ? (
          <div style={{ background:C.greenLight, border:`1px solid ${C.green}30`, borderRadius:10, padding:16, textAlign:"center" }}>
            <div style={{ fontSize:22, marginBottom:8 }}>✓</div>
            <div style={{ fontSize:15, fontWeight:700, color:C.green }}>{success}</div>
            <button onClick={() => setSuccess(null)} style={{ marginTop:16, padding:"9px 22px", background:C.teal, color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:"pointer" }}>
              Add another
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={labelStyle}>Patient name</label>
              <input style={inputStyle} placeholder="e.g. Priya Sharma" value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Phone number</label>
              <input style={inputStyle} placeholder="10-digit mobile number" value={form.phone} onChange={e => set("phone", e.target.value)} maxLength={10} />
            </div>
            <div>
              <label style={labelStyle}>Visit type</label>
              <select style={inputStyle} value={form.visitType} onChange={e => set("visitType", e.target.value)}>
                {["General","Follow-up","New patient","Emergency"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Doctor</label>
              <select style={inputStyle} value={form.doctor} onChange={e => set("doctor", e.target.value)}>
                <option value="">Select doctor</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>{d.name} — avg {d.avgConsultationTime} min</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select style={inputStyle} value={form.priority} onChange={e => set("priority", Number(e.target.value))}>
                <option value={0}>Normal</option>
                <option value={1}>High</option>
                <option value={2}>Emergency</option>
              </select>
            </div>

            {error && <div style={{ background:C.redLight, color:C.red, borderRadius:9, padding:"10px 14px", fontSize:13 }}>{error}</div>}

            <button onClick={submit} disabled={loading} style={{
              background:C.teal, color:"#fff", border:"none", borderRadius:10,
              padding:"13px 0", fontSize:15, fontWeight:700, cursor:"pointer",
              opacity:loading ? 0.7 : 1, marginTop:4,
            }}>
              {loading ? "Issuing..." : "Issue token"}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Receptionist ─────────────────────────────────────────────────────────────

function ReceptionistView() {
  const [doctors, setDoctors]           = useState([]);
  const [activeDoctorId, setActiveDoctorId] = useState("");
  const [snapshot, setSnapshot]         = useState(null);
  const [toast, setToast]               = useState(null);
  const [showAdd, setShowAdd]           = useState(false);
  const [navItem, setNavItem]           = useState("Live queue");
  const [activity, setActivity]         = useState([]);
  const [socketOk, setSocketOk]         = useState(false);
  const [paused, setPaused]             = useState(false);

  const pushActivity = (type, label) => {
    setActivity(a => [{ type, label, time: new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) }, ...a].slice(0, 20));
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Load doctors
  useEffect(() => {
    api.getDoctors().then(docs => {
      setDoctors(docs);
      if (docs.length) setActiveDoctorId(docs[0]._id);
    }).catch(console.error);
  }, []);

  // Load snapshot when doctor selected
  useEffect(() => {
    if (!activeDoctorId) return;
    api.getQueue(activeDoctorId).then(setSnapshot).catch(console.error);
    socket.emit("subscribe", { doctorId: activeDoctorId });
  }, [activeDoctorId]);

  // Socket events
  useEffect(() => {
    socket.on("connect",    () => setSocketOk(true));
    socket.on("disconnect", () => setSocketOk(false));

    socket.on("queueUpdated", snap => { setSnapshot(snap); if (snap.paused !== undefined) setPaused(snap.paused); });
    socket.on("tokenAdvanced", ({ token, name }) => { pushActivity("called", `Token T-${token} called — ${name}`); });
    socket.on("patientAdded",  ({ patient })  => pushActivity("added",  `Patient T-${patient.tokenNumber} added`));
    socket.on("consultationCompleted", ({ tokenNumber }) => pushActivity("done", `Consultation completed — T-${tokenNumber}`));
    socket.on("systemStatusUpdated", ({ paused: p }) => setPaused(p));

    return () => socket.removeAllListeners();
  }, []);

  const handleCallNext = async () => {
    try {
      const res = await api.callNext(activeDoctorId);
      showToast(`T-${res.patient.tokenNumber} called — ${res.patient.name}`);
    } catch (e) { showToast(`⚠ ${e.message}`); }
  };

  const handleComplete = async () => {
    try {
      await api.completeConsultation(activeDoctorId);
      showToast("Consultation completed ✓");
    } catch (e) { showToast(`⚠ ${e.message}`); }
  };

  const handleSkip = async (patientId) => {
    try { await api.skipToken(activeDoctorId, patientId); showToast("Patient skipped"); }
    catch (e) { showToast(`⚠ ${e.message}`); }
  };

  const handlePauseResume = async () => {
    try {
      if (paused) { await api.resumeQueue(); showToast("Queue resumed"); }
      else        { await api.pauseQueue();  showToast("Queue paused"); }
    } catch (e) { showToast(`⚠ ${e.message}`); }
  };

  const serving = snapshot?.serving;
  const queue   = snapshot?.queue || [];
  const nextUp  = queue[0];
  const activeDoctor = doctors.find(d => d._id === activeDoctorId);
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Inter',-apple-system,sans-serif", display:"flex" }}>
      {/* Sidebar */}
      <div style={{ width:220, background:C.white, borderRight:`1px solid ${C.gray200}`, padding:"20px 0", display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"0 20px 24px", borderBottom:`1px solid ${C.gray100}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, background:C.teal, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ color:"#fff", fontSize:16 }}>⚕</span>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:C.gray900 }}>Queue Cure <span style={{ color:C.teal }}>'26</span></div>
              <div style={{ fontSize:11, color:C.gray400 }}>City Clinic · Reception</div>
            </div>
          </div>
        </div>

        <nav style={{ padding:"16px 12px", flex:1 }}>
          {[
            { icon:"⚡", label:"Live queue" },
            { icon:"+",  label:"Add patient" },
            { icon:"👩‍⚕️", label:"Doctors on duty" },
          ].map(({ icon, label }) => (
            <div key={label} onClick={() => { setNavItem(label); if (label === "Add patient") setShowAdd(true); }}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:9,
                cursor:"pointer", marginBottom:2,
                background:navItem === label ? C.tealLight : "transparent",
                color:navItem === label ? C.teal : C.gray600,
                fontSize:13, fontWeight:navItem === label ? 700 : 400 }}>
              <span>{icon}</span>{label}
            </div>
          ))}
        </nav>

        {/* Doctor switcher */}
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${C.gray100}` }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.gray400, marginBottom:8 }}>DOCTOR</div>
          {doctors.map(d => (
            <div key={d._id} onClick={() => setActiveDoctorId(d._id)}
              style={{ padding:"8px 10px", borderRadius:8, cursor:"pointer", marginBottom:4,
                background:activeDoctorId === d._id ? C.tealLight : "transparent",
                color:activeDoctorId === d._id ? C.teal : C.gray600, fontSize:12, fontWeight:activeDoctorId === d._id ? 700 : 400 }}>
              {d.name}
            </div>
          ))}
        </div>

        <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.gray100}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:socketOk ? C.green : C.red }} />
            <span style={{ fontSize:11, color:C.gray500 }}>{socketOk ? "Socket live" : "Reconnecting..."}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, padding:"28px 32px", overflowY:"auto" }}>

        {/* Hero */}
        <div style={{ background:`linear-gradient(135deg, ${C.tealDark} 0%, ${C.teal} 100%)`,
          borderRadius:16, padding:"24px 28px", color:C.white, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <div>
              <p style={{ margin:0, fontSize:12, opacity:0.75 }}>City Clinic · General OPD</p>
              <h1 style={{ margin:"4px 0 6px", fontSize:24, fontWeight:700 }}>{greeting}, Astha</h1>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <LiveDot color="#4ADE80" />
                <span style={{ fontSize:13, opacity:0.85 }}>{paused ? "Queue paused" : "Queue running smoothly"}</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {[
                { val: activeDoctor?.patientsSeen ?? 0, label:"Patients served" },
                { val: queue.length, label:"Waiting" },
                { val: activeDoctor ? `${activeDoctor.avgConsultationTime}m` : "—", label:"Avg consult" },
              ].map(({ val, label }) => (
                <div key={label} style={{ background:"rgba(255,255,255,0.12)", borderRadius:12, padding:"10px 18px", textAlign:"center", border:"1px solid rgba(255,255,255,0.18)" }}>
                  <div style={{ fontSize:22, fontWeight:700 }}>{val}</div>
                  <div style={{ fontSize:11, opacity:0.75, marginTop:2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Socket status bar */}
        <div style={{ display:"flex", alignItems:"center", gap:8, background:socketOk ? C.greenLight : C.amberLight,
          borderRadius:8, padding:"8px 14px", border:`1px solid ${socketOk ? C.green : C.amber}30`, marginBottom:20 }}>
          <LiveDot color={socketOk ? C.green : C.amber} />
          <span style={{ fontSize:12, color:socketOk ? C.green : C.amber, fontWeight:600 }}>
            {socketOk ? "Live sync active · real-time updates" : "Reconnecting to server..."}
          </span>
        </div>

        {/* KPI cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
          {[
            { label:"NOW SERVING", value: serving ? `T-${serving.tokenNumber}` : "—", sub: serving?.name || "No active patient", accent:C.teal },
            { label:"IN QUEUE",    value: queue.length, sub:`${queue.length} waiting`, accent:C.blue },
            { label:"AVG CONSULT", value: activeDoctor ? `${activeDoctor.avgConsultationTime}m` : "—", sub:"Rolling 5 consultations", badge:"AI", accent:C.purple },
            { label:"MAX WAIT",    value: queue.length ? `${queue[queue.length-1]?.etaMinutes ?? "?"}m` : "—", sub: queue[queue.length-1] ? `T-${queue[queue.length-1].tokenNumber}` : "Empty queue", accent:C.amber },
          ].map(({ label, value, sub, badge, accent }) => (
            <Card key={label} style={{ padding:"20px 20px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:700, color:C.gray400, letterSpacing:0.8 }}>{label}</span>
                <span style={{ width:8, height:8, borderRadius:"50%", background:accent, display:"block" }} />
              </div>
              <div style={{ fontSize:30, fontWeight:800, color:C.gray900, lineHeight:1 }}>{value}</div>
              <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:12, color:C.gray500 }}>{sub}</span>
                {badge && <Badge color={C.purple} bg={C.purpleLight}>{badge}</Badge>}
              </div>
            </Card>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20 }}>

          {/* Queue table */}
          <Card style={{ overflow:"hidden" }}>
            <div style={{ padding:"16px 20px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${C.gray100}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:16, fontWeight:700, color:C.gray900 }}>Queue</span>
                <span style={{ background:C.teal, color:"#fff", borderRadius:20, fontSize:12, fontWeight:700, padding:"1px 9px" }}>{queue.length}</span>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={handlePauseResume} style={{
                  border:`1px solid ${C.gray200}`, background:C.white, borderRadius:9,
                  padding:"8px 14px", cursor:"pointer", fontSize:13, color:C.gray600, fontWeight:600 }}>
                  {paused ? "▶ Resume" : "⏸ Pause"}
                </button>
                {serving && (
                  <button onClick={handleComplete} style={{ background:C.green, color:"#fff", border:"none",
                    borderRadius:9, padding:"8px 16px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    ✓ Complete
                  </button>
                )}
                <button onClick={handleCallNext} disabled={!nextUp || paused} style={{
                  background:(!nextUp || paused) ? C.gray300 : C.teal, color:"#fff", border:"none",
                  borderRadius:9, padding:"9px 20px", fontSize:14, fontWeight:700, cursor:"pointer",
                  boxShadow:(!nextUp || paused) ? "none" : `0 4px 14px ${C.teal}55` }}>
                  Call next{nextUp ? ` — T-${nextUp.tokenNumber}` : ""} →
                </button>
              </div>
            </div>

            {/* In-room patient */}
            {serving && (
              <div style={{ padding:"14px 20px", background:C.tealLight, borderBottom:`1px solid ${C.gray100}`,
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:4, height:40, background:C.green, borderRadius:4 }} />
                  <div>
                    <span style={{ fontWeight:700, color:C.teal, fontSize:15 }}>T-{serving.tokenNumber}</span>
                    <span style={{ marginLeft:12, fontSize:13, color:C.teal }}>{serving.name}</span>
                  </div>
                </div>
                <Badge color={C.green} bg={C.greenLight}>In room</Badge>
              </div>
            )}

            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:C.gray50 }}>
                  {["Token","Patient","Type","Wait","AI ETA",""].map(h => (
                    <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:C.gray400, letterSpacing:0.6 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queue.length === 0 && (
                  <tr><td colSpan={6} style={{ padding:40, textAlign:"center", color:C.gray400, fontSize:14 }}>Queue is empty</td></tr>
                )}
                {queue.map((p, i) => (
                  <tr key={p._id} style={{ borderBottom:`1px solid ${C.gray100}`, background:i===0 ? C.amberLight : C.white }}>
                    <td style={{ padding:"16px 16px 16px 20px", fontWeight:700, fontSize:14, color:i===0 ? C.amber : C.gray700 }}>
                      T-{p.tokenNumber}
                    </td>
                    <td style={{ padding:"16px", fontSize:14, color:C.gray800 }}>{p.name}</td>
                    <td style={{ padding:"16px" }}>
                      <Badge
                        color={p.visitType==="Follow-up" ? C.purple : p.visitType==="New patient" ? C.blue : p.visitType==="Emergency" ? C.red : C.gray600}
                        bg={p.visitType==="Follow-up" ? C.purpleLight : p.visitType==="New patient" ? C.blueLight : p.visitType==="Emergency" ? C.redLight : C.gray100}>
                        {p.visitType}
                      </Badge>
                    </td>
                    <td style={{ padding:"16px", fontSize:13, color:C.gray500 }}>{p.patientsAhead} ahead</td>
                    <td style={{ padding:"16px" }}>
                      <div>
                        <span style={{ fontWeight:700, fontSize:14, color:C.amber }}>~{p.etaMinutes}m</span>
                        {p.aiAdjusted && <span style={{ marginLeft:6, fontSize:10, color:C.purple }}>AI↑</span>}
                      </div>
                      <div style={{ fontSize:11, color:C.gray400 }}>{p.confidence}% confidence</div>
                    </td>
                    <td style={{ padding:"16px" }}>
                      <button onClick={() => handleSkip(p._id)} style={{
                        border:`1px solid ${C.gray200}`, background:C.white, borderRadius:7,
                        padding:"5px 10px", cursor:"pointer", fontSize:12, color:C.gray500 }}>
                        Skip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Right panel */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {/* Doctors */}
            <Card style={{ padding:20 }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.gray900, marginBottom:14 }}>Doctors on duty</div>
              {doctors.map(doc => (
                <div key={doc._id} style={{ border:`1px solid ${C.gray200}`, borderRadius:12, padding:14,
                  background:C.gray50, marginBottom:10,
                  boxShadow:activeDoctorId===doc._id ? `0 0 0 2px ${C.teal}` : "none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:C.teal,
                      display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:12 }}>
                      {doc.name.split(" ").filter(w=>w.match(/[A-Z]/)).map(w=>w[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.gray900 }}>{doc.name}</div>
                      <div style={{ fontSize:11, color:C.gray400 }}>{doc.specialization}</div>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
                    {[{ v:doc.patientsSeen, l:"Seen" }, { v:`${doc.avgConsultationTime}m`, l:"Avg" }, { v:doc.currentQueueDepth, l:"Queued" }].map(({ v, l }) => (
                      <div key={l} style={{ textAlign:"center", background:C.white, borderRadius:8, padding:"6px 4px", border:`1px solid ${C.gray200}` }}>
                        <div style={{ fontSize:16, fontWeight:700, color:C.gray900 }}>{v}</div>
                        <div style={{ fontSize:10, color:C.gray400 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Card>

            {/* Activity */}
            <Card style={{ padding:20 }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.gray900, marginBottom:14 }}>Activity</div>
              {activity.length === 0 && <div style={{ fontSize:13, color:C.gray400 }}>No activity yet.</div>}
              {activity.slice(0,8).map((a, i) => {
                const colorMap = { called:C.green, added:C.blue, done:C.amber, ai:C.purple };
                const bgMap    = { called:C.greenLight, added:C.blueLight, done:C.amberLight, ai:C.purpleLight };
                const iconMap  = { called:"👤", added:"+", done:"✓", ai:"✦" };
                return (
                  <div key={i} style={{ display:"flex", gap:10, paddingBottom:10, borderBottom:i<activity.slice(0,8).length-1 ? `1px solid ${C.gray100}` : "none", marginBottom:10 }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:bgMap[a.type]||C.gray100,
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:11,
                      color:colorMap[a.type]||C.gray500, fontWeight:700, flexShrink:0 }}>
                      {iconMap[a.type]||"·"}
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:500, color:C.gray800 }}>{a.label}</div>
                      <div style={{ fontSize:11, color:C.gray400 }}>{a.time}</div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        </div>
      </div>

      {showAdd && (
        <AddPatientPanel
          doctors={doctors}
          onAdded={(data) => { pushActivity("added", `T-${data.tokenNumber} — ${data.patient.name}`); }}
          onClose={() => { setShowAdd(false); setNavItem("Live queue"); }}
        />
      )}
      <Toast msg={toast} />
    </div>
  );
}

// ─── Patient Mobile View ──────────────────────────────────────────────────────

function PatientView() {
  const [tokenInput, setTokenInput] = useState("");
  const [myToken, setMyToken]       = useState(null);
  const [snapshot, setSnapshot]     = useState(null);
  const [doctors, setDoctors]       = useState([]);
  const [activeDoctorId, setActiveDoctorId] = useState("");
  const [lastSync, setLastSync]     = useState("just now");
  const [socketOk, setSocketOk]     = useState(false);

  useEffect(() => {
    api.getDoctors().then(docs => {
      setDoctors(docs);
      if (docs.length) { setActiveDoctorId(docs[0]._id); }
    });
  }, []);

  useEffect(() => {
    if (!activeDoctorId) return;
    api.getQueue(activeDoctorId).then(setSnapshot);
    socket.emit("subscribe", { doctorId: activeDoctorId });
  }, [activeDoctorId]);

  useEffect(() => {
    socket.on("connect",      () => setSocketOk(true));
    socket.on("disconnect",   () => setSocketOk(false));
    socket.on("queueUpdated", snap => { setSnapshot(snap); setLastSync("just now"); });
    return () => socket.removeAllListeners();
  }, []);

  useEffect(() => {
    let s = 0;
    const t = setInterval(() => { s++; setLastSync(s < 60 ? `${s}s ago` : "just now"); if (s >= 60) s = 0; }, 1000);
    return () => clearInterval(t);
  }, [snapshot]);

  const serving  = snapshot?.serving;
  const queue    = snapshot?.queue || [];
  const myEntry  = myToken ? queue.find(p => p.tokenNumber === Number(myToken)) : null;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Inter',-apple-system,sans-serif", maxWidth:430, margin:"0 auto" }}>
      <div style={{ background:`linear-gradient(135deg, ${C.tealDark} 0%, ${C.teal} 100%)`, padding:"28px 20px 24px", color:"#fff" }}>
        <div style={{ fontSize:12, opacity:0.75, marginBottom:4 }}>City Clinic · General OPD</div>
        <h1 style={{ margin:"0 0 14px", fontSize:24, fontWeight:800 }}>Your queue status</h1>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <LiveDot color="#4ADE80" />
          <span style={{ fontSize:13, opacity:0.9 }}>Live updates {socketOk ? "active" : "reconnecting..."}</span>
        </div>
      </div>

      <div style={{ padding:"0 16px 32px" }}>
        {/* Sync bar */}
        <div style={{ background:C.greenLight, border:`1px solid ${C.green}20`,
          borderRadius:"0 0 10px 10px", padding:"8px 14px",
          display:"flex", alignItems:"center", gap:7, marginBottom:20 }}>
          <LiveDot color={C.green} />
          <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>Live updates active</span>
          <span style={{ fontSize:12, color:C.gray400 }}>· Last synced {lastSync}</span>
        </div>

        {/* Doctor selector */}
        <div style={{ marginBottom:16 }}>
          <select style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${C.gray200}`,
            fontSize:14, color:C.gray800, fontFamily:"inherit", background:C.white }}
            value={activeDoctorId} onChange={e => setActiveDoctorId(e.target.value)}>
            {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>

        {/* Token lookup */}
        <Card style={{ padding:16, marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.gray400, marginBottom:10 }}>LOOK UP YOUR TOKEN</div>
          <div style={{ display:"flex", gap:8 }}>
            <input placeholder="Enter token number" value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              style={{ flex:1, padding:"10px 12px", borderRadius:9, border:`1px solid ${C.gray200}`, fontSize:14, outline:"none" }} />
            <button onClick={() => setMyToken(tokenInput)} style={{
              background:C.teal, color:"#fff", border:"none", borderRadius:9,
              padding:"10px 18px", fontSize:14, fontWeight:700, cursor:"pointer" }}>Go</button>
          </div>
        </Card>

        {/* Status cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr 1fr", gap:10, marginBottom:20 }}>
          <Card style={{ padding:"14px 12px", textAlign:"center" }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.gray400, letterSpacing:0.6, marginBottom:8 }}>NOW SERVING</div>
            <div style={{ fontSize:26, fontWeight:800, color:C.teal }}>{serving ? `T-${serving.tokenNumber}` : "—"}</div>
          </Card>
          <Card style={{ padding:"14px 12px", textAlign:"center", border:`2px solid ${C.purple}`, boxShadow:`0 0 0 3px ${C.purpleLight}` }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.gray400, letterSpacing:0.6, marginBottom:8 }}>YOUR TOKEN</div>
            <div style={{ fontSize:30, fontWeight:900, color:C.purple }}>{myEntry ? `T-${myEntry.tokenNumber}` : "—"}</div>
            <div style={{ fontSize:12, color:C.gray400, marginTop:4 }}>{myEntry ? `${myEntry.patientsAhead} ahead` : "enter token"}</div>
          </Card>
          <Card style={{ padding:"14px 12px", textAlign:"center" }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.gray400, letterSpacing:0.6, marginBottom:8 }}>YOUR WAIT</div>
            <div style={{ fontSize:26, fontWeight:800, color:C.amber }}>{myEntry ? `${myEntry.etaMinutes}m` : "—"}</div>
          </Card>
        </div>

        {/* AI prediction card */}
        {myEntry?.aiAdjusted && (
          <Card style={{ padding:16, marginBottom:16, background:C.purpleLight, border:`1px solid ${C.purple}20` }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
              <span style={{ color:C.purple }}>✦</span>
              <span style={{ fontSize:12, fontWeight:700, color:C.purple }}>AI Wait Estimate</span>
            </div>
            <p style={{ margin:"0 0 6px", fontSize:12, color:C.purple, lineHeight:1.5 }}>{myEntry.aiMessage}</p>
            <div style={{ fontSize:11, color:C.purple, opacity:0.7 }}>Confidence: {myEntry.confidence}%</div>
          </Card>
        )}

        {/* Queue list */}
        <Card style={{ overflow:"hidden", marginBottom:16 }}>
          <div style={{ padding:"16px 20px 12px", fontWeight:700, fontSize:15, color:C.gray900 }}>Queue</div>
          {serving && (
            <div style={{ padding:"14px 20px", borderTop:`1px solid ${C.gray100}`, background:C.tealLight,
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <span style={{ fontSize:14, fontWeight:700, color:C.teal }}>T-{serving.tokenNumber}</span>
                <span style={{ fontSize:13, color:C.teal }}>Now in consultation</span>
              </div>
              <span style={{ width:8, height:8, borderRadius:"50%", background:C.green }} />
            </div>
          )}
          {queue.map((p, i) => (
            <div key={p._id} style={{ padding:"14px 20px", borderTop:`1px solid ${C.gray100}`,
              background:p.tokenNumber===Number(myToken) ? C.purpleLight : C.white,
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <span style={{ fontSize:14, fontWeight:700, color:p.tokenNumber===Number(myToken) ? C.purple : C.gray700 }}>T-{p.tokenNumber}</span>
                <span style={{ fontSize:13, color:C.gray500 }}>
                  {p.tokenNumber===Number(myToken) ? `${p.name} — you` : i===0 ? "Next up" : "Waiting"}
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:12, color:C.amber }}>{p.etaMinutes}m</span>
                {p.tokenNumber===Number(myToken) && <Badge color={C.purple} bg="#fff">You</Badge>}
              </div>
            </div>
          ))}
          {!serving && queue.length===0 && (
            <div style={{ padding:24, textAlign:"center", color:C.gray400, fontSize:14 }}>Queue is empty</div>
          )}
          <div style={{ padding:"12px 20px", background:C.gray50, borderTop:`1px solid ${C.gray100}`, display:"flex", gap:8, alignItems:"flex-start" }}>
            <span style={{ fontSize:13 }}>🔒</span>
            <span style={{ fontSize:12, color:C.gray400 }}>Other patients shown as tokens only. No personal info visible.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("receptionist");

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes ping { 0%,100%{transform:scale(1);opacity:0.3;} 50%{transform:scale(1.8);opacity:0;} }
        select,input { font-family: inherit; }
      `}</style>

      <div style={{ position:"fixed", top:12, left:"50%", transform:"translateX(-50%)", zIndex:1000,
        display:"flex", gap:0, background:C.white, borderRadius:10, padding:4,
        boxShadow:"0 2px 12px rgba(0,0,0,0.12)", border:`1px solid ${C.gray200}` }}>
        <span style={{ fontSize:12, color:C.gray400, padding:"6px 12px 6px 8px", alignSelf:"center" }}>Preview:</span>
        {[{ id:"receptionist", label:"Receptionist — Desktop" }, { id:"patient", label:"Patient — Mobile" }].map(({ id, label }) => (
          <button key={id} onClick={() => setView(id)} style={{
            padding:"7px 16px", borderRadius:7, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
            background:view===id ? C.teal : "transparent",
            color:view===id ? "#fff" : C.gray500, transition:"all 0.15s" }}>{label}</button>
        ))}
      </div>

      <div style={{ paddingTop:52 }}>
        {view === "receptionist" ? <ReceptionistView /> : <PatientView />}
      </div>
    </div>
  );
}
