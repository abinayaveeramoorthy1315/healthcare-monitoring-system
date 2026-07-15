import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaHospital, FaUser, FaLock, FaEye, FaEyeSlash,
  FaCheckCircle, FaHeartbeat, FaUserMd, FaCalendarCheck,
  FaPills, FaBell, FaShieldAlt, FaChartLine
} from "react-icons/fa";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        "http://localhost:8080/auth/login",
        { username, password }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("username", username);

      if (res.data.role === "PATIENT") {
        try {
          const patientsRes = await axios.get(
            "http://localhost:8080/api/patients",
            { headers: { Authorization: `Bearer ${res.data.token}` } }
          );
          const patient = patientsRes.data.find(
            p => p.userId === res.data.userId
          );
          if (patient) {
            localStorage.setItem("patientId", patient.patientId);
            localStorage.setItem("patientName", patient.name);
          }
        } catch (err) {
          console.error(err);
        }
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleLogin();
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

        {/* Background circles */}
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
          <span>HIPAA Compliant & Secure</span>
        </div>

      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">
        <div className="login-card">

          {/* Header */}
          <div className="login-header">
            <div className="header-icon">
              <FaHeartbeat />
            </div>
            <h2>Welcome Back</h2>
            <p>Sign in to access your dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div className="login-error">
              <FaShieldAlt />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <div className="login-form">

            <div className="form-group">
              <label>Username</label>
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyPress}
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

            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing In...
                </>
              ) : (
                <>
                  <FaShieldAlt />
                  Sign In Securely
                </>
              )}
            </button>

          </div>

          {/* Footer */}
          <div className="login-footer">
            <p>
              New Patient?{" "}
              <Link to="/register">Register Here</Link>
            </p>
            <div className="version-badge">
              <FaHospital />
              Healthcare Management System v1.0
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}