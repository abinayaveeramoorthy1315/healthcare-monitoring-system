import { useEffect, useState } from "react";
import api from "../api";
import {
  FaCalendarCheck, FaUserMd, FaClock, FaHeartbeat,
  FaBrain, FaBone, FaEye, FaStethoscope, FaCheckCircle,
  FaFileMedical, FaChevronLeft, FaChevronRight, FaCalendarAlt
} from "react-icons/fa";

function BookAppointment() {
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [formData, setFormData] = useState({
    doctorId: "",
    slotId: "",
    reason: ""
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState("");

  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    // If redirected from AI Symptom Checker or preselected doctor
    const preselectedId = localStorage.getItem("preSelectedDoctorId");
    if (preselectedId && doctors.length > 0) {
      const doc = doctors.find(d => String(d.doctorId) === String(preselectedId));
      if (doc) {
        setSelectedSpecialization(doc.specialization);
        setFormData(prev => ({ ...prev, doctorId: String(doc.doctorId) }));
        loadAvailableSlots(doc.doctorId);
        localStorage.removeItem("preSelectedDoctorId");
      }
    }
  }, [doctors]);

  const loadDoctors = async () => {
    try {
      const res = await api.get("/api/doctors");
      setDoctors(res.data || []);
    } catch (err) {
      console.error("Failed to load doctors", err);
    }
  };

  const loadAvailableSlots = async (docId) => {
    if (!docId) return;
    try {
      const res = await api.get(`/api/slots/available/${docId}`);
      setSlots(res.data || []);
      // If there are available slots, pre-select the first available date for convenience
      if (res.data && res.data.length > 0) {
        const firstDate = res.data[0].slotDate;
        setSelectedDateStr(firstDate);
      }
    } catch (err) {
      console.error("Failed to load available slots", err);
    }
  };

  const handleDoctorChange = (e) => {
    const docId = e.target.value;
    setFormData({ ...formData, doctorId: docId, slotId: "" });
    setSelectedDateStr("");
    if (docId) {
      loadAvailableSlots(docId);
    } else {
      setSlots([]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const handleSubmit = async () => {
    if (!formData.doctorId || !formData.slotId || !formData.reason) {
      showMsg("Please complete all steps: Doctor, Time Slot, and Reason!", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/appointments", {
        doctorId: Number(formData.doctorId),
        slotId: Number(formData.slotId),
        reason: formData.reason,
        username: localStorage.getItem("username") || ""
      });
      showMsg("🎉 Appointment requested successfully! The doctor will review and confirm your appointment shortly.", "success");
      setFormData({ doctorId: "", slotId: "", reason: "" });
      setSelectedSpecialization("");
      setSelectedDateStr("");
      setSlots([]);
    } catch (err) {
      showMsg(err.response?.data?.message || "Failed to book appointment!", "error");
    } finally {
      setLoading(false);
    }
  };

  const specializations = [...new Set(doctors.map(doc => doc.specialization).filter(Boolean))];

  const getSpecIcon = (spec) => {
    const s = spec?.toLowerCase() || "";
    if (s.includes("cardio")) return <FaHeartbeat />;
    if (s.includes("neuro")) return <FaBrain />;
    if (s.includes("ortho")) return <FaBone />;
    if (s.includes("ophthal") || s.includes("eye")) return <FaEye />;
    return <FaStethoscope />;
  };

  const selectedDoctor = doctors.find(d => d.doctorId === Number(formData.doctorId));

  // Calendar Helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun
    const daysCount = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysCount, year, month };
  };

  const { firstDay, daysCount, year, month } = getDaysInMonth(currentMonth);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const todayStr = new Date().toISOString().split("T")[0];

  const getAvailableSlotsForDate = (dateStr) => {
    return slots.filter(s => s.slotDate === dateStr && !s.booked);
  };

  const getDateStatus = (dateStr) => {
    if (dateStr < todayStr) return { color: "#cbd5e1", bg: "#f1f5f9", label: "Past Date", type: "gray" };
    const daySlots = getAvailableSlotsForDate(dateStr);
    if (daySlots.length === 0) return { color: "#94a3b8", bg: "#f8fafc", label: "No Available Slots", type: "neutral" };
    if (daySlots.length <= 2) return { color: "#d97706", bg: "#fef3c7", label: `Few Left (${daySlots.length})`, type: "yellow" };
    return { color: "#15803d", bg: "#dcfce7", label: `Available (${daySlots.length})`, type: "green" };
  };

  return (
    <div style={styles.wrapper}>
      {/* ===== HEADER ===== */}
      <div style={styles.pageHeader}>
        <div style={styles.headerIcon}>
          <FaCalendarAlt />
        </div>
        <div>
          <h1 style={styles.pageTitle}>Book Appointment</h1>
          <p style={styles.pageSubtitle}>
            Schedule your visit with our intelligent color-coded hospital scheduling system
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
                  setSelectedDateStr("");
                  setFormData({ ...formData, doctorId: "", slotId: "" });
                }}
                style={{
                  ...styles.specCard,
                  background: selectedSpecialization === spec
                    ? "linear-gradient(135deg, #35663f, #528b5e)"
                    : "white",
                  color: selectedSpecialization === spec ? "white" : "#1a3323",
                  borderColor: selectedSpecialization === spec ? "#528b5e" : "#cbd5e1",
                  boxShadow: selectedSpecialization === spec
                    ? "0 8px 20px rgba(82,139,94,0.3)"
                    : "0 2px 8px rgba(27,58,38,0.04)"
                }}
              >
                <div style={{
                  ...styles.specIcon,
                  background: selectedSpecialization === spec
                    ? "rgba(255,255,255,0.2)"
                    : "#edf7ed",
                  color: selectedSpecialization === spec ? "white" : "#35663f"
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
                <span style={styles.availableBadge}>
                  ✓ Verified Specialist
                </span>
              </div>
            )}
          </div>
        )}

        {/* ===== STEP 3: Color-Coded Monthly Calendar & Time Slots ===== */}
        {formData.doctorId && (
          <div style={styles.stepSection}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>3</span>
              <h3 style={styles.stepTitle}>Select Date & Time Slot (Monthly Calendar Grid)</h3>
            </div>

            <div style={styles.calendarContainer}>
              {/* Calendar Header */}
              <div style={styles.calendarHeader}>
                <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#1a3323" }}>
                  {monthNames[month]} {year}
                </h4>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    style={styles.navBtn}
                    onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    style={styles.navBtn}
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    Today
                  </button>
                  <button
                    style={styles.navBtn}
                    onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div style={styles.legendBar}>
                <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#10b981" }}></span> Green: Available</div>
                <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#f59e0b" }}></span> Yellow: Few Left (1-2)</div>
                <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#94a3b8" }}></span> Gray/Neutral: No Slots</div>
              </div>

              {/* Calendar Grid Header */}
              <div style={styles.calendarGridHeader}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                  <div key={d} style={styles.gridHeaderCell}>{d}</div>
                ))}
              </div>

              {/* Calendar Grid Cells */}
              <div style={styles.calendarGrid}>
                {Array.from({ length: firstDay }).map((_, idx) => (
                  <div key={`empty-${idx}`} style={styles.emptyGridCell} />
                ))}
                {Array.from({ length: daysCount }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const status = getDateStatus(dateStr);
                  const isSelected = selectedDateStr === dateStr;
                  const hasAvailable = status.type === "green" || status.type === "yellow";

                  return (
                    <div
                      key={dateStr}
                      onClick={() => {
                        if (hasAvailable) {
                          setSelectedDateStr(dateStr);
                          setFormData(prev => ({ ...prev, slotId: "" }));
                        }
                      }}
                      style={{
                        ...styles.gridCell,
                        background: isSelected ? "#edf7ed" : status.bg,
                        border: isSelected ? "2px solid #35663f" : `1px solid ${status.color}`,
                        opacity: status.type === "gray" || status.type === "neutral" ? 0.55 : 1,
                        cursor: hasAvailable ? "pointer" : "not-allowed"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "800", fontSize: "15px", color: "#1a3323" }}>{dayNum}</span>
                        {dateStr === todayStr && <span style={styles.todayTag}>Today</span>}
                      </div>
                      <div style={{ ...styles.statusPill, color: status.color }}>
                        {status.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Picker for Selected Date */}
            {selectedDateStr && (
              <div style={styles.timeSection}>
                <h4 style={styles.timeHeader}>
                  Available Time Slots for <span style={{ color: "#35663f" }}>{selectedDateStr}</span>
                </h4>
                {getAvailableSlotsForDate(selectedDateStr).length === 0 ? (
                  <div style={styles.noSlots}>
                    <FaClock style={{ fontSize: "18px", color: "#94a3b8" }} />
                    <span>No available slots left on this date. Please pick another date.</span>
                  </div>
                ) : (
                  <div style={styles.slotsGrid}>
                    {getAvailableSlotsForDate(selectedDateStr).map(slot => (
                      <div
                        key={slot.slotId}
                        onClick={() => setFormData({ ...formData, slotId: String(slot.slotId) })}
                        style={{
                          ...styles.slotCard,
                          background: formData.slotId === String(slot.slotId)
                            ? "linear-gradient(135deg, #35663f, #528b5e)"
                            : "white",
                          color: formData.slotId === String(slot.slotId) ? "white" : "#1a3323",
                          borderColor: formData.slotId === String(slot.slotId) ? "#528b5e" : "#82c08e",
                          boxShadow: formData.slotId === String(slot.slotId)
                            ? "0 4px 12px rgba(82,139,94,0.3)"
                            : "0 2px 6px rgba(27,58,38,0.04)"
                        }}
                      >
                        <FaClock style={{ fontSize: "16px", color: formData.slotId === String(slot.slotId) ? "white" : "#528b5e" }} />
                        <div>
                          <div style={styles.slotTime}>
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <div style={{ fontSize: "11px", opacity: 0.85, fontWeight: "600" }}>
                            🟢 Available
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              placeholder="Describe your symptoms or reason for visit in detail..."
              style={{ ...styles.input, resize: "vertical", paddingTop: "12px" }}
            />
          </div>
        </div>

        {/* ===== Submit Button ===== */}
        <button
          onClick={handleSubmit}
          disabled={loading || !formData.slotId}
          style={{
            ...styles.submitBtn,
            opacity: (!formData.slotId || loading) ? 0.6 : 1,
            cursor: (!formData.slotId || loading) ? "not-allowed" : "pointer"
          }}
        >
          {loading ? (
            <>
              <span style={styles.spinner} /> Booking Appointment...
            </>
          ) : (
            <>
              <FaCalendarCheck /> Confirm Appointment Booking
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
    background: "#edf7ed",
    fontFamily: "'Outfit', sans-serif"
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
    background: "linear-gradient(135deg, #35663f, #528b5e)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    color: "white",
    boxShadow: "0 4px 12px rgba(82,139,94,0.3)"
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#1a3323",
    margin: 0
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#5c7564",
    margin: "4px 0 0"
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
    maxWidth: "800px",
    boxShadow: "0 16px 40px rgba(27,58,38,0.08)",
    border: "1px solid rgba(82,139,94,0.2)"
  },
  stepSection: {
    marginBottom: "28px",
    paddingBottom: "28px",
    borderBottom: "1px solid rgba(82,139,94,0.12)"
  },
  stepHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px"
  },
  stepNumber: {
    width: "30px",
    height: "30px",
    background: "linear-gradient(135deg, #35663f, #528b5e)",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "800",
    flexShrink: 0
  },
  stepTitle: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#1a3323",
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
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px"
  },
  specName: {
    fontSize: "13px",
    fontWeight: "700",
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
    color: "#82c08e",
    fontSize: "16px",
    top: "50%",
    transform: "translateY(-50%)"
  },
  input: {
    width: "100%",
    padding: "12px 14px 12px 42px",
    border: "1.5px solid rgba(82,139,94,0.25)",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "'Outfit', sans-serif",
    color: "#1a3323",
    background: "#f8fafc",
    outline: "none",
    boxSizing: "border-box"
  },
  doctorPreview: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginTop: "16px",
    padding: "16px",
    background: "#edf7ed",
    borderRadius: "14px",
    border: "1px solid rgba(82,139,94,0.3)"
  },
  doctorAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #35663f, #528b5e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "800",
    fontSize: "18px",
    flexShrink: 0
  },
  doctorName: {
    fontWeight: "800",
    color: "#1a3323",
    margin: 0,
    fontSize: "15px"
  },
  doctorSpec: {
    fontSize: "13px",
    color: "#5c7564",
    margin: "2px 0 0",
    fontWeight: "600"
  },
  availableBadge: {
    marginLeft: "auto",
    background: "#dcfce7",
    color: "#15803d",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700"
  },
  calendarContainer: {
    background: "#f8fafc",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid rgba(82,139,94,0.2)",
    marginBottom: "20px"
  },
  calendarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px"
  },
  navBtn: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid rgba(82,139,94,0.25)",
    background: "white",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
    color: "#1a3323"
  },
  legendBar: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    padding: "10px 14px",
    background: "white",
    borderRadius: "10px",
    marginBottom: "14px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#5c7564",
    border: "1px solid rgba(82,139,94,0.15)"
  },
  legendItem: { display: "flex", alignItems: "center", gap: "6px" },
  legendDot: { width: "10px", height: "10px", borderRadius: "50%", display: "inline-block" },
  calendarGridHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    background: "rgba(82,139,94,0.1)",
    borderRadius: "8px",
    padding: "8px 0",
    textAlign: "center",
    fontWeight: "700",
    fontSize: "13px",
    color: "#1a3323",
    marginBottom: "8px"
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px"
  },
  emptyGridCell: { minHeight: "75px", background: "transparent", borderRadius: "10px" },
  gridCell: {
    minHeight: "75px",
    padding: "8px",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "all 0.15s"
  },
  todayTag: {
    background: "#35663f",
    color: "white",
    fontSize: "10px",
    fontWeight: "800",
    padding: "2px 6px",
    borderRadius: "4px"
  },
  statusPill: {
    fontSize: "11px",
    fontWeight: "700",
    textAlign: "center",
    padding: "3px",
    borderRadius: "6px",
    marginTop: "6px"
  },
  timeSection: {
    background: "#edf7ed",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid rgba(82,139,94,0.3)"
  },
  timeHeader: { margin: "0 0 14px", fontSize: "16px", fontWeight: "800", color: "#1a3323" },
  noSlots: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "16px",
    background: "white",
    borderRadius: "12px",
    color: "#5c7564",
    fontSize: "14px",
    fontWeight: "600"
  },
  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px"
  },
  slotCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "2px solid",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  slotTime: {
    fontSize: "14px",
    fontWeight: "800"
  },
  submitBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "16px",
    background: "linear-gradient(135deg, #35663f, #528b5e)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "800",
    fontFamily: "'Outfit', sans-serif",
    boxShadow: "0 8px 20px rgba(82,139,94,0.3)",
    transition: "all 0.2s"
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "3px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  }
};

export default BookAppointment;