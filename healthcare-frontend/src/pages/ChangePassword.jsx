import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaHospital, FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaCheckCircle,
  FaTimesCircle, FaKey, FaUserMd, FaCalendarCheck, FaHeartbeat, FaPills, FaBell, FaChartLine
} from "react-icons/fa";
import "../Login.css";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();
  const username = localStorage.getItem("username") || localStorage.getItem("userEmail") || "";
  const role = localStorage.getItem("role") || "";
  const isForcedFirstLogin = localStorage.getItem("passwordChanged") === "false";

  useEffect(() => {
    if (!username && !localStorage.getItem("token")) {
      navigate("/login");
    }
  }, [username, navigate]);

  const rules = {
    length: newPassword.length >= 8 && newPassword.length <= 20,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    digit: /\d/.test(newPassword),
    special: /[@#$!%*?&]/.test(newPassword),
  };
  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setError("Please enter your current password");
      return;
    }
    if (!isPasswordValid) {
      setError("Please ensure your new password satisfies all security requirements listed below.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("New password cannot be identical to your current password.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await axios.post("http://localhost:8080/auth/change-password", {
        username: username,
        currentPassword: currentPassword,
        newPassword: newPassword
      });
      localStorage.setItem("passwordChanged", "true");
      setSuccessMsg(res.data.message || "Password updated successfully!");
      setTimeout(() => {
        if (role === "ADMIN") navigate("/admin-dashboard");
        else if (role === "DOCTOR") navigate("/doctor-dashboard");
        else navigate("/patient-dashboard");
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update password. Verify your current password.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isForcedFirstLogin) {
      alert("You must change your temporary password on your first login before accessing the system.");
      return;
    }
    if (role === "ADMIN") navigate("/admin-dashboard");
    else if (role === "DOCTOR") navigate("/doctor-dashboard");
    else if (role === "PATIENT") navigate("/patient-dashboard");
    else navigate("/login");
  };

  const features = [
    { icon: <FaUserMd />, text: "Patient Records Management" },
    { icon: <FaCalendarCheck />, text: "Appointment Scheduling" },
    { icon: <FaHeartbeat />, text: "Vital Signs Monitoring" },
    { icon: <FaPills />, text: "Prescription Management" },
    { icon: <FaBell />, text: "Emergency Alert Tracking" },
    { icon: <FaChartLine />, text: "Health Analytics" },
  ];

  return (
    <div className="login-container">
      {/* LEFT PANEL */}
      <div className="login-left">
        <div className="bg-circle bg-circle-1" />
        <div className="bg-circle bg-circle-2" />
        <div className="bg-circle bg-circle-3" />

        <div className="login-brand">
          <div className="brand-icon">
            <FaHospital />
          </div>
          <h1>HealthCare Pro</h1>
          <p>Smart Healthcare Monitoring Platform</p>
        </div>

        <div className="login-features">
          {features.map((f, i) => (
            <div className="feature-item" key={i}>
              <span className="feature-icon">{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        <div className="login-badge">
          <FaShieldAlt />
          <span>HIPAA Compliant Security Enforcement</span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <div className="header-icon" style={{ background: isForcedFirstLogin ? "linear-gradient(135deg, #ef4444, #b91c1c)" : "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
              <FaKey />
            </div>
            <h2>{isForcedFirstLogin ? "Mandatory Security Update" : "Change Password"}</h2>
            <p>
              {isForcedFirstLogin
                ? "You must update your temporary password before continuing to your portal."
                : `Update credentials for user account: ${username}`}
            </p>
          </div>

          {error && (
            <div className="login-error">
              <FaShieldAlt />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "14px 16px", borderRadius: "12px", marginBottom: "18px",
              background: "#dcfce7", color: "#16a34a", fontWeight: "700", fontSize: "14px",
              border: "1px solid #bbf7d0"
            }}>
              <span>✅ {successMsg}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Current / Temporary Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current or temporary password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading || !!successMsg}
                />
                <button
                  className="eye-btn"
                  onClick={() => setShowCurrent(!showCurrent)}
                  type="button"
                >
                  {showCurrent ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>New Secure Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading || !!successMsg}
                />
                <button
                  className="eye-btn"
                  onClick={() => setShowNew(!showNew)}
                  type="button"
                >
                  {showNew ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Password Rules Checklist */}
            <div style={{
              background: "#f8fafc", padding: "12px 14px", borderRadius: "10px",
              border: "1px solid #e2e8f0", fontSize: "12px", display: "grid",
              gridTemplateColumns: "1fr 1fr", gap: "6px"
            }}>
              <span style={{ color: rules.length ? "#16a34a" : "#64748b", display: "flex", alignItems: "center", gap: "6px", fontWeight: rules.length ? "700" : "500" }}>
                {rules.length ? <FaCheckCircle /> : <FaTimesCircle style={{ color: "#cbd5e1" }} />} 8–20 Characters
              </span>
              <span style={{ color: rules.upper ? "#16a34a" : "#64748b", display: "flex", alignItems: "center", gap: "6px", fontWeight: rules.upper ? "700" : "500" }}>
                {rules.upper ? <FaCheckCircle /> : <FaTimesCircle style={{ color: "#cbd5e1" }} />} Uppercase letter
              </span>
              <span style={{ color: rules.lower ? "#16a34a" : "#64748b", display: "flex", alignItems: "center", gap: "6px", fontWeight: rules.lower ? "700" : "500" }}>
                {rules.lower ? <FaCheckCircle /> : <FaTimesCircle style={{ color: "#cbd5e1" }} />} Lowercase letter
              </span>
              <span style={{ color: rules.digit ? "#16a34a" : "#64748b", display: "flex", alignItems: "center", gap: "6px", fontWeight: rules.digit ? "700" : "500" }}>
                {rules.digit ? <FaCheckCircle /> : <FaTimesCircle style={{ color: "#cbd5e1" }} />} Number (0-9)
              </span>
              <span style={{ color: rules.special ? "#16a34a" : "#64748b", display: "flex", alignItems: "center", gap: "6px", fontWeight: rules.special ? "700" : "500", gridColumn: "1 / -1" }}>
                {rules.special ? <FaCheckCircle /> : <FaTimesCircle style={{ color: "#cbd5e1" }} />} Special char (@#$!%*?&)
              </span>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || !!successMsg}
                />
                <button
                  className="eye-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                  type="button"
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              className="login-btn"
              type="submit"
              disabled={loading || !!successMsg || !isPasswordValid || newPassword !== confirmPassword || currentPassword === newPassword}
              style={{ background: isForcedFirstLogin ? "linear-gradient(135deg, #ef4444, #b91c1c)" : "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Updating Credentials...
                </>
              ) : (
                <>
                  <FaShieldAlt />
                  {isForcedFirstLogin ? "Activate & Set Secure Password" : "Save New Password"}
                </>
              )}
            </button>

            {!isForcedFirstLogin && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  padding: "12px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  color: "#475569",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                Cancel & Return to Dashboard
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
