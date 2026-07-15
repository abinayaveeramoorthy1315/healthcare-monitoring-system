import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarCheck, FaHeartbeat, FaBrain, FaBone,
  FaEye, FaStethoscope, FaUserMd, FaClock,
  FaFileMedical, FaCheckCircle
} from "react-icons/fa";

function BookAppointment() {
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    doctorId: "", slotId: "", reason: ""
  });

  const navigate = useNavigate();

  useEffect(() => { loadDoctors(); }, []);

  // Auto-select doctor recommended by AI Symptom Checker
  useEffect(() => {
    const preSelectedDoctorId = localStorage.getItem("preSelectedDoctorId");
    if (preSelectedDoctorId && doctors.length > 0) {
      const doc = doctors.find(d => d.doctorId === Number(preSelectedDoctorId));
      if (doc) {
        setSelectedSpecialization(doc.specialization);
        setFormData(prev => ({ ...prev, doctorId: String(doc.doctorId) }));
        loadSlotsForDoctor(doc.doctorId);
      }
      localStorage.removeItem("preSelectedDoctorId");
    }
  }, [doctors]);

  const loadDoctors = async () => {
    try {
      const res = await api.get("/api/doctors");
      setDoctors(res.data);
    } catch (err) { console.error(err); }
  };

  const loadSlotsForDoctor = async (doctorId) => {
    setSlots([]);
    if (doctorId) {
      try {
        const res = await api.get(`/api/slots/available/${doctorId}`);
        setSlots(res.data);
      } catch (err) { console.error(err); }
    }
  };

  const handleDoctorChange = async (e) => {
    const doctorId = e.target.value;
    setFormData({ ...formData, doctorId, slotId: "" });
    loadSlotsForDoctor(doctorId);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.doctorId || !formData.slotId) {
      setMessage({ text: "Please select doctor and time slot!", type: "error" });
      return;
    }

    const patientId = localStorage.getItem("patientId");
    if (!patientId) {
      setMessage({ text: "Patient not found! Please login again.", type: "error" });
      return;
    }

    const selectedSlot = slots.find(s => s.slotId === Number(formData.slotId));
    if (!selectedSlot) {
      setMessage({ text: "Invalid slot selected!", type: "error" });
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/appointments", {
        patient: { patientId: Number(patientId) },
        doctor: { doctorId: Number(formData.doctorId) },
        appointmentDate: selectedSlot.slotDate,
        appointmentTime: selectedSlot.startTime + " - " + selectedSlot.endTime,
        status: "PENDING"
      });

      await api.put(`/api/slots/book/${formData.slotId}`);

      setMessage({ text: "Appointment booked successfully!", type: "success" });
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setMessage({ text: "Booking failed! Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const specializations = [
    ...new Set(doctors.map(doc => doc.specialization).filter(Boolean))
  ];

  const getSpecIcon = (spec) => {
    const s = spec?.toLowerCase() || "";
    if (s.includes("cardio")) return <FaHeartbeat />;
    if (s.includes("neuro")) return <FaBrain />;
    if (s.includes("ortho")) return <FaBone />;
    if (s.includes("ophthal") || s.includes("eye")) return <FaEye />;
    return <FaStethoscope />;
  };

  const selectedDoctor = doctors.find(d => d.doctorId === Number(formData.doctorId));

  return (
    <div style={styles.wrapper}>

      {/* ===== HEADER ===== */}
      <div style={styles.pageHeader}>
        <div style={styles.headerIcon}>
          <FaCalendarCheck />
        </div>
        <div>
          <h1 style={styles.pageTitle}>Book Appointment</h1>
          <p style={styles.pageSubtitle}>
            Schedule a consultation with your preferred doctor
          </p>
        </div>
      </div>

      {/* ===== MESSAGE ===== */}
      {message.text && (
        <div style={{
          ...styles.message,
          background: message.type === "success" ? "#dcfce7" : "#fee2e2",
          color: message.type === "success" ? "#15803d" : "#dc2626",
          borderLeft: `4px solid ${message.type === "success" ? "#16a34a" : "#dc2626"}`
        }}>
          {message.type === "success" && <FaCheckCircle style={{ marginRight: "8px" }} />}
          {message.text}
        </div>
      )}

      <div style={styles.formCard}>

        {/* ===== STEP 1: Specialization ===== */}
        <div style={styles.stepSection}>
          <div style={styles.stepHeader}>
            <span style={styles.stepNumber}>1</span>
            <h3 style={styles.stepTitle}>Select Specialization</h3>
          </div>

          <div style={styles.specGrid}>
            {specializations.map(spec => (
              <div
                key={spec}
                onClick={() => {
                  setSelectedSpecialization(spec);
                  setSlots([]);
                  setFormData({ ...formData, doctorId: "", slotId: "" });
                }}
                style={{
                  ...styles.specCard,
                  background: selectedSpecialization === spec
                    ? "linear-gradient(135deg, #1e40af, #2563eb)"
                    : "white",
                  color: selectedSpecialization === spec ? "white" : "#374151",
                  borderColor: selectedSpecialization === spec ? "#2563eb" : "#e2e8f0",
                  boxShadow: selectedSpecialization === spec
                    ? "0 8px 20px rgba(37,99,235,0.3)"
                    : "0 2px 8px rgba(15,23,42,0.04)"
                }}
              >
                <div style={{
                  ...styles.specIcon,
                  background: selectedSpecialization === spec
                    ? "rgba(255,255,255,0.2)"
                    : "#eff6ff",
                  color: selectedSpecialization === spec ? "white" : "#2563eb"
                }}>
                  {getSpecIcon(spec)}
                </div>
                <span style={styles.specName}>{spec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== STEP 2: Doctor ===== */}
        {selectedSpecialization && (
          <div style={styles.stepSection}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>2</span>
              <h3 style={styles.stepTitle}>Select Doctor</h3>
            </div>

            <div style={styles.inputWrapper}>
              <FaUserMd style={styles.inputIcon} />
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleDoctorChange}
                style={styles.input}
              >
                <option value="">-- Select Doctor --</option>
                {doctors
                  .filter(doc => doc.specialization === selectedSpecialization)
                  .map(doc => (
                    <option key={doc.doctorId} value={doc.doctorId}>
                      Dr. {doc.doctorName}
                    </option>
                  ))}
              </select>
            </div>

            {selectedDoctor && (
              <div style={styles.doctorPreview}>
                <div style={styles.doctorAvatar}>
                  {selectedDoctor.doctorName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={styles.doctorName}>Dr. {selectedDoctor.doctorName}</p>
                  <p style={styles.doctorSpec}>{selectedDoctor.specialization}</p>
                </div>
                {localStorage.getItem("cameFromSymptomChecker") && (
                  <span style={{
                    marginLeft: "auto",
                    background: "#dcfce7",
                    color: "#15803d",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: "700"
                  }}>
                    ✓ AI Recommended
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== STEP 3: Time Slot ===== */}
        {formData.doctorId && (
          <div style={styles.stepSection}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>3</span>
              <h3 style={styles.stepTitle}>Select Time Slot</h3>
            </div>

            {slots.length === 0 ? (
              <div style={styles.noSlots}>
                <FaClock style={{ fontSize: "20px", color: "#94a3b8" }} />
                <span>No slots available for this doctor</span>
              </div>
            ) : (
              <div style={styles.slotsGrid}>
                {slots.map(slot => (
                  <div
                    key={slot.slotId}
                    onClick={() => setFormData({ ...formData, slotId: String(slot.slotId) })}
                    style={{
                      ...styles.slotCard,
                      background: formData.slotId === String(slot.slotId)
                        ? "linear-gradient(135deg, #1e40af, #2563eb)"
                        : "white",
                      color: formData.slotId === String(slot.slotId) ? "white" : "#374151",
                      borderColor: formData.slotId === String(slot.slotId) ? "#2563eb" : "#e2e8f0"
                    }}
                  >
                    <FaCalendarCheck style={{ fontSize: "14px" }} />
                    <div>
                      <div style={styles.slotDate}>{slot.slotDate}</div>
                      <div style={styles.slotTime}>
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== STEP 4: Reason ===== */}
        <div style={styles.stepSection}>
          <div style={styles.stepHeader}>
            <span style={styles.stepNumber}>4</span>
            <h3 style={styles.stepTitle}>Describe Your Symptoms</h3>
          </div>

          <div style={styles.inputWrapper}>
            <FaFileMedical style={{ ...styles.inputIcon, top: "16px", transform: "none" }} />
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your symptoms in detail..."
              style={{ ...styles.input, resize: "vertical", paddingTop: "12px" }}
            />
          </div>
        </div>

        {/* ===== Submit Button ===== */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={styles.submitBtn}
        >
          {loading ? (
            <>
              <span style={styles.spinner} /> Booking...
            </>
          ) : (
            <>
              <FaCalendarCheck /> Confirm Appointment
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    padding: "28px 32px",
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "'Inter', sans-serif"
  },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px"
  },
  headerIcon: {
    width: "52px",
    height: "52px",
    background: "linear-gradient(135deg, #1e40af, #2563eb)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    color: "white",
    boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "2px 0 0"
  },
  message: {
    display: "flex",
    alignItems: "center",
    padding: "14px 18px",
    borderRadius: "12px",
    marginBottom: "20px",
    fontSize: "14px",
    fontWeight: "600"
  },
  formCard: {
    background: "white",
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "700px",
    boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0"
  },
  stepSection: {
    marginBottom: "28px",
    paddingBottom: "28px",
    borderBottom: "1px solid #f1f5f9"
  },
  stepHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px"
  },
  stepNumber: {
    width: "28px",
    height: "28px",
    background: "linear-gradient(135deg, #1e40af, #2563eb)",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
    flexShrink: 0
  },
  stepTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0
  },
  specGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px"
  },
  specCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    padding: "18px 12px",
    borderRadius: "14px",
    border: "2px solid",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  specIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px"
  },
  specName: {
    fontSize: "13px",
    fontWeight: "600",
    textAlign: "center"
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    color: "#94a3b8",
    fontSize: "14px",
    top: "50%",
    transform: "translateY(-50%)"
  },
  input: {
    width: "100%",
    padding: "12px 14px 12px 40px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    color: "#0f172a",
    background: "#f8fafc",
    outline: "none",
    boxSizing: "border-box"
  },
  doctorPreview: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "14px",
    padding: "14px",
    background: "#eff6ff",
    borderRadius: "12px"
  },
  doctorAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "700",
    fontSize: "16px",
    flexShrink: 0
  },
  doctorName: {
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    fontSize: "14px"
  },
  doctorSpec: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0
  },
  noSlots: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "12px",
    color: "#94a3b8",
    fontSize: "14px"
  },
  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "10px"
  },
  slotCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "2px solid",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  slotDate: {
    fontSize: "13px",
    fontWeight: "700"
  },
  slotTime: {
    fontSize: "12px",
    opacity: 0.85
  },
  submitBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "15px",
    background: "linear-gradient(135deg, #1e40af, #2563eb)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 8px 20px rgba(37,99,235,0.3)"
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  }
};

export default BookAppointment;