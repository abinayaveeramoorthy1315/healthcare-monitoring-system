import { useEffect, useState } from "react";
import api from "../api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  FaHeartbeat, FaLungs, FaThermometerHalf, FaTint,
  FaUserInjured, FaPlus, FaTimes, FaSave,
  FaExclamationTriangle, FaClock, FaChartLine
} from "react-icons/fa";

export default function VitalSigns() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [latestVital, setLatestVital] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [alert, setAlert] = useState(null);
  const [shownAlertIds, setShownAlertIds] = useState(new Set());

  const [formData, setFormData] = useState({
    patientId: "", heartRate: "",
    bloodPressure: "", temperature: "", oxygenLevel: ""
  });

  const role = localStorage.getItem("role");

  useEffect(() => { loadPatients(); }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientVitals(selectedPatient.patientId);
      const interval = setInterval(() => {
        loadPatientVitals(selectedPatient.patientId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    try {
      const res = await api.get("/api/patients");
      setPatients(res.data);
    } catch (err) { console.error(err); }
  };

  const loadPatientVitals = async (patientId) => {
    try {
      const res = await api.get(`/api/vitalsigns/patient/${patientId}`);
      const data = res.data;

      if (data.length > 0) {
        const latest = data[data.length - 1];
        setLatestVital(latest);

        if (latest.riskLevel === "CRITICAL") {
          setShownAlertIds(prev => {
            if (!prev.has(latest.vitalId)) {
              setAlert(latest);
              return new Set([...prev, latest.vitalId]);
            }
            return prev;
          });
        }
      } else {
        setLatestVital(null);
      }

      const graphData = data.slice(-10).map((v, i) => ({
        time: v.recordedAt
          ? new Date(v.recordedAt).toLocaleTimeString()
          : `Record ${i + 1}`,
        heartRate: v.heartRate,
        oxygenLevel: v.oxygenLevel,
        temperature: v.temperature
      }));
      setVitalsHistory(graphData);
    } catch (err) { console.error(err); }
  };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleSave = async () => {
    if (!formData.patientId || !formData.heartRate ||
        !formData.oxygenLevel || !formData.temperature) {
      showMsg("Please fill all required fields!", "error");
      return;
    }
    try {
      await api.post("/api/vitalsigns", {
        heartRate: Number(formData.heartRate),
        oxygenLevel: Number(formData.oxygenLevel),
        temperature: Number(formData.temperature),
        bloodPressure: formData.bloodPressure,
        patient: { patientId: Number(formData.patientId) }
      });
      showMsg("Vitals added successfully!", "success");
      setFormData({
        patientId: "", heartRate: "",
        bloodPressure: "", temperature: "", oxygenLevel: ""
      });
      setShowModal(false);
      if (selectedPatient) loadPatientVitals(selectedPatient.patientId);
    } catch (err) {
      showMsg("Failed to add vitals!", "error");
    }
  };

  const calculateHealthScore = (v) => {
    if (!v) return 0;
    let score = 100;
    if (v.heartRate > 120) score -= 25;
    else if (v.heartRate > 100) score -= 10;
    if (v.oxygenLevel < 90) score -= 30;
    else if (v.oxygenLevel < 95) score -= 15;
    if (v.temperature > 39) score -= 25;
    else if (v.temperature > 37.5) score -= 10;
    return Math.max(score, 0);
  };

  const getRiskConfig = (level) => {
    if (level === "CRITICAL") return { color: "#dc2626", bg: "#fee2e2", label: "Critical" };
    if (level === "HIGH") return { color: "#d97706", bg: "#fef3c7", label: "High Risk" };
    return { color: "#16a34a", bg: "#dcfce7", label: "Stable" };
  };

  const healthScore = calculateHealthScore(latestVital);

  return (
    <div style={s.wrapper}>

      {/* ===== ALERT POPUP ===== */}
      {alert && (
        <div style={s.alertPopup}>
          <div style={s.alertPopupHeader}>
            <FaExclamationTriangle style={{ fontSize: "20px" }} />
            <span>EMERGENCY ALERT</span>
          </div>
          <p style={s.alertPopupMsg}>
            {alert.patient?.name} is in CRITICAL condition!
          </p>
          <button style={s.alertCloseBtn} onClick={() => setAlert(null)}>
            <FaTimes /> Dismiss
          </button>
        </div>
      )}

      {/* ===== ADD VITALS MODAL ===== */}
      {showModal && (
        <div
          style={s.modalOverlay}
          onClick={e => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setMessage({ text: "", type: "" });
            }
          }}
        >
          <div style={s.modalBox}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Add Patient Vitals</h3>
              <button
                style={s.modalClose}
                onClick={() => setShowModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            {message.text && (
              <div style={{
                ...s.msgBox,
                background: message.type === "success" ? "#dcfce7" : "#fee2e2",
                color: message.type === "success" ? "#15803d" : "#dc2626"
              }}>
                {message.text}
              </div>
            )}

            <div style={s.modalForm}>
              <div style={s.mFormGroup}>
                <label style={s.mLabel}>Select Patient *</label>
                <div style={s.mInputWrap}>
                  <FaUserInjured style={s.mInputIcon} />
                  <select
                    style={s.mInput}
                    value={formData.patientId}
                    onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                  >
                    <option value="">-- Select Patient --</option>
                    {patients.map(p => (
                      <option key={p.patientId} value={p.patientId}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={s.mFormGroup}>
                <label style={s.mLabel}>Heart Rate (bpm) *</label>
                <div style={s.mInputWrap}>
                  <FaHeartbeat style={{ ...s.mInputIcon, color: "#ef4444" }} />
                  <input
                    style={s.mInput}
                    type="number"
                    placeholder="e.g. 75"
                    value={formData.heartRate}
                    onChange={e => setFormData({ ...formData, heartRate: e.target.value })}
                  />
                </div>
              </div>

              <div style={s.mFormGroup}>
                <label style={s.mLabel}>Blood Pressure</label>
                <div style={s.mInputWrap}>
                  <FaTint style={{ ...s.mInputIcon, color: "#3b82f6" }} />
                  <input
                    style={s.mInput}
                    type="text"
                    placeholder="e.g. 120/80"
                    value={formData.bloodPressure}
                    onChange={e => setFormData({ ...formData, bloodPressure: e.target.value })}
                  />
                </div>
              </div>

              <div style={s.mFormGroup}>
                <label style={s.mLabel}>Temperature (°C) *</label>
                <div style={s.mInputWrap}>
                  <FaThermometerHalf style={{ ...s.mInputIcon, color: "#f59e0b" }} />
                  <input
                    style={s.mInput}
                    type="number"
                    step="0.1"
                    placeholder="e.g. 37.2"
                    value={formData.temperature}
                    onChange={e => setFormData({ ...formData, temperature: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ ...s.mFormGroup, gridColumn: "1 / -1" }}>
                <label style={s.mLabel}>Oxygen Level (%) *</label>
                <div style={s.mInputWrap}>
                  <FaLungs style={{ ...s.mInputIcon, color: "#10b981" }} />
                  <input
                    style={s.mInput}
                    type="number"
                    placeholder="e.g. 98"
                    value={formData.oxygenLevel}
                    onChange={e => setFormData({ ...formData, oxygenLevel: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={s.modalActions}>
              <button
                style={s.mCancelBtn}
                onClick={() => setShowModal(false)}
              >
                <FaTimes /> Cancel
              </button>
              <button style={s.mSaveBtn} onClick={handleSave}>
                <FaSave /> Save Vitals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PAGE HEADER ===== */}
      <div style={s.pageHeader}>
        <div style={s.headerLeft}>
          <div style={s.headerIcon}>
            <FaHeartbeat />
          </div>
          <div>
            <h1 style={s.pageTitle}>Real-time Patient Monitor</h1>
            <p style={s.pageSubtitle}>
              Live vitals tracking with 5-second refresh
            </p>
          </div>
        </div>
        {(role === "ADMIN" || role === "DOCTOR") && (
          <button
            style={s.addBtn}
            onClick={() => {
              setShowModal(true);
              setMessage({ text: "", type: "" });
            }}
          >
            <FaPlus /> Add Vitals
          </button>
        )}
      </div>

      {/* ===== SUCCESS MESSAGE ===== */}
      {message.text && !showModal && (
        <div style={{
          ...s.msgBox,
          background: message.type === "success" ? "#dcfce7" : "#fee2e2",
          color: message.type === "success" ? "#15803d" : "#dc2626",
          marginBottom: "20px"
        }}>
          {message.text}
        </div>
      )}

      {/* ===== PATIENT SELECTOR ===== */}
      <div style={s.selectorCard}>
        <div style={s.selectorHeader}>
          <FaUserInjured style={{ color: "#2563eb" }} />
          <h3 style={s.selectorTitle}>Select Patient to Monitor</h3>
        </div>
        <div style={s.patientBtns}>
          {patients.map(p => (
            <button
              key={p.patientId}
              onClick={() => {
                setSelectedPatient(p);
                setLatestVital(null);
                setVitalsHistory([]);
              }}
              style={{
                ...s.patientBtn,
                background: selectedPatient?.patientId === p.patientId
                  ? "linear-gradient(135deg, #1e40af, #2563eb)" : "white",
                color: selectedPatient?.patientId === p.patientId
                  ? "white" : "#374151",
                borderColor: selectedPatient?.patientId === p.patientId
                  ? "#2563eb" : "#e2e8f0",
                boxShadow: selectedPatient?.patientId === p.patientId
                  ? "0 4px 12px rgba(37,99,235,0.3)" : "none"
              }}
            >
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: selectedPatient?.patientId === p.patientId
                  ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: "700",
                color: selectedPatient?.patientId === p.patientId
                  ? "white" : "#6366f1"
              }}>
                {p.name?.charAt(0).toUpperCase()}
              </div>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* ===== SELECTED PATIENT MONITOR ===== */}
      {selectedPatient ? (
        <>
          {/* Info + Stats Grid */}
          <div style={s.monitorGrid}>

            {/* Patient Info Card */}
            <div style={{
              ...s.infoCard,
              borderLeft: `5px solid ${getRiskConfig(latestVital?.riskLevel).color}`
            }}>
              <div style={s.infoTop}>
                <div style={s.infoAvatar}>
                  {selectedPatient.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={s.infoName}>{selectedPatient.name}</h3>
                  <p style={s.infoMeta}>
                    {selectedPatient.age} yrs • {selectedPatient.gender}
                  </p>
                </div>
              </div>

              {latestVital ? (
                <>
                  {/* Risk Badge */}
                  <div style={{
                    background: getRiskConfig(latestVital.riskLevel).bg,
                    color: getRiskConfig(latestVital.riskLevel).color,
                    padding: "10px",
                    borderRadius: "10px",
                    textAlign: "center",
                    fontWeight: "700",
                    fontSize: "15px",
                    marginBottom: "16px"
                  }}>
                    {getRiskConfig(latestVital.riskLevel).label}
                  </div>

                  {/* Health Score */}
                  <div style={s.scoreContainer}>
                    <div style={{
                      ...s.scoreNumber,
                      color: healthScore > 80 ? "#16a34a" :
                             healthScore > 50 ? "#d97706" : "#dc2626"
                    }}>
                      {healthScore}
                    </div>
                    <div style={s.scoreLabel}>Health Score / 100</div>

                    {/* Score bar */}
                    <div style={s.scoreBar}>
                      <div style={{
                        ...s.scoreBarFill,
                        width: `${healthScore}%`,
                        background: healthScore > 80 ? "#16a34a" :
                                   healthScore > 50 ? "#d97706" : "#dc2626"
                      }} />
                    </div>
                  </div>

                  <div style={s.updatedTime}>
                    <FaClock style={{ fontSize: "11px" }} />
                    {latestVital.recordedAt
                      ? new Date(latestVital.recordedAt).toLocaleString()
                      : "N/A"}
                  </div>
                </>
              ) : (
                <div style={s.noVitals}>
                  No vitals recorded yet
                </div>
              )}
            </div>

            {/* Vital Stats */}
            {latestVital && (
              <div style={s.statsGrid}>

                {/* Heart Rate */}
                <div style={{ ...s.statCard, background: "#fff1f2", borderColor: "#fecaca" }}>
                  <div style={s.statIconWrap}>
                    <FaHeartbeat style={{ color: "#ef4444", fontSize: "20px" }} />
                  </div>
                  <div style={{ ...s.statValue, color: "#ef4444" }}>
                    {latestVital.heartRate}
                  </div>
                  <div style={s.statUnit}>bpm</div>
                  <div style={s.statLabel}>Heart Rate</div>
                  <div style={{
                    ...s.statStatus,
                    background: latestVital.heartRate > 120 ? "#fee2e2" :
                               latestVital.heartRate > 100 ? "#fef3c7" : "#dcfce7",
                    color: latestVital.heartRate > 120 ? "#dc2626" :
                           latestVital.heartRate > 100 ? "#b45309" : "#16a34a"
                  }}>
                    {latestVital.heartRate > 120 ? "Critical" :
                     latestVital.heartRate > 100 ? "Elevated" : "Normal"}
                  </div>
                </div>

                {/* Oxygen */}
                <div style={{ ...s.statCard, background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                  <div style={s.statIconWrap}>
                    <FaLungs style={{ color: "#16a34a", fontSize: "20px" }} />
                  </div>
                  <div style={{ ...s.statValue, color: "#16a34a" }}>
                    {latestVital.oxygenLevel}
                  </div>
                  <div style={s.statUnit}>%</div>
                  <div style={s.statLabel}>Oxygen Level</div>
                  <div style={{
                    ...s.statStatus,
                    background: latestVital.oxygenLevel < 90 ? "#fee2e2" :
                               latestVital.oxygenLevel < 95 ? "#fef3c7" : "#dcfce7",
                    color: latestVital.oxygenLevel < 90 ? "#dc2626" :
                           latestVital.oxygenLevel < 95 ? "#b45309" : "#16a34a"
                  }}>
                    {latestVital.oxygenLevel < 90 ? "Critical" :
                     latestVital.oxygenLevel < 95 ? "Low" : "Normal"}
                  </div>
                </div>

                {/* Temperature */}
                <div style={{ ...s.statCard, background: "#fffbeb", borderColor: "#fde68a" }}>
                  <div style={s.statIconWrap}>
                    <FaThermometerHalf style={{ color: "#d97706", fontSize: "20px" }} />
                  </div>
                  <div style={{ ...s.statValue, color: "#d97706" }}>
                    {latestVital.temperature}
                  </div>
                  <div style={s.statUnit}>°C</div>
                  <div style={s.statLabel}>Temperature</div>
                  <div style={{
                    ...s.statStatus,
                    background: latestVital.temperature > 39 ? "#fee2e2" :
                               latestVital.temperature > 37.5 ? "#fef3c7" : "#dcfce7",
                    color: latestVital.temperature > 39 ? "#dc2626" :
                           latestVital.temperature > 37.5 ? "#b45309" : "#16a34a"
                  }}>
                    {latestVital.temperature > 39 ? "Fever" :
                     latestVital.temperature > 37.5 ? "Elevated" : "Normal"}
                  </div>
                </div>

                {/* Blood Pressure */}
                <div style={{ ...s.statCard, background: "#eff6ff", borderColor: "#bfdbfe" }}>
                  <div style={s.statIconWrap}>
                    <FaTint style={{ color: "#2563eb", fontSize: "20px" }} />
                  </div>
                  <div style={{ ...s.statValue, color: "#2563eb", fontSize: "26px" }}>
                    {latestVital.bloodPressure || "-"}
                  </div>
                  <div style={s.statUnit}>mmHg</div>
                  <div style={s.statLabel}>Blood Pressure</div>
                  <div style={{
                    ...s.statStatus,
                    background: "#eff6ff",
                    color: "#2563eb"
                  }}>
                    Recorded
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Graph */}
          {vitalsHistory.length > 0 ? (
            <div style={s.graphCard}>
              <div style={s.graphHeader}>
                <div style={s.graphTitle}>
                  <div style={s.graphIcon}>
                    <FaChartLine />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                      {selectedPatient.name} - Vitals History
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                      Last {vitalsHistory.length} records • Auto refresh every 5s
                    </p>
                  </div>
                </div>

                <div style={s.liveBadge}>
                  <span style={s.liveDot} />
                  Live
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={vitalsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
                  }} />
                  <Legend />
                  <Line
                    type="monotone" dataKey="heartRate"
                    stroke="#ef4444" strokeWidth={2.5}
                    dot={{ r: 4, fill: "#ef4444" }} name="Heart Rate"
                  />
                  <Line
                    type="monotone" dataKey="oxygenLevel"
                    stroke="#10b981" strokeWidth={2.5}
                    dot={{ r: 4, fill: "#10b981" }} name="Oxygen Level"
                  />
                  <Line
                    type="monotone" dataKey="temperature"
                    stroke="#f59e0b" strokeWidth={2.5}
                    dot={{ r: 4, fill: "#f59e0b" }} name="Temperature"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={s.noVitalsCard}>
              <div style={s.noVitalsIcon}><FaHeartbeat /></div>
              <h3 style={{ color: "#0f172a", margin: "0 0 8px" }}>
                No Vitals Recorded
              </h3>
              <p style={{ color: "#64748b", margin: 0 }}>
                Click "Add Vitals" to record {selectedPatient.name}'s vitals
              </p>
            </div>
          )}
        </>
      ) : (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}><FaUserInjured /></div>
          <h3 style={{ color: "#0f172a", margin: "0 0 8px", fontSize: "18px" }}>
            Select a Patient to Monitor
          </h3>
          <p style={{ color: "#64748b", margin: 0 }}>
            Click on a patient name above to view their real-time vitals
          </p>
        </div>
      )}
    </div>
  );
}

/* ===== STYLES ===== */
const s = {
  wrapper: {
    padding: "28px 32px",
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "'Inter', sans-serif"
  },
  alertPopup: {
    position: "fixed",
    top: "20px",
    right: "20px",
    width: "320px",
    background: "linear-gradient(135deg, #b91c1c, #dc2626)",
    color: "white",
    padding: "20px",
    borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(220,38,38,0.4)",
    zIndex: 9999,
    animation: "slideIn 0.3s ease"
  },
  alertPopupHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "700",
    fontSize: "16px",
    marginBottom: "10px"
  },
  alertPopupMsg: {
    margin: "0 0 14px",
    fontSize: "14px",
    opacity: 0.9
  },
  alertCloseBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.2)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.3)",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "'Inter', sans-serif"
  },
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(15,23,42,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999,
    backdropFilter: "blur(4px)"
  },
  modalBox: {
    background: "white",
    padding: "28px",
    width: "480px",
    borderRadius: "20px",
    boxShadow: "0 24px 48px rgba(15,23,42,0.2)",
    position: "relative",
    zIndex: 100000
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0
  },
  modalClose: {
    background: "#f1f5f9",
    border: "none",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#64748b",
    fontSize: "14px"
  },
  msgBox: {
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "16px",
    fontSize: "14px",
    fontWeight: "600"
  },
  modalForm: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px"
  },
  mFormGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  mLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151"
  },
  mInputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  mInputIcon: {
    position: "absolute",
    left: "12px",
    color: "#94a3b8",
    fontSize: "13px"
  },
  mInput: {
    width: "100%",
    padding: "10px 12px 10px 36px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    color: "#0f172a",
    background: "#f8fafc",
    outline: "none",
    boxSizing: "border-box"
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #f1f5f9"
  },
  mCancelBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif"
  },
  mSaveBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px",
    background: "linear-gradient(135deg, #1e40af, #2563eb)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif"
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  headerIcon: {
    width: "52px",
    height: "52px",
    background: "linear-gradient(135deg, #dc2626, #ef4444)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    color: "white",
    boxShadow: "0 4px 12px rgba(220,38,38,0.3)"
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "2px 0 0"
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #1e40af, #2563eb)",
    color: "white",
    border: "none",
    padding: "12px 22px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
  },
  selectorCard: {
    background: "white",
    padding: "20px 24px",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
    marginBottom: "24px",
    border: "1px solid #e2e8f0"
  },
  selectorHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px"
  },
  selectorTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0
  },
  patientBtns: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },
  patientBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    borderRadius: "10px",
    border: "2px solid",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s",
    fontFamily: "'Inter', sans-serif"
  },
  monitorGrid: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: "20px",
    marginBottom: "24px"
  },
  infoCard: {
    background: "white",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0"
  },
  infoTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px"
  },
  infoAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "700",
    color: "white",
    flexShrink: 0
  },
  infoName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 2px"
  },
  infoMeta: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0
  },
  scoreContainer: {
    textAlign: "center",
    marginBottom: "16px"
  },
  scoreNumber: {
    fontSize: "42px",
    fontWeight: "800",
    lineHeight: 1,
    marginBottom: "4px"
  },
  scoreLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "12px"
  },
  scoreBar: {
    height: "8px",
    background: "#f1f5f9",
    borderRadius: "10px",
    overflow: "hidden"
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: "10px",
    transition: "width 0.5s ease"
  },
  updatedTime: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#94a3b8",
    justifyContent: "center"
  },
  noVitals: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "20px 0",
    fontSize: "14px"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px"
  },
  statCard: {
    borderRadius: "14px",
    padding: "20px",
    textAlign: "center",
    border: "1px solid",
    transition: "transform 0.2s"
  },
  statIconWrap: {
    width: "44px",
    height: "44px",
    background: "rgba(255,255,255,0.8)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px"
  },
  statValue: {
    fontSize: "32px",
    fontWeight: "800",
    lineHeight: 1,
    marginBottom: "2px"
  },
  statUnit: {
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "6px"
  },
  statLabel: {
    fontSize: "13px",
    color: "#475569",
    fontWeight: "600",
    marginBottom: "10px"
  },
  statStatus: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600"
  },
  graphCard: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0"
  },
  graphHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px"
  },
  graphTitle: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  graphIcon: {
    width: "44px",
    height: "44px",
    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    color: "#2563eb"
  },
  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#dcfce7",
    color: "#16a34a",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700"
  },
  liveDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#16a34a",
    display: "inline-block",
    animation: "pulse 1s infinite"
  },
  noVitalsCard: {
    background: "white",
    padding: "48px",
    borderRadius: "16px",
    textAlign: "center",
    border: "1px solid #e2e8f0"
  },
  noVitalsIcon: {
    width: "64px",
    height: "64px",
    background: "linear-gradient(135deg, #fee2e2, #fecaca)",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    color: "#dc2626",
    margin: "0 auto 16px"
  },
  emptyState: {
    background: "white",
    padding: "64px",
    borderRadius: "16px",
    textAlign: "center",
    border: "1px solid #e2e8f0"
  },
  emptyIcon: {
    width: "72px",
    height: "72px",
    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    color: "#2563eb",
    margin: "0 auto 20px"
  }
};