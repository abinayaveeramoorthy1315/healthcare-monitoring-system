import React, { useEffect, useState, useRef } from "react";
import {
  FaUser, FaHeartbeat, FaIdCard, FaLock, FaCamera, FaTrash,
  FaPrint, FaCheckCircle, FaUserMd, FaHospital, FaExclamationTriangle,
  FaNotesMedical, FaSave, FaQrcode, FaExternalLinkAlt
} from "react-icons/fa";
import api from "../api";
import QRCodeView from "../components/QRCodeView";
import "./Profile.css";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal"); // personal, passport, security
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const role = localStorage.getItem("role") || "PATIENT";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/profile");
      setProfile(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setErrorMsg("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://localhost:8080${path}`;
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setSuccessMsg("");
      setErrorMsg("");
      const res = await api.post("/api/profile/upload-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data && res.data.profile) {
        setProfile(res.data.profile);
      } else {
        await fetchProfile();
      }
      setSuccessMsg("Profile photo updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Photo upload failed:", err);
      setErrorMsg("Could not upload photo. Please verify format/size and try again.");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;
    try {
      setSuccessMsg("");
      setErrorMsg("");
      await api.delete("/api/profile/photo");
      await fetchProfile();
      setSuccessMsg("Profile photo removed.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Remove photo failed:", err);
      setErrorMsg("Failed to remove photo.");
    }
  };

  const handleInputChange = (field, value) => {
    setProfile((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-calculate BMI on height/weight change for patients
      if (field === "height" || field === "weight") {
        const h = field === "height" ? parseFloat(value) : parseFloat(next.height);
        const w = field === "weight" ? parseFloat(value) : parseFloat(next.weight);
        if (h > 0 && w > 0) {
          const hm = h / 100.0;
          next.bmi = Math.round((w / (hm * hm)) * 10.0) / 10.0;
        }
      }
      return next;
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSuccessMsg("");
      setErrorMsg("");
      const res = await api.put("/api/profile", profile);
      setProfile(res.data);
      setSuccessMsg("Profile details saved successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Save profile error:", err);
      setErrorMsg("Could not save profile details.");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirm password do not match.");
      return;
    }
    try {
      setSuccessMsg("");
      setErrorMsg("");
      await api.put("/api/profile/change-password", {
        currentPassword,
        newPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMsg("Password changed successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Change password error:", err);
      const msg = err.response?.data?.error || "Failed to change password. Verify your current password.";
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 5000);
    }
  };

  const handlePrintPassport = () => {
    window.open(`/health-passport/${profile.patientId}`, "_blank");
  };

  const getBmiStatus = (bmi) => {
    if (!bmi) return { text: "Normal", class: "badge-green" };
    if (bmi < 18.5) return { text: "Underweight", class: "badge-orange" };
    if (bmi <= 24.9) return { text: "Normal Weight", class: "badge-green" };
    if (bmi <= 29.9) return { text: "Overweight", class: "badge-orange" };
    return { text: "Obese (High Risk)", class: "badge-red" };
  };

  const getRiskBadge = (risk) => {
    if (!risk) return "badge-green";
    const r = risk.toUpperCase();
    if (r.includes("HIGH") || r.includes("CRITICAL")) return "badge-red";
    if (r.includes("MEDIUM")) return "badge-orange";
    return "badge-green";
  };

  if (loading || !profile) {
    return (
      <div className="profile-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <h2>Loading Profile & Health Passport...</h2>
      </div>
    );
  }

  const bmiInfo = getBmiStatus(profile.bmi);
  const passportUrl = `${window.location.origin}/health-passport/${profile.patientId || 1}`;

  return (
    <div className="profile-container">
      {/* Banner */}
      <div className="profile-banner">
        <div className="banner-content">
          <h1>{role === "PATIENT" ? "Personal Health Passport & Profile" : "Professional Profile & Credentials"}</h1>
          <p>Manage your account settings, medical records, and digital verification card securely.</p>
        </div>
        <div className="role-badge-banner">
          {role === "DOCTOR" ? <FaUserMd /> : <FaHospital />}
          <span>{role} ACCOUNT</span>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ background: "#f0fdf4", color: "#16a34a", padding: "14px 20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: "10px" }}>
          <FaCheckCircle /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: "#fef2f2", color: "#dc2626", padding: "14px 20px", borderRadius: "12px", marginBottom: "20px", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "10px" }}>
          <FaExclamationTriangle /> {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`profile-tab-btn ${activeTab === "personal" ? "active" : ""}`}
          onClick={() => setActiveTab("personal")}
        >
          <FaUser /> {role === "PATIENT" ? "Personal & Vitals" : "Profile Details"}
        </button>
        {role === "PATIENT" && (
          <button
            className={`profile-tab-btn ${activeTab === "passport" ? "active" : ""}`}
            onClick={() => setActiveTab("passport")}
          >
            <FaIdCard /> Health Passport & QR
          </button>
        )}
        <button
          className={`profile-tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <FaLock /> Security & Password
        </button>
      </div>

      <div className="profile-grid">
        {/* Left Card: Avatar & Quick Info */}
        <div className="profile-left-card">
          <div className="avatar-wrapper">
            {profile.profilePhoto ? (
              <img src={getPhotoUrl(profile.profilePhoto)} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                {(profile.fullName || profile.doctorName || profile.username || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            style={{ display: "none" }}
          />

          <div className="avatar-actions">
            <button className="photo-upload-btn" onClick={() => fileInputRef.current?.click()}>
              <FaCamera /> Change Photo
            </button>
            {profile.profilePhoto && (
              <button className="photo-delete-btn" onClick={handleRemovePhoto}>
                <FaTrash />
              </button>
            )}
          </div>

          <h3 className="profile-name-title">{profile.fullName || profile.doctorName || profile.adminName || profile.username}</h3>
          <p className="profile-username">@{profile.username} • {profile.email}</p>

          <div className="quick-stats-row">
            {role === "PATIENT" ? (
              <>
                <div className="quick-stat-box">
                  <span className="quick-stat-label">Blood Group</span>
                  <span className="quick-stat-value">{profile.bloodGroup || "O+"}</span>
                </div>
                <div className="quick-stat-box">
                  <span className="quick-stat-label">BMI</span>
                  <span className="quick-stat-value">{profile.bmi || 23.5}</span>
                </div>
                <div className="quick-stat-box">
                  <span className="quick-stat-label">AI Score</span>
                  <span className="quick-stat-value">{profile.aiHealthScore || 88}</span>
                </div>
              </>
            ) : (
              <>
                <div className="quick-stat-box">
                  <span className="quick-stat-label">Patients</span>
                  <span className="quick-stat-value">{profile.totalPatients || 24}</span>
                </div>
                <div className="quick-stat-box">
                  <span className="quick-stat-label">Rating</span>
                  <span className="quick-stat-value">⭐ {profile.averageRating || 4.8}</span>
                </div>
              </>
            )}
          </div>

          {role === "PATIENT" && (
            <div style={{ width: "100%", marginTop: "12px", textAlign: "left", background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 6px 0", fontWeight: 600 }}>PRIMARY DOCTOR</p>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", margin: 0 }}>👨‍⚕️ {profile.primaryDoctor || "Dr. Maaran"}</p>
            </div>
          )}
        </div>

        {/* Right Content */}
        <div className="profile-right-content">
          {/* TAB 1: PERSONAL / DOCTOR DETAILS */}
          {activeTab === "personal" && (
            <form onSubmit={handleSaveProfile}>
              {role === "PATIENT" ? (
                <>
                  <div className="profile-card" style={{ marginBottom: "24px" }}>
                    <div className="profile-card-header">
                      <h4 className="profile-card-title"><FaUser /> Personal Identification</h4>
                    </div>
                    <div className="form-grid-3">
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={profile.fullName || ""}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Age (Years)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={profile.age || ""}
                          onChange={(e) => handleInputChange("age", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select
                          className="form-select"
                          value={profile.gender || "Female"}
                          onChange={(e) => handleInputChange("gender", e.target.value)}
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid" style={{ marginTop: "20px" }}>
                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                          type="email"
                          className="form-input"
                          value={profile.email || ""}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                          type="text"
                          className="form-input"
                          value={profile.phone || ""}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label">Residential Address</label>
                        <input
                          type="text"
                          className="form-input"
                          value={profile.address || ""}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="profile-card" style={{ marginBottom: "24px" }}>
                    <div className="profile-card-header">
                      <h4 className="profile-card-title"><FaHeartbeat /> Physiological Metrics & BMI</h4>
                      <span className={`badge-status ${bmiInfo.class}`}>BMI: {bmiInfo.text}</span>
                    </div>
                    <div className="form-grid-3">
                      <div className="form-group">
                        <label className="form-label">Height (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-input"
                          value={profile.height || ""}
                          onChange={(e) => handleInputChange("height", e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="form-input"
                          value={profile.weight || ""}
                          onChange={(e) => handleInputChange("weight", e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Blood Group</label>
                        <select
                          className="form-select"
                          value={profile.bloodGroup || "O+"}
                          onChange={(e) => handleInputChange("bloodGroup", e.target.value)}
                        >
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="profile-card" style={{ marginBottom: "24px" }}>
                    <div className="profile-card-header">
                      <h4 className="profile-card-title"><FaNotesMedical /> Medical History & Emergency Contact</h4>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Emergency Contact Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={profile.emergencyContactName || ""}
                          onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Emergency Contact Phone</label>
                        <input
                          type="text"
                          className="form-input"
                          value={profile.emergencyContactPhone || ""}
                          onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label">Known Allergies</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Penicillin, Peanuts, Pollen"
                          value={profile.allergies || ""}
                          onChange={(e) => handleInputChange("allergies", e.target.value)}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label">Chronic Diseases & Pre-existing Conditions</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Asthma, Hypertension, Diabetes"
                          value={profile.chronicDiseases || ""}
                          onChange={(e) => handleInputChange("chronicDiseases", e.target.value)}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label">Current Medications</label>
                        <textarea
                          className="form-textarea"
                          rows="2"
                          placeholder="List currently prescribed medicines and dosages"
                          value={profile.currentMedications || ""}
                          onChange={(e) => handleInputChange("currentMedications", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="card-actions">
                      <button type="submit" className="btn-primary">
                        <FaSave /> Save Profile Updates
                      </button>
                    </div>
                  </div>
                </>
              ) : role === "DOCTOR" ? (
                <div className="profile-card">
                  <div className="profile-card-header">
                    <h4 className="profile-card-title"><FaUserMd /> Professional Credentials & Practice Details</h4>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Doctor Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.doctorName || ""}
                        onChange={(e) => handleInputChange("doctorName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Qualifications</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.qualification || ""}
                        onChange={(e) => handleInputChange("qualification", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Specialization</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.specialization || ""}
                        onChange={(e) => handleInputChange("specialization", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Years of Experience</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.experience || ""}
                        onChange={(e) => handleInputChange("experience", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Associated Hospital / Clinic</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.hospitalName || ""}
                        onChange={(e) => handleInputChange("hospitalName", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Consultation Fee (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={profile.consultationFee || ""}
                        onChange={(e) => handleInputChange("consultationFee", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Available Days</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.availableDays || ""}
                        onChange={(e) => handleInputChange("availableDays", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Available Time Slots</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.availableTime || ""}
                        onChange={(e) => handleInputChange("availableTime", e.target.value)}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label className="form-label">About Doctor (Biography)</label>
                      <textarea
                        className="form-textarea"
                        rows="3"
                        value={profile.aboutDoctor || ""}
                        onChange={(e) => handleInputChange("aboutDoctor", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="card-actions">
                    <button type="submit" className="btn-primary">
                      <FaSave /> Save Professional Profile
                    </button>
                  </div>
                </div>
              ) : (
                <div className="profile-card">
                  <div className="profile-card-header">
                    <h4 className="profile-card-title"><FaUser /> System Administrator Profile</h4>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Administrator Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.adminName || ""}
                        onChange={(e) => handleInputChange("adminName", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={profile.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profile.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="card-actions">
                    <button type="submit" className="btn-primary">
                      <FaSave /> Save Admin Profile
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: PERSONAL HEALTH PASSPORT (PATIENTS ONLY) */}
          {activeTab === "passport" && role === "PATIENT" && (
            <div className="profile-card">
              <div className="profile-card-header">
                <h4 className="profile-card-title"><FaIdCard /> Digital Personal Health Passport</h4>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="btn-secondary" onClick={() => window.open(`/health-passport/${profile.patientId}`, "_blank")} style={{ padding: "8px 16px" }}>
                    <FaExternalLinkAlt /> Full Page View
                  </button>
                  <button className="btn-primary" onClick={handlePrintPassport} style={{ padding: "8px 16px" }}>
                    <FaPrint /> Print / Save PDF
                  </button>
                </div>
              </div>

              <div className="passport-card">
                <div className="passport-header">
                  <div className="passport-brand">
                    <div style={{ background: "#35663f", color: "#ffffff", padding: "12px", borderRadius: "14px", display: "flex", fontSize: "20px" }}>
                      <FaIdCard />
                    </div>
                    <div>
                      <h3>SMART HEALTH PASSPORT</h3>
                      <span>Verified Digital Medical Summary & Emergency Identity</span>
                    </div>
                  </div>
                  <span className="badge-status badge-green" style={{ fontSize: "13px" }}>● ACTIVE & VERIFIED</span>
                </div>

                <div className="passport-body">
                  <div className="passport-details-grid">
                    <div className="passport-data-item">
                      <div className="passport-data-label">Patient Name</div>
                      <div className="passport-data-value">{profile.fullName}</div>
                    </div>
                    <div className="passport-data-item">
                      <div className="passport-data-label">Age & Gender</div>
                      <div className="passport-data-value">{profile.age} Yrs • {profile.gender}</div>
                    </div>
                    <div className="passport-data-item">
                      <div className="passport-data-label">Blood Group</div>
                      <div className="passport-data-value" style={{ color: "#dc2626", fontSize: "18px" }}>🩸 {profile.bloodGroup || "O+"}</div>
                    </div>
                    <div className="passport-data-item">
                      <div className="passport-data-label">Height & Weight</div>
                      <div className="passport-data-value">{profile.height || 170} cm • {profile.weight || 68} kg</div>
                    </div>
                    <div className="passport-data-item">
                      <div className="passport-data-label">BMI & Status</div>
                      <div className="passport-data-value">{profile.bmi || 23.5} ({bmiInfo.text})</div>
                    </div>
                    <div className="passport-data-item">
                      <div className="passport-data-label">AI Health Score</div>
                      <div className="passport-data-value" style={{ color: "#35663f" }}>🛡️ {profile.aiHealthScore || 88} / 100 ({profile.riskLevel || "Low"} Risk)</div>
                    </div>
                    <div className="passport-data-item" style={{ gridColumn: "span 3" }}>
                      <div className="passport-data-label">Emergency Contact</div>
                      <div className="passport-data-value">📞 {profile.emergencyContactName} ({profile.emergencyContactPhone})</div>
                    </div>
                    <div className="passport-data-item" style={{ gridColumn: "span 3" }}>
                      <div className="passport-data-label">Known Allergies & Conditions</div>
                      <div className="passport-data-value" style={{ color: "#b91c1c" }}>⚠️ Allergies: {profile.allergies || "None"} | Chronic: {profile.chronicDiseases || "None"}</div>
                    </div>
                  </div>

                  <div className="passport-qr-section">
                    <QRCodeView value={passportUrl} size={160} fgColor="#35663f" />
                    <div className="passport-qr-label">Scan to view live emergency record</div>
                    <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>ID: SHP-{profile.patientId || 1}092</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & PASSWORD */}
          {activeTab === "security" && (
            <div className="profile-card">
              <div className="profile-card-header">
                <h4 className="profile-card-title"><FaLock /> Security & Password Management</h4>
              </div>
              <form onSubmit={handleChangePassword} style={{ maxWidth: "520px" }}>
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter your current password"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="At least 8 characters with numbers/symbols"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "24px" }}>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                  />
                </div>
                <button type="submit" className="btn-primary">
                  <FaLock /> Update Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
