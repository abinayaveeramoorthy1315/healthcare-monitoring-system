import { useEffect, useState } from "react";
import {
  getAllDoctors, addDoctor,
  updateDoctor, deleteDoctor
} from "../services/doctorService";
import {
  FaUserMd, FaPlus, FaEdit, FaTrash,
  FaSearch, FaTimes, FaSave, FaPhone,
  FaEnvelope, FaClock, FaStethoscope
} from "react-icons/fa";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [doctorData, setDoctorData] = useState({
    doctorName: "", specialization: "",
    phone: "", email: "", availability: ""
  });

  const role = localStorage.getItem("role");

  useEffect(() => { loadDoctors(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      doctors.filter(d =>
        d.doctorName?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.phone?.includes(q)
      )
    );
  }, [search, doctors]);

  const loadDoctors = async () => {
    try {
      const res = await getAllDoctors();
      setDoctors(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleChange = (e) => {
    setDoctorData({ ...doctorData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!doctorData.doctorName || !doctorData.specialization) {
      showMessage("Please fill all required fields!", "error");
      return;
    }
    try {
      if (editId) {
        await updateDoctor(editId, doctorData);
        showMessage("Doctor updated successfully!", "success");
      } else {
        await addDoctor(doctorData);
        showMessage("Doctor added successfully!", "success");
      }
      resetForm();
      loadDoctors();
    } catch (err) {
      showMessage("Operation failed!", "error");
    }
  };

  const handleEdit = (doctor) => {
    setDoctorData({
      doctorName: doctor.doctorName,
      specialization: doctor.specialization,
      phone: doctor.phone,
      email: doctor.email,
      availability: doctor.availability
    });
    setEditId(doctor.doctorId);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      await deleteDoctor(id);
      showMessage("Doctor deleted successfully!", "success");
      loadDoctors();
    } catch (err) {
      showMessage("Delete failed!", "error");
    }
  };

  const resetForm = () => {
    setDoctorData({
      doctorName: "", specialization: "",
      phone: "", email: "", availability: ""
    });
    setEditId(null);
    setShowForm(false);
  };

  const getSpecializationColor = (spec) => {
    const colors = {
      "cardiologist": "#ef4444",
      "cardio": "#ef4444",
      "neurologist": "#8b5cf6",
      "dermatologist": "#f59e0b",
      "pediatrician": "#10b981",
      "orthopedic": "#3b82f6",
      "gynecologist": "#ec4899",
      "general": "#64748b"
    };
    const key = spec?.toLowerCase() || "";
    return Object.entries(colors).find(([k]) => key.includes(k))?.[1] || "#2563eb";
  };

  const getAvailabilityConfig = (avail) => {
    const a = avail?.toLowerCase() || "";
    if (a.includes("morning")) return { color: "#f59e0b", bg: "#fef3c7", label: "Morning" };
    if (a.includes("evening")) return { color: "#8b5cf6", bg: "#ede9fe", label: "Evening" };
    if (a.includes("night")) return { color: "#1d4ed8", bg: "#dbeafe", label: "Night" };
    return { color: "#10b981", bg: "#dcfce7", label: "✅ " + avail };
  };

  return (
    <div style={styles.wrapper}>

      {/* ===== HEADER ===== */}
      <div style={styles.pageHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaUserMd />
          </div>
          <div>
            <h1 style={styles.pageTitle}>Doctors</h1>
            <p style={styles.pageSubtitle}>
              {filtered.length} doctor{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {role === "ADMIN" && (
          <button
            style={showForm ? styles.cancelHeaderBtn : styles.addHeaderBtn}
            onClick={() => showForm ? resetForm() : setShowForm(true)}
          >
            {showForm ? <><FaTimes /> Cancel</> : <><FaPlus /> Add Doctor</>}
          </button>
        )}
      </div>

      {/* ===== MESSAGE ===== */}
      {message.text && (
        <div style={{
          ...styles.message,
          background: message.type === "success" ? "#dcfce7" : "#fee2e2",
          color: message.type === "success" ? "#15803d" : "#dc2626",
          borderLeft: `4px solid ${message.type === "success" ? "#16a34a" : "#dc2626"}`
        }}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {/* ===== FORM ===== */}
      {showForm && role === "ADMIN" && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {editId ? "✏️ Edit Doctor" : "➕ Add New Doctor"}
          </h3>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Doctor Name *</label>
              <div style={styles.inputWrapper}>
                <FaUserMd style={styles.inputIcon} />
                <input
                  style={styles.input}
                  type="text"
                  name="doctorName"
                  value={doctorData.doctorName}
                  onChange={handleChange}
                  placeholder="e.g. Dr. John Smith"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Specialization *</label>
              <div style={styles.inputWrapper}>
                <FaStethoscope style={styles.inputIcon} />
                <input
                  style={styles.input}
                  type="text"
                  name="specialization"
                  value={doctorData.specialization}
                  onChange={handleChange}
                  placeholder="e.g. Cardiologist"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone</label>
              <div style={styles.inputWrapper}>
                <FaPhone style={styles.inputIcon} />
                <input
                  style={styles.input}
                  type="text"
                  name="phone"
                  value={doctorData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <div style={styles.inputWrapper}>
                <FaEnvelope style={styles.inputIcon} />
                <input
                  style={styles.input}
                  type="email"
                  name="email"
                  value={doctorData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Availability</label>
              <div style={styles.inputWrapper}>
                <FaClock style={styles.inputIcon} />
                <select
                  style={styles.input}
                  name="availability"
                  value={doctorData.availability}
                  onChange={handleChange}
                >
                  <option value="">Select Availability</option>
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                  <option value="Morning & Evening">Morning & Evening</option>
                  <option value="All Day">All Day</option>
                </select>
              </div>
            </div>
          </div>

          <div style={styles.formActions}>
            <button style={styles.cancelBtn} onClick={resetForm}>
              <FaTimes /> Cancel
            </button>
            <button style={styles.saveBtn} onClick={handleSubmit}>
              <FaSave /> {editId ? "Update Doctor" : "Save Doctor"}
            </button>
          </div>
        </div>
      )}

      {/* ===== SEARCH ===== */}
      <div style={styles.searchBar}>
        <FaSearch style={styles.searchIcon} />
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search by name, specialization, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <FaTimes style={styles.clearSearch} onClick={() => setSearch("")} />
        )}
      </div>

      {/* ===== TABLE ===== */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <p>Loading doctors...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}><FaUserMd /></div>
            <h3>No Doctors Found</h3>
            <p>{search ? "Try different search terms" : "Add your first doctor!"}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Doctor</th>
                  <th style={styles.th}>Specialization</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Availability</th>
                  {role === "ADMIN" && <th style={styles.th}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((doctor, index) => {
                  const availConfig = getAvailabilityConfig(doctor.availability);
                  const specColor = getSpecializationColor(doctor.specialization);
                  return (
                    <tr
                      key={doctor.doctorId}
                      style={styles.tr}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}
                    >
                      <td style={styles.td}>
                        <span style={styles.indexBadge}>{index + 1}</span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.doctorCell}>
                          <div style={{
                            ...styles.avatar,
                            background: `linear-gradient(135deg, ${specColor}, ${specColor}cc)`
                          }}>
                            {doctor.doctorName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={styles.doctorName}>{doctor.doctorName}</p>
                            <p style={styles.doctorId}>ID: {doctor.doctorId}</p>
                          </div>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={{
                          ...styles.specBadge,
                          background: specColor + "15",
                          color: specColor,
                          border: `1px solid ${specColor}30`
                        }}>
                          <FaStethoscope style={{ fontSize: "10px" }} />
                          {doctor.specialization}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.phoneCell}>
                          <FaPhone style={{ color: "#64748b", fontSize: "11px" }} />
                          {doctor.phone || "-"}
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={styles.emailText}>{doctor.email || "-"}</span>
                      </td>

                      <td style={styles.td}>
                        <span style={{
                          ...styles.availBadge,
                          background: availConfig.bg,
                          color: availConfig.color
                        }}>
                          {availConfig.label}
                        </span>
                      </td>

                      {role === "ADMIN" && (
                        <td style={styles.td}>
                          <div style={styles.actionBtns}>
                            <button
                              style={styles.editBtn}
                              onClick={() => handleEdit(doctor)}
                            >
                              <FaEdit /> Edit
                            </button>
                            <button
                              style={styles.deleteBtn}
                              onClick={() => handleDelete(doctor.doctorId)}
                            >
                              <FaTrash /> Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== STYLES ===== */
const styles = {
  wrapper: {
    padding: "28px 32px",
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "'Inter', sans-serif"
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
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
    background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    color: "white",
    boxShadow: "0 4px 12px rgba(14,165,233,0.3)"
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
  addHeaderBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #1e40af, #2563eb)",
    color: "white",
    border: "none",
    padding: "12px 22px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
    fontFamily: "'Inter', sans-serif"
  },
  cancelHeaderBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    padding: "12px 22px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif"
  },
  message: {
    padding: "14px 18px",
    borderRadius: "12px",
    marginBottom: "20px",
    fontSize: "14px",
    fontWeight: "600"
  },
  formCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    marginBottom: "24px",
    boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0"
  },
  formTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "24px"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151"
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
    fontSize: "14px"
  },
  input: {
    width: "100%",
    padding: "11px 14px 11px 40px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    color: "#0f172a",
    background: "#f8fafc",
    outline: "none"
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid #f1f5f9"
  },
  cancelBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    padding: "11px 20px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif"
  },
  saveBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #0369a1, #0ea5e9)",
    color: "white",
    border: "none",
    padding: "11px 24px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 4px 12px rgba(14,165,233,0.3)"
  },
  searchBar: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    marginBottom: "20px"
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    color: "#94a3b8",
    fontSize: "15px"
  },
  searchInput: {
    width: "100%",
    padding: "13px 44px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    background: "white",
    outline: "none",
    boxShadow: "0 2px 8px rgba(15,23,42,0.04)"
  },
  clearSearch: {
    position: "absolute",
    right: "16px",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "14px"
  },
  tableCard: {
    background: "white",
    borderRadius: "20px",
    boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
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
  tr: { background: "white", transition: "background 0.2s" },
  td: {
    padding: "16px 18px",
    fontSize: "14px",
    color: "#334155",
    borderBottom: "1px solid #f1f5f9"
  },
  indexBadge: {
    background: "#f1f5f9",
    color: "#64748b",
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600"
  },
  doctorCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "700",
    color: "white",
    flexShrink: 0
  },
  doctorName: {
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
    fontSize: "14px"
  },
  doctorId: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "2px 0 0"
  },
  specBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600"
  },
  phoneCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#475569"
  },
  emailText: {
    color: "#2563eb",
    fontSize: "13px"
  },
  availBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600"
  },
  actionBtns: {
    display: "flex",
    gap: "8px"
  },
  editBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "linear-gradient(135deg, #d97706, #f59e0b)",
    color: "white",
    border: "none",
    padding: "7px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif"
  },
  deleteBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "linear-gradient(135deg, #b91c1c, #dc2626)",
    color: "white",
    border: "none",
    padding: "7px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif"
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "60px",
    gap: "16px",
    color: "#64748b"
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#0ea5e9",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 24px"
  },
  emptyIcon: {
    width: "72px",
    height: "72px",
    background: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    color: "#0ea5e9",
    margin: "0 auto 20px"
  }
};

export default Doctors;