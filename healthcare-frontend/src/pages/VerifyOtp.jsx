import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaHospital, FaShieldAlt, FaArrowLeft,
  FaCheckCircle, FaUserMd, FaCalendarCheck, FaHeartbeat, FaPills, FaBell, FaChartLine
} from "react-icons/fa";
import "../Login.css";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get("email") || "";

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [email, navigate]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit verification code sent to your email");
      return;
    }
    if (timeLeft === 0) {
      setError("Verification code has expired. Please request a new code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:8080/auth/verify-otp", { email, otp });
      if (res.status === 200) {
        navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    try {
      await axios.post("http://localhost:8080/auth/forgot-password", { email });
      setTimeLeft(300);
      alert("A new recovery OTP code has been sent to your email.");
    } catch (err) {
      setError("Failed to resend code. Try again later.");
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
            <div className="header-icon" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
              <FaShieldAlt />
            </div>
            <h2>Verify Code</h2>
            <p>We sent a 6-digit verification code to <strong>{email}</strong></p>
          </div>

          {error && (
            <div className="login-error">
              <FaShieldAlt />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleVerify}>
            <div className="form-group" style={{ textAlign: "center" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
                Enter 6-Digit OTP Code
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  style={{
                    letterSpacing: "8px",
                    fontWeight: "800",
                    fontSize: "22px",
                    textAlign: "center",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "2px solid #3b82f6",
                    background: "#eff6ff",
                    color: "#1e3a8a"
                  }}
                  disabled={loading}
                />
              </div>
              <div style={{ marginTop: "10px", fontSize: "13px", color: timeLeft > 60 ? "#64748b" : "#dc2626", fontWeight: "600" }}>
                ⏱️ Code expires in: {formatTime(timeLeft)}
              </div>
            </div>

            <button
              className="login-btn"
              type="submit"
              disabled={loading || timeLeft === 0}
              style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Verifying Code...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Verify Code
                </>
              )}
            </button>

            <div style={{ textAlign: "center", marginTop: "8px" }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                style={{
                  background: "none", border: "none", color: "#35663f",
                  fontWeight: "600", cursor: "pointer", fontSize: "13px"
                }}
              >
                Didn't receive the code? Resend OTP
              </button>
            </div>

            <Link
              to="/forgot-password"
              style={{
                width: "100%",
                marginTop: "12px",
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
              <FaArrowLeft /> Change Email Address
            </Link>
          </form>

          <div className="login-footer">
            <p>
              Remember your password?{" "}
              <Link to="/login">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
