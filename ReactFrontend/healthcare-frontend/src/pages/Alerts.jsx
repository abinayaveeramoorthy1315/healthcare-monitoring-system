import React, { useEffect, useState } from "react";
import api from "../api"; // ✅ axios மாத்தி api

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await api.get("/api/alerts"); // ✅
      setAlerts(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🚨 Emergency Alerts</h2>

      {loading ? (
        <p>Loading...</p>
      ) : alerts.length === 0 ? (
        <p>No Alerts Found</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1a3c5e", color: "white" }}>
              <th style={th}>ID</th>
              <th style={th}>Patient</th>
              <th style={th}>Severity</th>
              <th style={th}>Message</th>
              <th style={th}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.alertId}
                style={{
                  background: alert.severity === "CRITICAL"
                    ? "#ffe0e0" : "white"
                }}>
                <td style={td}>{alert.alertId}</td>
                <td style={td}>{alert.patient?.name}</td>
                <td style={td}>
                  <span style={{
                    background: alert.severity === "CRITICAL"
                      ? "#e74c3c" : "#f39c12",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "12px"
                  }}>
                    {alert.severity}
                  </span>
                </td>
                <td style={td}>{alert.message}</td>
                <td style={td}>
                  {new Date(alert.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th = {
  padding: "12px 16px",
  textAlign: "left",
  border: "1px solid #ddd"
};

const td = {
  padding: "12px 16px",
  border: "1px solid #ddd"
};

export default Alerts;