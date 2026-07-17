import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaHospital, FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaCheckCircle,
  FaTimesCircle, FaKey, FaUserMd, FaCalendarCheck, FaHeartbeat, FaPills, FaBell, FaChartLine
} from "react-icons/fa";
import "../Login.css";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const email = query.get("email") || "";
  const otp = query.get("otp") || "";

  useEffect(() => {
    if (!email || !otp) {
      navigate("/forgot-password");
    }
  }, [email, otp, navigate]);

  // Password validation rules
  const rules = {
    length: newPassword.length >= 8 && newPassword.length <= 20,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    digit: /\d/.test(newPassword),
    special: /[@#$!%*?&]/.test(newPassword),
  };
  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Please ensure your new password satisfies all security requirements listed below.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter carefully.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await axios.post("http://localhost:8080/auth/reset-password", {
        email,
        otp,
        newPassword,
        confirmPassword
      });
      setSuccessMsg(res.data.message || "Password reset successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password. Code may have expired.");
    } finally {
      setLoading(false);
    }
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
          <span>HIPAA Compliant & Secure Recovery</span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <div className="header-icon" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <FaLock />
            </div>
            <h2>Create New Password</h2>
            <p>Set a secure password for account: <strong>{email}</strong></p>
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

          <form className="login-form" onSubmit={handleReset}>
            <div className="form-group">
              <label>New Secure Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading || !!successMsg}
                />
                <button
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
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
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || !!successMsg}
                />
                <button
                  className="eye-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  type="button"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              className="login-btn"
              type="submit"
              disabled={loading || !!successMsg || !isPasswordValid || newPassword !== confirmPassword}
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Updating Password...
                </>
              ) : (
                <>
                  <FaShieldAlt />
                  Save & Reset Password
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Remember your old password?{" "}
              <Link to="/login">Cancel & Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
