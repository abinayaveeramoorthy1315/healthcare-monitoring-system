import { useEffect, useState } from "react";
import api from "../api";
import { FaBell, FaCheckDouble, FaClock, FaCircle } from "react-icons/fa";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem("username");

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get(`/api/notifications/${username}`);
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put(`/api/notifications/read-all/${username}`);
      loadNotifications();
    } catch (err) { console.error(err); }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/api/notifications/read/${id}`);
      loadNotifications();
    } catch (err) { console.error(err); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={styles.wrapper}>

      {/* ===== HEADER ===== */}
      <div style={styles.pageHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaBell />
            {unreadCount > 0 && (
              <span style={styles.headerBadge}>{unreadCount}</span>
            )}
          </div>
          <div>
            <h1 style={styles.pageTitle}>Notifications</h1>
            <p style={styles.pageSubtitle}>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button style={styles.markAllBtn} onClick={markAllRead}>
            <FaCheckDouble /> Mark All Read
          </button>
        )}
      </div>

      {/* ===== LIST ===== */}
      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}><FaBell /></div>
          <h3>No Notifications Yet</h3>
          <p>You're all caught up! Check back later.</p>
        </div>
      ) : (
        <div style={styles.notifList}>
          {notifications.map(n => (
            <div
              key={n.notificationId}
              onClick={() => !n.read && markRead(n.notificationId)}
              style={{
                ...styles.notifCard,
                background: n.read ? "white" : "#edf7ed",
                borderColor: n.read ? "rgba(82,139,94,0.2)" : "#82c08e",
                cursor: n.read ? "default" : "pointer"
              }}
            >
              <div style={{
                ...styles.notifIconWrap,
                background: n.read ? "#f8fafc" : "#dcfce7"
              }}>
                <FaBell style={{
                  color: n.read ? "#82c08e" : "#35663f",
                  fontSize: "14px"
                }} />
              </div>

              <div style={styles.notifContent}>
                <p style={{
                  ...styles.notifMessage,
                  fontWeight: n.read ? "500" : "700",
                  color: n.read ? "#5c7564" : "#1a3323"
                }}>
                  {n.message}
                </p>
                <div style={styles.notifTime}>
                  <FaClock style={{ fontSize: "10px" }} />
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>

              {!n.read && (
                <FaCircle style={styles.unreadDot} />
              )}
            </div>
          ))}
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
    background: "linear-gradient(135deg, #35663f, #528b5e)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    color: "white",
    boxShadow: "0 4px 12px rgba(82,139,94,0.3)",
    position: "relative"
  },
  headerBadge: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    background: "#dc2626",
    color: "white",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 6px",
    borderRadius: "10px",
    minWidth: "20px",
    textAlign: "center",
    border: "2px solid #edf7ed"
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
  markAllBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #35663f, #528b5e)",
    color: "white",
    border: "none",
    padding: "12px 22px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
    boxShadow: "0 4px 12px rgba(82,139,94,0.3)"
  },
  notifList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  notifCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    background: "white",
    border: "1.5px solid rgba(82,139,94,0.2)",
    borderRadius: "14px",
    padding: "16px 20px",
    transition: "all 0.2s"
  },
  notifIconWrap: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  notifContent: {
    flex: 1
  },
  notifMessage: {
    fontSize: "14px",
    margin: "0 0 4px",
    lineHeight: 1.4
  },
  notifTime: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#82c08e"
  },
  unreadDot: {
    fontSize: "8px",
    color: "#35663f",
    flexShrink: 0
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

export default Notifications;