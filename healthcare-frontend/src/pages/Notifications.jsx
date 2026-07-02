import { useEffect, useState } from "react";
import api from "../api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const username = localStorage.getItem("username");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get(`/api/notifications/${username}`);
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put(`/api/notifications/read-all/${username}`);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/api/notifications/read/${id}`);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>🔔 Notifications {unreadCount > 0 && (
          <span style={{
            background: "#dc3545",
            color: "white",
            borderRadius: "50%",
            padding: "2px 8px",
            fontSize: "14px",
            marginLeft: "8px"
          }}>
            {unreadCount}
          </span>
        )}</h2>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              background: "#1a3c5e",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Mark All Read
          </button>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        {notifications.length === 0 ? (
          <p style={{ color: "#999", textAlign: "center", padding: "40px" }}>
            No notifications yet
          </p>
        ) : (
          notifications.map(n => (
            <div
              key={n.notificationId}
              onClick={() => !n.read && markRead(n.notificationId)}
              style={{
                background: n.read ? "#f8f9fa" : "#e8f4fd",
                border: n.read ? "1px solid #dee2e6" : "1px solid #bee5eb",
                borderRadius: "10px",
                padding: "16px",
                marginBottom: "12px",
                cursor: n.read ? "default" : "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: n.read ? "normal" : "600" }}>
                  {n.message}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#888" }}>
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.read && (
                <span style={{
                  background: "#0d6efd",
                  borderRadius: "50%",
                  width: "10px",
                  height: "10px",
                  display: "inline-block"
                }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;