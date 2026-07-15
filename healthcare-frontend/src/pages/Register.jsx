import { useState } from "react";
import axios from "axios";
import {
  FaHospital, FaUser, FaLock, FaEnvelope, FaPhone,
  FaBirthdayCake, FaVenusMars, FaTint, FaCheckCircle,
  FaUserMd, FaCalendarCheck, FaHeartbeat, FaPills,
  FaBell, FaChartLine, FaShieldAlt, FaArrowLeft
} from "react-icons/fa";
import "../Login.css";

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: "", username: "", password: "",
    email: "", phone: "", age: "",
    gender: "Male", bloodGroup: ""
  });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    let fieldError = "";
    if (name === "fullName" && value.length < 3)
      fieldError = "Minimum 3 characters required";
    if (name === "username" && !/^[A-Za-z0-9_]{4,15}$/.test(value))
      fieldError = "4-15 characters only";
    if (name === "password" && value.length < 6)
      fieldError = "Minimum 6 characters required";
    if (name === "email" && value &&
      !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value))
      fieldError = "Invalid email";
    if (name === "phone" && value && !/^[6-9]\d{9}$/.test(value))
      fieldError = "Enter valid 10 digit number";
    if (name === "age" && value && (value < 1 || value > 120))
      fieldError = "Age must be between 1 and 120";

    setErrors({ ...errors, [name]: fieldError });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName || formData.fullName.length < 3)
      newErrors.fullName = "Minimum 3 characters required";
    if (!/^[A-Za-z0-9_]{4,15}$/.test(formData.username))
      newErrors.username = "4-15 characters only";
    if (!formData.password || formData.password.length < 6)
      newErrors.password = "Minimum 6 characters required";
    if (!formData.email ||
      !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.email))
      newErrors.email = "Invalid email";
    if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone))
      newErrors.phone = "Enter valid 10 digit number";
    if (!formData.age || formData.age < 1 || formData.age > 120)
      newErrors.age = "Age must be between 1 and 120";
    if (!formData.bloodGroup)
      newErrors.bloodGroup = "Please select a blood group";
    return newErrors;
  };

  const handleSendOtp = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.post("http://localhost:8080/auth/send-otp", {
        email: formData.email
      });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otp || otp.length !== 6) {
      setError("Enter valid 6 digit OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.post("http://localhost:8080/auth/register", {
        ...formData,
        age: parseInt(formData.age),
        otp: otp
      });
      alert("Registration Successful! Please Login.");
      window.location.href = "/login";
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed!");
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
          <span>HIPAA Compliant & Secure</span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">
        <div className="login-card">

          <div className="login-header">
            <div className="header-icon">
              {step === 1 ? <FaUser /> : <FaEnvelope />}
            </div>
            <h2>Create Account</h2>
            <p>{step === 1 ? "Register as a Patient" : "Verify your Email"}</p>
          </div>

          {error && (
            <div className="login-error">
              <FaShieldAlt />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1 — Registration Form */}
          {step === 1 && (
            <div className="login-form">

              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="text" name="fullName"
                    placeholder="Enter full name"
                    value={formData.fullName} onChange={handleChange}
                  />
                </div>
                {errors.fullName && <span className="field-error">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label>Username</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="text" name="username"
                    placeholder="Choose a username"
                    value={formData.username} onChange={handleChange}
                  />
                </div>
                {errors.username && <span className="field-error">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type="password" name="password"
                    placeholder="Create a password"
                    value={formData.password} onChange={handleChange}
                  />
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email" name="email"
                    placeholder="Enter your email"
                    value={formData.email} onChange={handleChange}
                  />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-wrapper">
                  <FaPhone className="input-icon" />
                  <input
                    type="text" name="phone"
                    placeholder="10 digit phone number"
                    value={formData.phone} onChange={handleChange}
                  />
                </div>
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label>Age</label>
                  <div className="input-wrapper">
                    <FaBirthdayCake className="input-icon" />
                    <input
                      type="number" name="age"
                      placeholder="Age"
                      value={formData.age} onChange={handleChange}
                    />
                  </div>
                  {errors.age && <span className="field-error">{errors.age}</span>}
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <div className="input-wrapper">
                    <FaVenusMars className="input-icon" />
                    <select name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Blood Group</label>
                <div className="input-wrapper">
                  <FaTint className="input-icon" />
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                {errors.bloodGroup && <span className="field-error">{errors.bloodGroup}</span>}
              </div>

              <button className="login-btn" onClick={handleSendOtp} disabled={loading}>
                {loading ? (
                  <><span className="spinner" /> Sending OTP...</>
                ) : (
                  <><FaShieldAlt /> Send OTP</>
                )}
              </button>

              <div className="login-footer">
                <p>
                  Already have an account?{" "}
                  <a href="/login">Login here</a>
                </p>
              </div>
            </div>
          )}

          {/* Step 2 — OTP Screen */}
          {step === 2 && (
            <div className="login-form">
              <div style={{
                textAlign: "center",
                color: "#64748b",
                marginBottom: "10px",
                fontSize: "14px"
              }}>
                <FaCheckCircle style={{ color: "#16a34a", marginRight: "6px" }} />
                OTP sent to <strong style={{ color: "#0f172a" }}>{formData.email}</strong>
              </div>

              <div className="form-group">
                <label>Enter 6-digit OTP</label>
                <div className="input-wrapper">
                  <FaShieldAlt className="input-icon" />
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{ letterSpacing: "4px", fontWeight: "700", textAlign: "center" }}
                  />
                </div>
              </div>

              <button className="login-btn" onClick={handleVerifyAndRegister} disabled={loading}>
                {loading ? (
                  <><span className="spinner" /> Verifying...</>
                ) : (
                  <><FaCheckCircle /> Verify & Register</>
                )}
              </button>

              <button
                onClick={() => { setStep(1); setError(""); setOtp(""); }}
                style={{
                  width: "100%",
                  marginTop: "12px",
                  padding: "12px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  color: "#475569",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                <FaArrowLeft /> Back to Form
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}