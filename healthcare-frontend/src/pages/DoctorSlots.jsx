import { useEffect, useState } from "react";
import api from "../api";
import {
  FaClock, FaUserMd, FaPlus, FaTrash,
  FaCalendarCheck, FaCheckCircle, FaBan
} from "react-icons/fa";

function DoctorSlots() {
  const [slots, setSlots] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formData, setFormData] = useState({
    doctorId: "", slotDate: "", startTime: "", endTime: ""
  });

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (role === "ADMIN") {
      loadDoctors();
    } else if (role === "DOCTOR") {
      loadCurrentDoctorSlots();
    }
  }, []);

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const loadDoctors = async () => {
    try {
      const res = await api.get("/api/doctors");
      setDoctors(res.data);
    } catch (err) { console.error(err); }
  };

  const loadCurrentDoctorSlots = async () => {
    try {
      const res = await api.get("/api/doctors");
      const doctor = res.data.find(d => {
        const cleaned = d.doctorName?.toLowerCase()
          .replace(/dr\.?\s*/i, "").replace(/\s+/g, "").trim();
        const uname = username?.toLowerCase().replace(/\s+/g, "").trim();
        return cleaned === uname;
      });
      if (doctor) {
        setFormData(prev => ({ ...prev, doctorId: doctor.doctorId }));
        const slotsRes = await api.get(`/api/slots/doctor/${doctor.doctorId}`);
        setSlots(slotsRes.data);
      }
    } catch (err) { console.error(err); }
  };

  const handleDoctorChange = async (e) => {
    const doctorId = e.target.value;
    setFormData({ ...formData, doctorId });
    if (doctorId) {
      try {
        const res = await api.get(`/api/slots/doctor/${doctorId}`);
        setSlots(res.data);
      } catch (err) { console.error(err); }
    } else {
      setSlots([]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSlot = async () => {
    // ✅ Fix - ADMIN doctor select பண்ணலன்னா block பண்ணு
    if (role === "ADMIN" && !formData.doctorId) {
      showMsg("Please select a doctor first!", "error");
      return;
    }
    if (!formData.slotDate || !formData.startTime || !formData.endTime) {
      showMsg("Please fill all required fields!", "error");
      return;
    }
    if (formData.startTime >= formData.endTime) {
      showMsg("End time must be after start time!", "error");
      return;
    }

    try {
      await api.post("/api/slots", {
        doctorId: formData.doctorId,
        slotDate: formData.slotDate,
        startTime: formData.startTime,
        endTime: formData.endTime
      });
      showMsg("Slot added successfully!", "success");
      setFormData(prev => ({ ...prev, slotDate: "", startTime: "", endTime: "" }));

      if (role === "DOCTOR") {
        loadCurrentDoctorSlots();
      } else {
        const res = await api.get(`/api/slots/doctor/${formData.doctorId}`);
        setSlots(res.data);
      }
    } catch (err) {
      showMsg("Failed to add slot!", "error");
    }
  };

  const handleDelete = async (slotId) => {
    if (!window.confirm("Delete this slot?")) return;
    try {
      await api.delete(`/api/slots/${slotId}`);
      showMsg("Slot deleted!", "success");
      if (role === "DOCTOR") {
        loadCurrentDoctorSlots();
      } else {
        const res = await api.get(`/api/slots/doctor/${formData.doctorId}`);
        setSlots(res.data);
      }
    } catch (err) {
      showMsg("Delete failed!", "error");
    }
  };

  // ✅ Fix - ADMIN doctor select பண்ணாதவரை form disable
  const isFormReady = role === "DOCTOR" || (role === "ADMIN" && formData.doctorId);

  const availableCount = slots.filter(s => !s.booked).length;
  const bookedCount = slots.filter(s => s.booked).length;

  return (
    <div style={styles.wrapper}>

      {/* ===== HEADER ===== */}
      <div style={styles.pageHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaClock />
          </div>
          <div>
            <h1 style={styles.pageTitle}>Availability Slots</h1>
            <p style={styles.pageSubtitle}>
              {role === "ADMIN"
                ? "Manage doctor availability slots"
                : "Manage your availability slots"}
            </p>
          </div>
        </div>
      </div>

      {/* ===== MESSAGE ===== */}
      {message.text && (
        <div style={{
          ...styles.message,
          background: message.type === "success" ? "#dcfce7" : "#fee2e2",
          color: message.type === "success" ? "#15803d" : "#dc2626"
        }}>
          {message.text}
        </div>
      )}

      {/* ===== ADMIN - Doctor Selector ===== */}
      {role === "ADMIN" && (
        <div style={styles.doctorSelectCard}>
          <label style={styles.selectLabel}>
            <FaUserMd style={{ color: "#2563eb" }} />
            Select Doctor
          </label>
          <select
            value={formData.doctorId}
            onChange={handleDoctorChange}
            style={styles.doctorSelect}
          >
            <option value="">-- Choose a doctor to manage slots --</option>
            {doctors.map(d => (
              <option key={d.doctorId} value={d.doctorId}>
                {d.doctorName} - {d.specialization}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ===== Summary (only when doctor selected/logged) ===== */}
      {isFormReady && (
        <div style={styles.summaryGrid}>
          <div style={{ ...styles.summaryCard, background: "linear-gradient(135deg, #059669, #10b981)" }}>
            <FaCheckCircle style={styles.summaryIcon} />
            <div>
              <p style={styles.summaryLabel}>Available Slots</p>
              <h2 style={styles.summaryCount}>{availableCount}</h2>
            </div>
          </div>
          <div style={{ ...styles.summaryCard, background: "linear-gradient(135deg, #b91c1c, #dc2626)" }}>
            <FaBan style={styles.summaryIcon} />
            <div>
              <p style={styles.summaryLabel}>Booked Slots</p>
              <h2 style={styles.summaryCount}>{bookedCount}</h2>
            </div>
          </div>
          <div style={{ ...styles.summaryCard, background: "linear-gradient(135deg, #1e40af, #2563eb)" }}>
            <FaCalendarCheck style={styles.summaryIcon} />
            <div>
              <p style={styles.summaryLabel}>Total Slots</p>
              <h2 style={styles.summaryCount}>{slots.length}</h2>
            </div>
          </div>
        </div>
      )}

      {/* ===== Add Slot Form ===== */}
      {!isFormReady && role === "ADMIN" ? (
        <div style={styles.disabledNote}>
          <FaUserMd style={{ fontSize: "24px", color: "#94a3b8" }} />
          <p>Select a doctor above to manage their availability slots</p>
        </div>
      ) : (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Add New Slot</h3>
          <div style={styles.formRow}>

            <div style={styles.formGroup}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                name="slotDate"
                value={formData.slotDate}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Start Time</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>End Time</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <button style={styles.addBtn} onClick={handleAddSlot}>
              <FaPlus /> Add Slot
            </button>
          </div>
        </div>
      )}

      {/* ===== Slots Table ===== */}
      {isFormReady && (
        <div style={styles.tableCard}>
          {slots.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}><FaClock /></div>
              <h3>No Slots Added Yet</h3>
              <p>Add your first availability slot above</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {slots.map(slot => (
                  <tr key={slot.slotId} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.dateCell}>
                        <FaCalendarCheck style={{ color: "#94a3b8", fontSize: "12px" }} />
                        {slot.slotDate}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.timeCell}>
                        <FaClock style={{ color: "#94a3b8", fontSize: "12px" }} />
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        background: slot.booked ? "#fee2e2" : "#dcfce7",
                        color: slot.booked ? "#dc2626" : "#15803d"
                      }}>
                        {slot.booked ? <FaBan /> : <FaCheckCircle />}
                        {slot.booked ? "Booked" : "Available"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {!slot.booked && (
                        <button
                          style={styles.deleteBtn}
                          onClick={() => handleDelete(slot.slotId)}
                        >
                          <FaTrash /> Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
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
    marginBottom: "24px"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  headerIcon: {
    width: "52px",
    height: "52px",
    background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    color: "white",
    boxShadow: "0 4px 12px rgba(124,58,237,0.3)"
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
    padding: "14px 18px",
    borderRadius: "12px",
    marginBottom: "20px",
    fontSize: "14px",
    fontWeight: "600"
  },
  doctorSelectCard: {
    background: "white",
    padding: "20px 24px",
    borderRadius: "16px",
    marginBottom: "20px",
    boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0"
  },
  selectLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "10px"
  },
  doctorSelect: {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    color: "#0f172a",
    background: "#f8fafc",
    outline: "none"
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "20px"
  },
  summaryCard: {
    borderRadius: "16px",
    padding: "18px 22px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    color: "white"
  },
  summaryIcon: {
    fontSize: "24px",
    opacity: 0.85
  },
  summaryLabel: {
    fontSize: "12px",
    opacity: 0.85,
    margin: "0 0 3px"
  },
  summaryCount: {
    fontSize: "26px",
    fontWeight: "800",
    margin: 0
  },
  disabledNote: {
    background: "white",
    padding: "40px",
    borderRadius: "16px",
    textAlign: "center",
    border: "1px dashed #cbd5e1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    color: "#64748b",
    marginBottom: "20px"
  },
  formCard: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    marginBottom: "20px",
    boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0"
  },
  formTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "16px"
  },
  formRow: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-end",
    flexWrap: "wrap"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "150px"
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151"
  },
  input: {
    padding: "10px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    color: "#0f172a",
    background: "#f8fafc",
    outline: "none"
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
    color: "white",
    border: "none",
    padding: "11px 22px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 4px 12px rgba(124,58,237,0.3)"
  },
  tableCard: {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0",
    overflow: "hidden"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  thead: { background: "#f8fafc" },
  th: {
    padding: "14px 18px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    borderBottom: "1px solid #e2e8f0"
  },
  tr: { background: "white" },
  td: {
    padding: "14px 18px",
    fontSize: "14px",
    color: "#334155",
    borderBottom: "1px solid #f1f5f9"
  },
  dateCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  timeCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600"
  },
  deleteBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "linear-gradient(135deg, #b91c1c, #dc2626)",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif"
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 24px"
  },
  emptyIcon: {
    width: "64px",
    height: "64px",
    background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    color: "#7c3aed",
    margin: "0 auto 16px"
  }
};

export default DoctorSlots;