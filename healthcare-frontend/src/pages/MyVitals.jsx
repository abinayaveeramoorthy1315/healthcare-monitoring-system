import { useEffect, useState } from "react";
import api from "../api";

function MyVitals() {
  const [vitals, setVitals] = useState([]);
  const username = localStorage.getItem("username");

  useEffect(() => {
    loadVitals();
  }, []);

  const loadVitals = async () => {
    try {
      const patientsRes = await api.get("/api/patients");
      const patient = patientsRes.data.find(p =>
        p.name?.toLowerCase().replace(/\s+/g, "").trim() ===
        username?.toLowerCase().replace(/\s+/g, "").trim()
      );

      if (patient) {
        const res = await api.get(
          `/api/vitalsigns/patient/${patient.patientId}`
        );
        setVitals(res.data.reverse());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (vital) => {
    if (vital.heartRate > 120 || vital.oxygenLevel < 90 || vital.temperature > 39) {
      return "#dc3545";
    }
    if (vital.heartRate > 100 || vital.oxygenLevel < 95 || vital.temperature > 37.5) {
      return "#ffc107";
    }
    return "#28a745";
  };

  return (
    <div>
      <h2>💓 My Vitals History</h2>

      <div style={{ display: "grid", gap: "16px", marginTop: "20px" }}>
        {vitals.length === 0 ? (
          <div style={{
            background: "white",
            padding: "40px",
            borderRadius: "12px",
            textAlign: "center",
            color: "#999"
          }}>
            No Vitals Recorded Yet
          </div>
        ) : (
          vitals.map((v, i) => (
            <div
              key={v.vitalId || i}
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                borderLeft: `5px solid ${getStatusColor(v)}`
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px"
              }}>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>HEART RATE</p>
                    <p style={{ margin: "4px 0", fontSize: "20px", fontWeight: "700", color: "#dc3545" }}>
                      {v.heartRate} bpm
                    </p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>OXYGEN</p>
                    <p style={{ margin: "4px 0", fontSize: "20px", fontWeight: "700", color: "#28a745" }}>
                      {v.oxygenLevel}%
                    </p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>TEMPERATURE</p>
                    <p style={{ margin: "4px 0", fontSize: "20px", fontWeight: "700", color: "#ffc107" }}>
                      {v.temperature}°C
                    </p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>BLOOD PRESSURE</p>
                    <p style={{ margin: "4px 0", fontSize: "20px", fontWeight: "700", color: "#1a3c5e" }}>
                      {v.bloodPressure || "-"}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{
                    background: getStatusColor(v) + "20",
                    color: getStatusColor(v),
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "700"
                  }}>
                    {v.riskLevel || "NORMAL"}
                  </span>
                  <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#888" }}>
                    🕐 {v.recordedAt
                      ? new Date(v.recordedAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyVitals;