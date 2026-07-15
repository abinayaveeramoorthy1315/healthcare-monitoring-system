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
    if (!patientId || !doctorId) {
      setStatus("error");
      setMessage("Missing patient or doctor info.");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const token = localStorage.getItem("token"); // plain token, no JSON.stringify

      const params = new URLSearchParams({
        patientId: patientId,
        doctorId: doctorId,
        message: message,
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
    gap: "8px",
  },
  button: {
    backgroundColor: "#dc2626",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "16px",
    padding: "14px 28px",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)",
  },
  successText: {
    color: "#16a34a",
    fontWeight: 500,
  },
  errorText: {
    color: "#dc2626",
    fontWeight: 500,
  },
};
