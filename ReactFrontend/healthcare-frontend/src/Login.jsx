import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:8080/auth/login",
        {
          username,
          password,
        }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("username", username);

      if (res.data.role === "PATIENT") {
        try {
          const patientsRes = await axios.get(
            "http://localhost:8080/api/patients",
            {
              headers: {
                Authorization: `Bearer ${res.data.token}`,
              },
            }
          );

          const patient = patientsRes.data.find(
            (p) => p.userId === res.data.userId
          );

          if (patient) {
            localStorage.setItem(
              "patientId",
              patient.patientId
            );
            localStorage.setItem(
              "patientName",
              patient.name
            );
          }
        } catch (err) {
          console.error(err);
        }
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError("Invalid username or password");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="login-container">

      {/* LEFT PANEL */}

      <div className="login-left">

        <div className="login-logo">
          <span className="logo-icon">🏥</span>

          {/* CHANGE APP NAME HERE */}
          <h1>HealthCare Pro</h1>

          {/* CHANGE TAGLINE HERE */}
          <p>
            Smart Healthcare Management Platform
          </p>
        </div>

        <div className="login-features">

          <div className="feature-item">
            ✅ Patient Records Management
          </div>

          <div className="feature-item">
            ✅ Appointment Scheduling
          </div>

          <div className="feature-item">
            ✅ Vital Signs Monitoring
          </div>

          <div className="feature-item">
            ✅ Prescription Management
          </div>

          <div className="feature-item">
            ✅ Emergency Alert Tracking
          </div>

        </div>

      </div>

      {/* RIGHT PANEL */}

      <div className="login-right">

        <div className="login-card">

          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>
              Sign in to access your dashboard
            </p>
          </div>

          {error && (
            <div className="login-error">
              ⚠️ {error}
            </div>
          )}

          <div className="login-form">

            <div className="form-group">
              <label>Username</label>

              <input
                type="text"
                placeholder="Enter Username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                onKeyDown={handleKeyPress}
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                onKeyDown={handleKeyPress}
              />
            </div>

            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading
                ? "Signing In..."
                : "Login"}
            </button>

          </div>

          <div className="login-footer">

            <p style={{ marginBottom: "12px" }}>
              New Patient?{" "}
              <Link
                to="/register"
                style={{
                  color: "#2563eb",
                  textDecoration: "none",
                  fontWeight: "600",
                }}
              >
                Register Here
              </Link>
            </p>

            <p>
              Healthcare Management System v1.0
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}