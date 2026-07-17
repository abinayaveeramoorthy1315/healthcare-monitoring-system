import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaHospital, FaEnvelope, FaShieldAlt, FaArrowLeft,
  FaKey, FaUserMd, FaCalendarCheck, FaHeartbeat, FaPills, FaBell, FaChartLine
} from "react-icons/fa";
import "../Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      setError("Please enter a valid registered email address");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await axios.post("http://localhost:8080/auth/forgot-password", { email });
      setSuccessMsg(res.data.message || "Recovery OTP sent to your email!");
      setTimeout(() => {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send recovery OTP. Check your email.");
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
            <div className="header-icon" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <FaKey />
            </div>
            <h2>Forgot Password?</h2>
            <p>Enter your registered email to receive a secure recovery OTP</p>
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
              padding: "12px 16px", borderRadius: "12px", marginBottom: "18px",
              background: "#dcfce7", color: "#16a34a", fontWeight: "600", fontSize: "14px",
              border: "1px solid #bbf7d0"
            }}>
              <span>✅ {successMsg}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Registered Email Address</label>
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              className="login-btn"
              type="submit"
              disabled={loading}
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Sending Recovery Code...
                </>
              ) : (
                <>
                  <FaKey />
                  Send Recovery Code
                </>
              )}
            </button>

            <Link
              to="/login"
              style={{
                width: "100%",
                marginTop: "6px",
                padding: "12px",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                color: "#475569",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontFamily: "'Inter', sans-serif"
              }}
            >
              <FaArrowLeft /> Back to Login
            </Link>
          </form>

          <div className="login-footer">
            <p>
              Need assistance?{" "}
              <Link to="/register">Contact Hospital Support</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
