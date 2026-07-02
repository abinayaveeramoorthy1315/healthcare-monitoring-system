import { useState } from "react";
import axios from "axios";
import "../Login.css";

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: "", username: "", password: "",
    email: "", phone: "", age: "",
    gender: "Male", bloodGroup: ""
  });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1=form, 2=otp
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

  // Step 1 — OTP அனுப்பு
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
      setStep(2); // OTP screen காட்டு
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — OTP verify பண்ணி register
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

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-logo">
          <span className="logo-icon">🏥</span>
          <h1>HealthCare</h1>
          <p>Patient Monitoring System</p>
        </div>
        <div className="login-features">
          <div className="feature-item">✅ Real-time Patient Monitoring</div>
          <div className="feature-item">✅ Doctor & Appointment Management</div>
          <div className="feature-item">✅ Emergency Alert System</div>
          <div className="feature-item">✅ Vital Signs Tracking</div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <h2>Create Account</h2>
            <p>{step === 1 ? "Register as a Patient" : "Verify your Email"}</p>
          </div>

          {error && <div className="login-error">⚠️ {error}</div>}

          {/* Step 1 — Registration Form */}
          {step === 1 && (
            <div className="login-form">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="fullName"
                  placeholder="Enter full name"
                  value={formData.fullName} onChange={handleChange} />
                {errors.fullName && <span className="field-error">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label>Username</label>
                <input type="text" name="username"
                  placeholder="Enter username"
                  value={formData.username} onChange={handleChange} />
                {errors.username && <span className="field-error">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label>Password</label>
                <input type="password" name="password"
                  placeholder="Enter password"
                  value={formData.password} onChange={handleChange} />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email"
                  placeholder="Enter email"
                  value={formData.email} onChange={handleChange} />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input type="text" name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone} onChange={handleChange} />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label>Age</label>
                <input type="number" name="age"
                  placeholder="Enter age"
                  value={formData.age} onChange={handleChange} />
                {errors.age && <span className="field-error">{errors.age}</span>}
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Blood Group</label>
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
                {errors.bloodGroup && <span className="field-error">{errors.bloodGroup}</span>}
              </div>

              <button className="login-btn" onClick={handleSendOtp} disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>

              <p style={{ textAlign: "center", marginTop: "10px" }}>
                Already have account?{" "}
                <a href="/login" style={{ color: "#4f8ef7" }}>Login here</a>
              </p>
            </div>
          )}

          {/* Step 2 — OTP Screen */}
          {step === 2 && (
            <div className="login-form">
              <p style={{ textAlign: "center", color: "#555", marginBottom: "20px" }}>
                OTP sent to <strong>{formData.email}</strong>
              </p>

              <div className="form-group">
                <label>Enter 6-digit OTP</label>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <button className="login-btn" onClick={handleVerifyAndRegister} disabled={loading}>
                {loading ? "Verifying..." : "Verify & Register"}
              </button>

              <button
                style={{
                  width: "100%", marginTop: "10px", padding: "10px",
                  background: "none", border: "1px solid #4f8ef7",
                  borderRadius: "8px", color: "#4f8ef7", cursor: "pointer"
                }}
                onClick={() => { setStep(1); setError(""); setOtp(""); }}
              >
                ← Back to Form
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}