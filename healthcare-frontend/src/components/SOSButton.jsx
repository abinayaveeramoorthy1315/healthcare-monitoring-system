import React, { useState } from "react";

// Props:
// - patientId: logged-in patient's ID (number)
// - doctorId: assigned doctor's ID (number) — pass this in from wherever
//             you already store the patient's assigned doctor
export default function SOSButton({ patientId, doctorId }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error" | null
  const [message, setMessage] = useState("Emergency! I need help immediately.");

  const handleSOS = async () => {
    if (!patientId) {
      setStatus("error");
      setMessage("Missing patient info.");
      return;
    }

    setLoading(true);
    setStatus(null);

    const sendRequest = async (lat = 18.5204, lng = 73.8567) => {
      try {
        const token = localStorage.getItem("token");

        const params = new URLSearchParams({
          patientId: patientId,
          ...(doctorId ? { doctorId: doctorId } : {}),
          message: message,
          latitude: lat,
          longitude: lng
        });

        const response = await fetch(
          `http://localhost:8080/api/emergency?${params.toString()}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        console.log("Emergency raised:", data);
        setStatus("success");
      } catch (err) {
        console.error("SOS Error:", err);
        setStatus("error");
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendRequest(pos.coords.latitude, pos.coords.longitude),
        () => sendRequest(18.5204, 73.8567),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      sendRequest(18.5204, 73.8567);
    }
  };

  return (
    <div style={styles.container}>
      <button
        onClick={handleSOS}
        disabled={loading}
        style={{
          ...styles.button,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Sending..." : "🚨 SOS Emergency"}
      </button>

      {status === "success" && (
        <p style={styles.successText}>
          ✅ Emergency alert sent to your doctor!
        </p>
      )}
      {status === "error" && (
        <p style={styles.errorText}>
          ❌ Failed to send alert. Please try again or call emergency services.
        </p>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  button: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "linear-gradient(135deg, #b91c1c, #dc2626)",
    color: "#fff",
    fontFamily: "'Outfit', sans-serif",
    fontWeight: "800",
    fontSize: "16px",
    padding: "15px 32px",
    borderRadius: "99px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(220, 38, 38, 0.45)",
    transition: "all .25s ease",
    letterSpacing: ".2px",
  },
  successText: {
    color: "#16a34a",
    fontWeight: 600,
    fontSize: "13.5px",
    background: "#dcfce7",
    padding: "8px 16px",
    borderRadius: "99px",
    border: "1px solid #bbf7d0",
  },
  errorText: {
    color: "#dc2626",
    fontWeight: 600,
    fontSize: "13.5px",
    background: "#fee2e2",
    padding: "8px 16px",
    borderRadius: "99px",
    border: "1px solid #fecaca",
  },
};
