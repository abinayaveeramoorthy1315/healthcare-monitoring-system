import React, { useEffect, useState } from "react";
import api from "../api";
import {
  FaBell, FaExclamationTriangle, FaUserInjured,
  FaClock, FaShieldAlt, FaSearch, FaTimes
} from "react-icons/fa";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadAlerts(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      alerts.filter(a =>
        a.patient?.name?.toLowerCase().includes(q) ||
        a.severity?.toLowerCase().includes(q) ||
        a.message?.toLowerCase().includes(q)
      )
    );
  }, [search, alerts]);

  const loadAlerts = async () => {
    try {
      const res = await api.get("/api/alerts");
      setAlerts(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityConfig = (severity) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return {
          bg: "#fee2e2", color: "#dc2626",
          badgeBg: "linear-gradient(135deg, #b91c1c, #dc2626)",
          label: "Critical", border: "#fecaca"
        };
      case "HIGH":
        return {
          bg: "#fef3c7", color: "#b45309",
          badgeBg: "linear-gradient(135deg, #d97706, #f59e0b)",
          label: "High", border: "#fde68a"
        };
      default:
        return {
          bg: "#f0fdf4", color: "#15803d",
          badgeBg: "linear-gradient(135deg, #15803d, #16a34a)",
          label: severity || "Normal", border: "#bbf7d0"
        };
    }
  };

  const criticalCount = alerts.filter(a => a.severity === "CRITICAL").length;
  const highCount = alerts.filter(a => a.severity === "HIGH").length;

  return (
    <div style={styles.wrapper}>

      {/* ===== HEADER ===== */}
      <div style={styles.pageHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaBell />
          </div>
          <div>
            <h1 style={styles.pageTitle}>Emergency Alerts</h1>
            <p style={styles.pageSubtitle}>
              {filtered.length} alert{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div style={styles.summaryGrid}>
        <div style={{
          ...styles.summaryCard,
          background: "linear-gradient(135deg, #b91c1c, #dc2626)",
          boxShadow: "0 8px 20px rgba(220,38,38,0.3)"
        }}>
          <FaExclamationTriangle style={styles.summaryIcon} />
          <div>
            <p style={styles.summaryLabel}>Critical Alerts</p>
            <h2 style={styles.summaryCount}>{criticalCount}</h2>
          </div>
        </div>

        <div style={{
          ...styles.summaryCard,
          background: "linear-gradient(135deg, #d97706, #f59e0b)",
          boxShadow: "0 8px 20px rgba(245,158,11,0.3)"
        }}>
          <FaShieldAlt style={styles.summaryIcon} />
          <div>
            <p style={styles.summaryLabel}>High Risk</p>
            <h2 style={styles.summaryCount}>{highCount}</h2>
          </div>
        </div>

        <div style={{
          ...styles.summaryCard,
          background: "linear-gradient(135deg, #1e40af, #2563eb)",
          boxShadow: "0 8px 20px rgba(37,99,235,0.3)"
        }}>
          <FaBell style={styles.summaryIcon} />
          <div>
            <p style={styles.summaryLabel}>Total Alerts</p>
            <h2 style={styles.summaryCount}>{alerts.length}</h2>
          </div>
        </div>
      </div>

      {/* ===== SEARCH ===== */}
      <div style={styles.searchBar}>
        <FaSearch style={styles.searchIcon} />
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search by patient, severity or message..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <FaTimes
            style={styles.clearSearch}
            onClick={() => setSearch("")}
          />
        )}
      </div>

      {/* ===== ALERTS LIST ===== */}
      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p>Loading alerts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}><FaBell /></div>
          <h3>No Alerts Found</h3>
          <p>No emergency alerts at this time</p>
        </div>
      ) : (
        <div style={styles.alertsList}>
          {filtered.map((alert) => {
            const config = getSeverityConfig(alert.severity);
            return (
              <div
                key={alert.alertId}
                style={{
                  ...styles.alertCard,
                  background: config.bg,
                  borderLeft: `5px solid ${config.color}`,
                  border: `1px solid ${config.border}`,
                  borderLeft: `5px solid ${config.color}`
                }}
              >
                <div style={styles.alertTop}>
                  <div style={styles.alertLeft}>
                    <div style={{
                      ...styles.alertIconWrap,
                      background: config.badgeBg
                    }}>
                      <FaExclamationTriangle />
                    </div>
                    <div>
                      <div style={styles.alertPatient}>
                        <FaUserInjured style={{
                          color: config.color, fontSize: "13px"
                        }} />
                        <span style={{
                          fontWeight: "700",
                          color: "#0f172a",
                          fontSize: "15px"
                        }}>
                          {alert.patient?.name || "Unknown Patient"}
                        </span>
                      </div>
                      <p style={styles.alertMessage}>
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <div style={styles.alertRight}>
                    <span style={{
                      ...styles.severityBadge,
                      background: config.badgeBg
                    }}>
                      {config.label}
                    </span>
                    <div style={styles.alertTime}>
                      <FaClock style={{ fontSize: "11px" }} />
                      {alert.createdAt
                        ? new Date(alert.createdAt).toLocaleString()
                        : "N/A"}
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
    background: "#f1f5f9",
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
    background: "linear-gradient(135deg, #b91c1c, #dc2626)",
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
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "24px"
  },
  summaryCard: {
    borderRadius: "16px",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    color: "white"
  },
  summaryIcon: {
    fontSize: "28px",
    opacity: 0.85
  },
  summaryLabel: {
    fontSize: "13px",
    opacity: 0.85,
    margin: "0 0 4px",
    fontWeight: "500"
  },
  summaryCount: {
    fontSize: "32px",
    fontWeight: "800",
    margin: 0,
    lineHeight: 1
  },
  searchBar: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    marginBottom: "20px"
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    color: "#94a3b8",
    fontSize: "15px"
  },
  searchInput: {
    width: "100%",
    padding: "13px 44px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    background: "white",
    outline: "none",
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)"
  },
  clearSearch: {
    position: "absolute",
    right: "16px",
    color: "#94a3b8",
    cursor: "pointer"
  },
  alertsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  alertCard: {
    borderRadius: "14px",
    padding: "20px 24px",
    transition: "transform 0.2s"
  },
  alertTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px"
  },
  alertLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    flex: 1
  },
  alertIconWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    color: "white",
    flexShrink: 0
  },
  alertPatient: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px"
  },
  alertMessage: {
    fontSize: "14px",
    color: "#374151",
    margin: 0,
    lineHeight: 1.5
  },
  alertRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px",
    flexShrink: 0
  },
  severityBadge: {
    color: "white",
    padding: "5px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700"
  },
  alertTime: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#64748b"
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "60px",
    gap: "16px",
    color: "#64748b"
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#dc2626",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  emptyState: {
    background: "white",
    borderRadius: "20px",
    textAlign: "center",
    padding: "60px 24px"
  },
  emptyIcon: {
    width: "72px",
    height: "72px",
    background: "linear-gradient(135deg, #fee2e2, #fecaca)",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    color: "#dc2626",
    margin: "0 auto 20px"
  }
};

export default Alerts;