import { useEffect, useState } from "react";
import api from "../api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { FaHeartbeat, FaLungs, FaThermometerHalf,
         FaTint, FaUserInjured } from "react-icons/fa";
import "./VitalSigns.css";

export default function VitalSigns() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [latestVital, setLatestVital] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [alert, setAlert] = useState(null);
  const [shownAlertIds, setShownAlertIds] = useState(new Set());

  const [formData, setFormData] = useState({
    patientId: "",
    heartRate: "",
    bloodPressure: "",
    temperature: "",
    oxygenLevel: ""
  });

  const role = localStorage.getItem("role");

  useEffect(() => {
    loadPatients();
  }, []);

  // ✅ Patient select பண்ணும்போது vitals load
  useEffect(() => {
    if (selectedPatient) {
      loadPatientVitals(selectedPatient.patientId);
      const interval = setInterval(() => {
        loadPatientVitals(selectedPatient.patientId);
      }, 5000); // 5 sec refresh
      return () => clearInterval(interval);
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    try {
      const res = await api.get("/api/patients");
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPatientVitals = async (patientId) => {
    try {
      const res = await api.get(`/api/vitalsigns/patient/${patientId}`);
      const data = res.data;

      // ✅ Latest vital
      if (data.length > 0) {
        const latest = data[data.length - 1];
        setLatestVital(latest);

        // ✅ Critical alert
        if (latest.riskLevel === "CRITICAL") {
          setShownAlertIds(prev => {
            if (!prev.has(latest.vitalId)) {
              setAlert(latest);
              return new Set([...prev, latest.vitalId]);
            }
            return prev;
          });
        }
      }

      // ✅ Graph data - last 10 records
      const graphData = data.slice(-10).map((v, i) => ({
        time: v.recordedAt
          ? new Date(v.recordedAt).toLocaleTimeString()
          : `Record ${i + 1}`,
        heartRate: v.heartRate,
        oxygenLevel: v.oxygenLevel,
        temperature: v.temperature
      }));
      setVitalsHistory(graphData);

    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!formData.patientId || !formData.heartRate ||
        !formData.oxygenLevel || !formData.temperature) {
      setMessage("❌ எல்லா fields-யும் fill பண்ணுங்க!");
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

      setMessage("✅ Vitals Added Successfully!");
      setFormData({
        patientId: "",
        heartRate: "",
        bloodPressure: "",
        temperature: "",
        oxygenLevel: ""
      });
      setShowModal(false);

      // ✅ Selected patient-ஓட vitals reload
      if (selectedPatient) {
        loadPatientVitals(selectedPatient.patientId);
      }

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to add vitals!");
      console.error(err);
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

  const getRiskColor = (level) => {
    if (level === "CRITICAL") return "#ef4444";
    if (level === "HIGH") return "#f59e0b";
    return "#22c55e";
  };

  return (
    <div className="vitals-dashboard">

      {/* 🔴 Alert Popup */}
      {alert && (
        <div className="alert-popup">
          🚨 EMERGENCY ALERT 🚨
          <p>{alert.patient?.name} is in CRITICAL condition!</p>
          <button onClick={() => setAlert(null)}>✕ Close</button>
        </div>
      )}

      {/* ✅ Add Vitals Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setMessage("");
            }
          }}
        >
          <div style={{
            background: "white",
            padding: "28px",
            width: "420px",
            borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            position: "relative",
            zIndex: 100000
          }}>
            <h3 style={{ margin: "0 0 20px", color: "#0f172a" }}>
              ➕ Add Patient Vitals
            </h3>

            {message && (
              <div style={{
                padding: "10px",
                marginBottom: "14px",
                background: message.includes("✅") ? "#d4edda" : "#f8d7da",
                color: message.includes("✅") ? "#155724" : "#721c24",
                borderRadius: "8px",
                fontSize: "14px"
              }}>
                {message}
              </div>
            )}

            <select
              value={formData.patientId}
              onChange={(e) => setFormData({
                ...formData, patientId: e.target.value
              })}
              style={inputStyle}
            >
              <option value="">-- Select Patient --</option>
              {patients.map(p => (
                <option key={p.patientId} value={p.patientId}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Heart Rate (bpm)"
              value={formData.heartRate}
              onChange={(e) => setFormData({
                ...formData, heartRate: e.target.value
              })}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Blood Pressure (e.g. 120/80)"
              value={formData.bloodPressure}
              onChange={(e) => setFormData({
                ...formData, bloodPressure: e.target.value
              })}
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Temperature (°C)"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData({
                ...formData, temperature: e.target.value
              })}
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Oxygen Level (%)"
              value={formData.oxygenLevel}
              onChange={(e) => setFormData({
                ...formData, oxygenLevel: e.target.value
              })}
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button
                onClick={() => { setShowModal(false); setMessage(""); }}
                style={cancelBtnStyle}
              >
                Cancel
              </button>
              <button onClick={handleSave} style={saveBtnStyle}>
                💾 Save Vitals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <h2>🫀 Real-time Patient Monitor</h2>
        {(role === "ADMIN" || role === "DOCTOR") && (
          <button
            className="add-vital-btn"
            onClick={() => { setShowModal(true); setMessage(""); }}
          >
            + Add Vitals
          </button>
        )}
      </div>

      {/* Success Message */}
      {message && !showModal && (
        <div style={{
          padding: "12px",
          marginBottom: "16px",
          background: "#d4edda",
          color: "#155724",
          borderRadius: "8px",
          fontWeight: "600"
        }}>
          {message}
        </div>
      )}

      {/* ✅ Patient Selector */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        marginBottom: "24px"
      }}>
        <h3 style={{ margin: "0 0 14px", color: "#0f172a" }}>
          👤 Select Patient to Monitor
        </h3>
        <div style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          {patients.map(p => (
            <button
              key={p.patientId}
              onClick={() => {
                setSelectedPatient(p);
                setLatestVital(null);
                setVitalsHistory([]);
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: "2px solid",
                borderColor: selectedPatient?.patientId === p.patientId
                  ? "#2563eb" : "#e2e8f0",
                background: selectedPatient?.patientId === p.patientId
                  ? "#2563eb" : "white",
                color: selectedPatient?.patientId === p.patientId
                  ? "white" : "#374151",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.2s"
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ Selected Patient Monitor */}
      {selectedPatient && (
        <>
          {/* Patient Info + Latest Vitals */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "20px",
            marginBottom: "24px"
          }}>

            {/* Patient Info Card */}
            <div style={{
              background: "white",
              padding: "20px",
              borderRadius: "14px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              borderLeft: `6px solid ${getRiskColor(latestVital?.riskLevel)}`
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px"
              }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "20px",
                  fontWeight: "700"
                }}>
                  {selectedPatient.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: "#0f172a" }}>
                    {selectedPatient.name}
                  </h3>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                    {selectedPatient.age} yrs • {selectedPatient.gender}
                  </p>
                </div>
              </div>

              {latestVital ? (
                <>
                  <div style={{
                    background: getRiskColor(latestVital.riskLevel) + "20",
                    padding: "10px",
                    borderRadius: "8px",
                    textAlign: "center",
                    marginBottom: "16px"
                  }}>
                    <span style={{
                      color: getRiskColor(latestVital.riskLevel),
                      fontWeight: "700",
                      fontSize: "16px"
                    }}>
                      {latestVital.riskLevel === "CRITICAL" ? "🔴" :
                       latestVital.riskLevel === "HIGH" ? "🟡" : "🟢"}
                      {" "}{latestVital.riskLevel}
                    </span>
                  </div>

                  {/* Health Score */}
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <div style={{
                      fontSize: "36px",
                      fontWeight: "700",
                      color: calculateHealthScore(latestVital) > 80
                        ? "#22c55e"
                        : calculateHealthScore(latestVital) > 50
                        ? "#f59e0b" : "#ef4444"
                    }}>
                      {calculateHealthScore(latestVital)}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "13px" }}>
                      Health Score / 100
                    </div>
                  </div>

                  <div style={{ fontSize: "13px", color: "#64748b" }}>
                    🕐 Updated: {latestVital.recordedAt
                      ? new Date(latestVital.recordedAt).toLocaleString()
                      : "N/A"}
                  </div>
                </>
              ) : (
                <div style={{
                  textAlign: "center",
                  color: "#94a3b8",
                  padding: "20px 0"
                }}>
                  No vitals recorded yet
                </div>
              )}
            </div>

            {/* Latest Vitals Stats */}
            {latestVital && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px"
              }}>

                {/* Heart Rate */}
                <div style={statCardStyle("#fff1f2", "#ef4444")}>
                  <div style={{ fontSize: "28px" }}>❤️</div>
                  <div style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#ef4444"
                  }}>
                    {latestVital.heartRate}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "13px" }}>
                    Heart Rate (bpm)
                  </div>
                  <div style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: latestVital.heartRate > 100
                      ? "#ef4444" : "#22c55e"
                  }}>
                    {latestVital.heartRate > 120 ? "⚠️ Critical" :
                     latestVital.heartRate > 100 ? "⚠️ High" : "✅ Normal"}
                  </div>
                </div>

                {/* Oxygen */}
                <div style={statCardStyle("#f0fdf4", "#22c55e")}>
                  <div style={{ fontSize: "28px" }}>🫁</div>
                  <div style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#22c55e"
                  }}>
                    {latestVital.oxygenLevel}%
                  </div>
                  <div style={{ color: "#64748b", fontSize: "13px" }}>
                    Oxygen Level
                  </div>
                  <div style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: latestVital.oxygenLevel < 90
                      ? "#ef4444" : "#22c55e"
                  }}>
                    {latestVital.oxygenLevel < 90 ? "⚠️ Critical" :
                     latestVital.oxygenLevel < 95 ? "⚠️ Low" : "✅ Normal"}
                  </div>
                </div>

                {/* Temperature */}
                <div style={statCardStyle("#fffbeb", "#f59e0b")}>
                  <div style={{ fontSize: "28px" }}>🌡️</div>
                  <div style={{
                    fontSize: "32px",
                    fontWeight: "700",
                    color: "#f59e0b"
                  }}>
                    {latestVital.temperature}°C
                  </div>
                  <div style={{ color: "#64748b", fontSize: "13px" }}>
                    Temperature
                  </div>
                  <div style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: latestVital.temperature > 39
                      ? "#ef4444" : "#22c55e"
                  }}>
                    {latestVital.temperature > 39 ? "⚠️ Fever" :
                     latestVital.temperature > 37.5 ? "⚠️ High" : "✅ Normal"}
                  </div>
                </div>

                {/* Blood Pressure */}
                <div style={statCardStyle("#eff6ff", "#2563eb")}>
                  <div style={{ fontSize: "28px" }}>💉</div>
                  <div style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#2563eb"
                  }}>
                    {latestVital.bloodPressure}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "13px" }}>
                    Blood Pressure
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ✅ Real-time Graph */}
          {vitalsHistory.length > 0 && (
            <div style={{
              background: "white",
              padding: "24px",
              borderRadius: "14px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
            }}>
              <h3 style={{ margin: "0 0 20px", color: "#0f172a" }}>
                📊 {selectedPatient.name} - Vitals History
                <span style={{
                  fontSize: "13px",
                  color: "#64748b",
                  marginLeft: "12px",
                  fontWeight: "400"
                }}>
                  (Last {vitalsHistory.length} records • Auto refresh 5s)
                </span>
              </h3>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={vitalsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Heart Rate"
                  />
                  <Line
                    type="monotone"
                    dataKey="oxygenLevel"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Oxygen Level"
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Temperature"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* No vitals yet */}
          {vitalsHistory.length === 0 && (
            <div style={{
              background: "white",
              padding: "40px",
              borderRadius: "14px",
              textAlign: "center",
              color: "#94a3b8"
            }}>
              <p style={{ fontSize: "18px" }}>
                {selectedPatient.name}-has no vitals recorded yet.
              </p>
              <p>+ Add Vitals button click </p>
            </div>
          )}
        </>
      )}

      {/* No patient selected */}
      {!selectedPatient && (
        <div style={{
          background: "white",
          padding: "60px",
          borderRadius: "14px",
          textAlign: "center",
          color: "#94a3b8",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>👆</div>
          <p style={{ fontSize: "18px", fontWeight: "600" }}>
             click patient name to view vitals
          </p>
          <p>Real-time monitoring!</p>
        </div>
      )}

    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  marginBottom: "12px",
  border: "1.5px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box"
};

const saveBtnStyle = {
  flex: 1,
  padding: "11px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600"
};

const cancelBtnStyle = {
  flex: 1,
  padding: "11px",
  background: "#f1f5f9",
  color: "#475569",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600"
};

const statCardStyle = (bg, color) => ({
  background: bg,
  padding: "16px",
  borderRadius: "12px",
  textAlign: "center",
  border: `1px solid ${color}20`
});