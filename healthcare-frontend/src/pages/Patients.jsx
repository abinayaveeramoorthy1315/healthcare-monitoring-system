import { useEffect, useState } from "react";
import {
  getAllPatients, addPatient,
  updatePatient, deletePatient
} from "../services/patientService";
import {
  FaUserInjured, FaPlus, FaEdit, FaTrash,
  FaSearch, FaTimes, FaSave, FaUser,
  FaPhone, FaEnvelope, FaTint
} from "react-icons/fa";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [patientData, setPatientData] = useState({
    name: "", age: "", gender: "Female",
    phone: "", email: "", bloodGroup: ""
  });

  const role = localStorage.getItem("role");

  useEffect(() => { loadPatients(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      patients.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.bloodGroup?.toLowerCase().includes(q)
      )
    );
  }, [search, patients]);

  const loadPatients = async () => {
    try {
      const res = await getAllPatients();
      setPatients(res.data);
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
    setPatientData({ ...patientData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!patientData.name || !patientData.age || !patientData.phone) {
      showMessage("Please fill all required fields!", "error");
      return;
    }
    try {
      if (editId) {
        await updatePatient(editId, patientData);
        showMessage("Patient updated successfully!", "success");
      } else {
        await addPatient(patientData);
        showMessage("Patient added successfully!", "success");
      }
      resetForm();
      loadPatients();
    } catch (err) {
      showMessage("Operation failed!", "error");
    }
  };

  const handleEdit = (patient) => {
    setPatientData({
      name: patient.name, age: patient.age,
      gender: patient.gender, phone: patient.phone,
      email: patient.email, bloodGroup: patient.bloodGroup
    });
    setEditId(patient.patientId);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;
    try {
      await deletePatient(id);
      showMessage("Patient deleted successfully!", "success");
      loadPatients();
    } catch (err) {
      showMessage("Delete failed!", "error");
    }
  };

  const resetForm = () => {
    setPatientData({
      name: "", age: "", gender: "Female",
      phone: "", email: "", bloodGroup: ""
    });
    setEditId(null);
    setShowForm(false);
  };

  const getBloodGroupColor = (bg) => {
    const colors = {
      "A+": "#ef4444", "A-": "#f87171",
      "B+": "#3b82f6", "B-": "#60a5fa",
      "O+": "#10b981", "O-": "#34d399",
      "AB+": "#8b5cf6", "AB-": "#a78bfa"
    };
    return colors[bg] || "#64748b";
  };

  return (
    <div style={styles.wrapper}>

      {/* ===== HEADER ===== */}
      <div style={styles.pageHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaUserInjured />
          </div>
          <div>
            <h1 style={styles.pageTitle}>Patients</h1>
            <p style={styles.pageSubtitle}>
              {filtered.length} patient{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {role === "ADMIN" && (
          <button
            style={showForm ? styles.cancelHeaderBtn : styles.addHeaderBtn}
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
          >
            {showForm ? (
              <><FaTimes /> Cancel</>
            ) : (
              <><FaPlus /> Add Patient</>
            )}
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
            {editId ? "✏️ Edit Patient" : "➕ Add New Patient"}
          </h3>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name *</label>
              <div style={styles.inputWrapper}>
                <FaUser style={styles.inputIcon} />
                <input
                  style={styles.input}
                  type="text"
                  name="name"
                  value={patientData.name}
                  onChange={handleChange}
                  placeholder="Enter patient name"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Age *</label>
              <input
                style={styles.inputPlain}
                type="number"
                name="age"
                value={patientData.age}
                onChange={handleChange}
                placeholder="Enter age"
                min="0" max="150"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Gender</label>
              <select
                style={styles.inputPlain}
                name="gender"
                value={patientData.gender}
                onChange={handleChange}
              >
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone *</label>
              <div style={styles.inputWrapper}>
                <FaPhone style={styles.inputIcon} />
                <input
                  style={styles.input}
                  type="text"
                  name="phone"
                  value={patientData.phone}
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
                  value={patientData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Blood Group</label>
              <div style={styles.inputWrapper}>
                <FaTint style={styles.inputIcon} />
                <select
                  style={styles.input}
                  name="bloodGroup"
                  value={patientData.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="">Select Blood Group</option>
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={styles.formActions}>
            <button style={styles.cancelBtn} onClick={resetForm}>
              <FaTimes /> Cancel
            </button>
            <button style={styles.saveBtn} onClick={handleSubmit}>
              <FaSave /> {editId ? "Update Patient" : "Save Patient"}
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
          placeholder="Search by name, email, phone, blood group..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <FaTimes
            style={styles.clearSearch}
            onClick={() => setSearch("")}
          />
        )}
      </div>

      {/* ===== TABLE ===== */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <p>Loading patients...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}><FaUserInjured /></div>
            <h3>No Patients Found</h3>
            <p>{search ? "Try different search terms" : "Add your first patient!"}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>Age</th>
                  <th style={styles.th}>Gender</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Blood Group</th>
                  {role === "ADMIN" && <th style={styles.th}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient, index) => (
                  <tr
                    key={patient.patientId}
                    style={styles.tr}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    <td style={styles.td}>
                      <span style={styles.indexBadge}>{index + 1}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.patientCell}>
                        <div style={{
                          ...styles.avatar,
                          background: `linear-gradient(135deg, #6366f1, #8b5cf6)`
                        }}>
                          {patient.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={styles.patientName}>{patient.name}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.ageBadge}>{patient.age} yrs</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.genderBadge,
                        background: patient.gender === "Female" ? "#fce7f3" : "#dbeafe",
                        color: patient.gender === "Female" ? "#be185d" : "#1d4ed8"
                      }}>
                        {patient.gender === "Female" ? "♀" : "♂"} {patient.gender}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.phoneCell}>
                        <FaPhone style={{ color: "#64748b", fontSize: "11px" }} />
                        {patient.phone}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.emailText}>{patient.email}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.bloodBadge,
                        background: getBloodGroupColor(patient.bloodGroup) + "20",
                        color: getBloodGroupColor(patient.bloodGroup),
                        border: `1px solid ${getBloodGroupColor(patient.bloodGroup)}40`
                      }}>
                        🩸 {patient.bloodGroup}
                      </span>
                    </td>
                    {role === "ADMIN" && (
                      <td style={styles.td}>
                        <div style={styles.actionBtns}>
                          <button
                            style={styles.editBtn}
                            onClick={() => handleEdit(patient)}
                            title="Edit"
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            style={styles.deleteBtn}
                            onClick={() => handleDelete(patient.patientId)}
                            title="Delete"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
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
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    color: "white",
    boxShadow: "0 4px 12px rgba(99,102,241,0.3)"
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
    background: "linear-gradient(135deg, #35663f, #528b5e)",
    color: "white",
    border: "none",
    padding: "12px 22px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(82,139,94,0.3)",
    fontFamily: "'Outfit', sans-serif"
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
  inputPlain: {
    width: "100%",
    padding: "11px 14px",
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
    background: "linear-gradient(135deg, #15803d, #16a34a)",
    color: "white",
    border: "none",
    padding: "11px 24px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 4px 12px rgba(21,128,61,0.25)"
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
  thead: {
    background: "#f8fafc"
  },
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
  tr: {
    background: "white",
    transition: "background 0.2s"
  },
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
  patientCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
    fontWeight: "700",
    color: "white",
    flexShrink: 0
  },
  patientName: {
    fontWeight: "600",
    color: "#0f172a"
  },
  ageBadge: {
    background: "#f1f5f9",
    color: "#475569",
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600"
  },
  genderBadge: {
    padding: "4px 12px",
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
    color: "#35663f",
    fontSize: "13px"
  },
  bloodBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700"
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
    borderTopColor: "#6366f1",
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
    background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    color: "#6366f1",
    margin: "0 auto 20px"
  }
};

export default Patients;