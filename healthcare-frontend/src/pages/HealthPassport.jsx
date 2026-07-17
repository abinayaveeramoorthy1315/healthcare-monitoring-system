import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaIdCard, FaPrint, FaArrowLeft, FaHospital, FaPhoneAlt, FaExclamationTriangle, FaUserMd } from "react-icons/fa";
import api from "../api";
import QRCodeView from "../components/QRCodeView";
import "./HealthPassport.css";

function HealthPassport() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPassport();
  }, [patientId]);

  const fetchPassport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/profile/health-passport/${patientId || 1}`);
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to load health passport:", err);
      setError("Health Passport not found or unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://localhost:8080${path}`;
  };

  if (loading) {
    return (
      <div className="passport-page-container" style={{ justifyContent: "center" }}>
        <h2>Loading Digital Health Passport...</h2>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="passport-page-container" style={{ justifyContent: "center", textAlign: "center" }}>
        <h2 style={{ color: "#dc2626" }}>{error || "Passport Not Found"}</h2>
        <button onClick={() => navigate(-1)} style={{ marginTop: "16px", padding: "10px 20px", background: "#35663f", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: 600 }}>
          <FaArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  const passportUrl = `${window.location.origin}/health-passport/${profile.patientId || 1}`;

  return (
    <div className="passport-page-container">
      {/* Action Bar */}
      <div className="print-bar">
        <button
          onClick={() => navigate(-1)}
          style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "10px 18px", borderRadius: "12px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}
        >
          <FaArrowLeft /> Back to Profile
        </button>
        <button
          onClick={() => window.print()}
          style={{ background: "#35663f", color: "#ffffff", border: "none", padding: "12px 24px", borderRadius: "12px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 15px rgba(53, 102, 63, 0.25)" }}
        >
          <FaPrint /> Print Official Health Passport
        </button>
      </div>

      {/* Main Document */}
      <div className="passport-document">
        <div className="passport-doc-header">
          <div className="passport-doc-title">
            <FaHospital style={{ fontSize: "36px" }} />
            <div>
              <h1>OFFICIAL PERSONAL HEALTH PASSPORT</h1>
              <p>Verified Digital Emergency & Clinical Summary Record</p>
            </div>
          </div>
          <div className="passport-doc-badge">
            ● EMERGENCY VERIFIED
          </div>
        </div>

        <div className="passport-doc-body">
          <div className="passport-profile-banner">
            {profile.profilePhoto ? (
              <img src={getPhotoUrl(profile.profilePhoto)} alt="Avatar" className="passport-avatar" />
            ) : (
              <div className="passport-avatar-placeholder">
                {(profile.fullName || "P").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="passport-name-area">
              <h2>{profile.fullName}</h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: "15px" }}>ID: SHP-{profile.patientId}092 • {profile.age} Years • {profile.gender}</p>
              <span className="blood-badge-main">BLOOD GROUP: {profile.bloodGroup || "O+"}</span>
            </div>
          </div>

          <div className="passport-info-grid">
            <div className="info-card-item">
              <div className="info-card-label">Physiological Metrics</div>
              <div className="info-card-value">{profile.height || 170} cm / {profile.weight || 68} kg</div>
            </div>
            <div className="info-card-item">
              <div className="info-card-label">Body Mass Index (BMI)</div>
              <div className="info-card-value">{profile.bmi || 23.5}</div>
            </div>
            <div className="info-card-item">
              <div className="info-card-label">AI Risk Assessment</div>
              <div className="info-card-value" style={{ color: "#35663f" }}>🛡️ Score: {profile.aiHealthScore || 88} ({profile.riskLevel || "Low"} Risk)</div>
            </div>
            <div className="info-card-item">
              <div className="info-card-label">Primary Care Doctor</div>
              <div className="info-card-value">👨‍⚕️ {profile.primaryDoctor || "Dr. Maaran"}</div>
            </div>
            <div className="info-card-item" style={{ gridColumn: "span 2" }}>
              <div className="info-card-label">Emergency Contact</div>
              <div className="info-card-value" style={{ color: "#dc2626" }}>
                <FaPhoneAlt style={{ fontSize: "14px" }} /> {profile.emergencyContactName} ({profile.emergencyContactPhone})
              </div>
            </div>
          </div>

          <div className="passport-alerts-section">
            <h3><FaExclamationTriangle /> Critical Medical Alerts & Medications</h3>
            <div className="alerts-grid">
              <div className="alert-item-box">
                <div className="alert-item-label">Known Allergies</div>
                <div className="alert-item-val" style={{ color: "#b91c1c" }}>{profile.allergies || "None reported"}</div>
              </div>
              <div className="alert-item-box">
                <div className="alert-item-label">Chronic Conditions</div>
                <div className="alert-item-val">{profile.chronicDiseases || "None"}</div>
              </div>
              <div className="alert-item-box" style={{ gridColumn: "span 2" }}>
                <div className="alert-item-label">Current Prescribed Medications</div>
                <div className="alert-item-val">{profile.currentMedications || "None"}</div>
              </div>
            </div>
          </div>

          <div className="passport-footer-row">
            <div>
              <p style={{ fontWeight: 700, margin: "0 0 4px 0", color: "#35663f" }}>Smart Healthcare Monitoring System</p>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Scan QR Code with any mobile camera to verify or update emergency data.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <QRCodeView value={passportUrl} size={110} fgColor="#35663f" />
              <span style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>SHP QR VERIFICATION</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthPassport;
