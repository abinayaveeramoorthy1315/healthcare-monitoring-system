import { useEffect, useState } from "react";
import api from "../api";
import {
  FaHeartbeat, FaLungs, FaThermometerHalf,
  FaTint, FaClock, FaUserInjured
} from "react-icons/fa";
import SOSButton from "../components/SOSButton";

function MyVitals() {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem("username");
  const [patient, setPatient] = useState(null);
  useEffect(() => { loadVitals(); }, []);

  const loadVitals = async () => {
    try {
      const patientsRes = await api.get("/api/patients");
      const patient = patientsRes.data.find(p =>
        p.name?.toLowerCase().replace(/\s+/g, "").trim() ===
        username?.toLowerCase().replace(/\s+/g, "").trim()
      );
      if (patient) {
        const res = await api.get(`/api/vitalsigns/patient/${patient.patientId}`);
        setVitals(res.data.reverse());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskConfig = (vital) => {
    if (!vital) return { color: "#16a34a", bg: "#dcfce7", label: "Normal" };
    if (vital.heartRate > 120 || vital.oxygenLevel < 90 || vital.temperature > 39)
      return { color: "#dc2626", bg: "#fee2e2", label: "Critical" };
    if (vital.heartRate > 100 || vital.oxygenLevel < 95 || vital.temperature > 37.5)
      return { color: "#d97706", bg: "#fef3c7", label: "Elevated" };
    return { color: "#16a34a", bg: "#dcfce7", label: "Normal" };
  };

  return (
    <div style={styles.wrapper}>

      {/* Header */}
      <div style={styles.pageHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaHeartbeat />
          </div>
          <div>
            <h1 style={styles.pageTitle}>My Vitals History</h1>
            <p style={styles.pageSubtitle}>
              {vitals.length} vital record{vitals.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p>Loading vitals...</p>
        </div>
      ) : vitals.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}><FaHeartbeat /></div>
          <h3>No Vitals Recorded Yet</h3>
          <p>Your doctor will record your vitals during visits</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {vitals.map((v, i) => {
            const riskConfig = getRiskConfig(v);
            return (
              <div
                key={v.vitalId || i}
                style={{
                  ...styles.vitalCard,
                  borderLeft: `5px solid ${riskConfig.color}`
                }}
              >
                {/* Top Row */}
                <div style={styles.cardTop}>
                  <div style={styles.cardTopLeft}>
                    <div style={{
                      ...styles.riskBadge,
                      background: riskConfig.bg,
                      color: riskConfig.color
                    }}>
                      {riskConfig.label}
                    </div>
                    <div style={styles.timeStamp}>
                      <FaClock style={{ fontSize: "11px" }} />
                      {v.recordedAt
                        ? new Date(v.recordedAt).toLocaleString()
                        : "N/A"}
                    </div>
                  </div>
                  <span style={styles.recordNum}>Record #{vitals.length - i}</span>
                </div>

                {/* Stats Grid */}
                <div style={styles.statsRow}>

                  <div style={styles.statItem}>
                    <div style={styles.statIcon}>
                      <FaHeartbeat style={{ color: "#ef4444" }} />
                    </div>
                    <div>
                      <p style={styles.statLabel}>Heart Rate</p>
                      <p style={{ ...styles.statValue, color: "#ef4444" }}>
                        {v.heartRate} <span style={styles.statUnit}>bpm</span>
                      </p>
                    </div>
                  </div>

                  <div style={styles.statDivider} />

                  <div style={styles.statItem}>
                    <div style={styles.statIcon}>
                      <FaLungs style={{ color: "#16a34a" }} />
                    </div>
                    <div>
                      <p style={styles.statLabel}>Oxygen Level</p>
                      <p style={{ ...styles.statValue, color: "#16a34a" }}>
                        {v.oxygenLevel} <span style={styles.statUnit}>%</span>
                      </p>
                    </div>
                  </div>

                  <div style={styles.statDivider} />

                  <div style={styles.statItem}>
                    <div style={styles.statIcon}>
                      <FaThermometerHalf style={{ color: "#d97706" }} />
                    </div>
                    <div>
                      <p style={styles.statLabel}>Temperature</p>
                      <p style={{ ...styles.statValue, color: "#d97706" }}>
                        {v.temperature} <span style={styles.statUnit}>°C</span>
                      </p>
                    </div>
                  </div>

                  <div style={styles.statDivider} />

                  <div style={styles.statItem}>
                    <div style={styles.statIcon}>
                      <FaTint style={{ color: "#35663f" }} />
                    </div>
                    <div>
                      <p style={styles.statLabel}>Blood Pressure</p>
                      <p style={{ ...styles.statValue, color: "#35663f" }}>
                        {v.bloodPressure || "-"} <span style={styles.statUnit}>mmHg</span>
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    padding: "28px 32px",
    minHeight: "100vh",
    background: "#edf7ed",
    fontFamily: "'Outfit', sans-serif"
  },
  pageHeader: {
    display: "flex",
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
    background: "linear-gradient(135deg, #35663f, #528b5e)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    color: "white",
    boxShadow: "0 4px 12px rgba(82,139,94,0.3)"
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#1a3323",
    margin: 0
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#5c7564",
    margin: "2px 0 0"
  },
  vitalCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px 24px",
    boxShadow: "0 16px 40px rgba(27,58,38,0.08)",
    border: "1px solid rgba(82,139,94,0.2)"
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  cardTopLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  riskBadge: {
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700"
  },
  timeStamp: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#5c7564"
  },
  recordNum: {
    fontSize: "12px",
    color: "#82c08e",
    fontWeight: "600"
  },
  statsRow: {
    display: "flex",
    alignItems: "center",
    gap: "0",
    background: "#f8fafc",
    borderRadius: "12px",
    overflow: "hidden"
  },
  statItem: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 20px"
  },
  statIcon: {
    width: "36px",
    height: "36px",
    background: "white",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    flexShrink: 0,
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)"
  },
  statDivider: {
    width: "1px",
    height: "50px",
    background: "rgba(82,139,94,0.15)",
    flexShrink: 0
  },
  statLabel: {
    fontSize: "11px",
    color: "#5c7564",
    fontWeight: "600",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    margin: "0 0 3px"
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "700",
    margin: 0
  },
  statUnit: {
    fontSize: "12px",
    fontWeight: "400",
    color: "#82c08e"
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "60px",
    gap: "16px",
    color: "#5c7564"
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid rgba(82,139,94,0.2)",
    borderTopColor: "#528b5e",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  emptyState: {
    background: "white",
    borderRadius: "20px",
    textAlign: "center",
    padding: "60px 24px",
    border: "1px solid rgba(82,139,94,0.2)"
  },
  emptyIcon: {
    width: "72px",
    height: "72px",
    background: "linear-gradient(135deg, #35663f, #528b5e)",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    color: "white",
    margin: "0 auto 20px"
  }
};

export default MyVitals;