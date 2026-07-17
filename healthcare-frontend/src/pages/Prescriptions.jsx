import { useEffect, useState } from "react";
import api from "../api";
import {
  FaPills, FaPlus, FaTrash, FaTimes, FaSave,
  FaPrint, FaUserInjured, FaUserMd, FaCalendarCheck,
  FaClock, FaSearch, FaFileAlt
} from "react-icons/fa";

function Prescriptions() {
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    patientId: "", medicineName: "",
    dosage: "", duration: "", instructions: ""
  });

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  useEffect(() => {
    loadPatients();
    loadPrescriptions();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      prescriptions.filter(p =>
        p.patient?.name?.toLowerCase().includes(q) ||
        p.medicineName?.toLowerCase().includes(q) ||
        p.doctor?.doctorName?.toLowerCase().includes(q)
      )
    );
  }, [search, prescriptions]);

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const loadPatients = async () => {
    try {
      const res = await api.get("/api/patients");
      setPatients(res.data);
    } catch (err) { console.error(err); }
  };

  const loadPrescriptions = async () => {
    try {
      if (role === "ADMIN") {
        const res = await api.get("/api/prescriptions");
        setPrescriptions(res.data);
        setFiltered(res.data);
      } else if (role === "DOCTOR") {
        const doctorsRes = await api.get("/api/doctors");
        const doctor = doctorsRes.data.find(d => {
          const cleaned = d.doctorName?.toLowerCase()
            .replace(/dr\.?\s*/i, "").replace(/\s+/g, "").trim();
          return cleaned === username?.toLowerCase().replace(/\s+/g, "").trim();
        });
        if (doctor) {
          const res = await api.get(`/api/prescriptions/doctor/${doctor.doctorId}`);
          setPrescriptions(res.data);
          setFiltered(res.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDoctorId = async () => {
    const res = await api.get("/api/doctors");
    const doctor = res.data.find(d => {
      const cleaned = d.doctorName?.toLowerCase()
        .replace(/dr\.?\s*/i, "").replace(/\s+/g, "").trim();
      return cleaned === username?.toLowerCase().replace(/\s+/g, "").trim();
    });
    return doctor?.doctorId;
  };

  const handleSubmit = async () => {
    if (!formData.patientId || !formData.medicineName ||
        !formData.dosage || !formData.duration) {
      showMsg("Please fill all required fields!", "error");
      return;
    }
    try {
      const doctorId = await getCurrentDoctorId();
      if (!doctorId && role === "DOCTOR") {
        showMsg("Doctor profile not found!", "error");
        return;
      }
      await api.post("/api/prescriptions", {
        patientId: formData.patientId,
        doctorId: doctorId,
        medicineName: formData.medicineName,
        dosage: formData.dosage,
        duration: formData.duration,
        instructions: formData.instructions
      });
      showMsg("Prescription added successfully!", "success");
      setFormData({
        patientId: "", medicineName: "",
        dosage: "", duration: "", instructions: ""
      });
      setShowForm(false);
      loadPrescriptions();
    } catch (err) {
      showMsg("Failed to add prescription!", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this prescription?")) return;
    try {
      await api.delete(`/api/prescriptions/${id}`);
      showMsg("Prescription deleted!", "success");
      loadPrescriptions();
    } catch (err) {
      showMsg("Delete failed!", "error");
    }
  };

  const handlePrint = (p) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription - ${p.patient?.name}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 3px solid #35663f; padding-bottom: 24px; margin-bottom: 28px; }
            .header h1 { color: #35663f; font-size: 26px; margin-bottom: 4px; }
            .header p { color: #64748b; font-size: 13px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
            .info-box { background: #f8fafc; padding: 16px; border-radius: 8px; }
            .info-label { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px; }
            .info-value { font-size: 15px; font-weight: 600; color: #0f172a; }
            .rx-box { border: 2px solid #35663f; border-radius: 12px; padding: 24px; margin-bottom: 28px; }
            .rx-title { font-size: 18px; font-weight: 700; color: #35663f; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
            .rx-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
            .rx-label { font-weight: 600; color: #475569; width: 130px; font-size: 14px; }
            .rx-value { color: #0f172a; font-size: 14px; flex: 1; }
            .footer { text-align: right; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            .doctor-sign { font-size: 18px; font-weight: 700; color: #35663f; }
            .disclaimer { font-size: 11px; color: #94a3b8; margin-top: 8px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HealthCare Medical Center</h1>
            <p>Smart Healthcare Monitoring System | Patient Prescription</p>
          </div>
          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">PATIENT NAME</div>
              <div class="info-value">${p.patient?.name || "-"}</div>
            </div>
            <div class="info-box">
              <div class="info-label">PRESCRIBED BY</div>
              <div class="info-value">${p.doctor?.doctorName || "-"}</div>
            </div>
            <div class="info-box">
              <div class="info-label">SPECIALIZATION</div>
              <div class="info-value">${p.doctor?.specialization || "-"}</div>
            </div>
            <div class="info-box">
              <div class="info-label">DATE</div>
              <div class="info-value">${p.prescribedDate || new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <div class="rx-box">
            <div class="rx-title">Prescription Details</div>
            <div class="rx-row">
              <span class="rx-label">Medicine</span>
              <span class="rx-value">${p.medicineName}</span>
            </div>
            <div class="rx-row">
              <span class="rx-label">Dosage</span>
              <span class="rx-value">${p.dosage}</span>
            </div>
            <div class="rx-row">
              <span class="rx-label">Duration</span>
              <span class="rx-value">${p.duration}</span>
            </div>
            <div class="rx-row" style="border-bottom:none">
              <span class="rx-label">Instructions</span>
              <span class="rx-value">${p.instructions || "As directed by doctor"}</span>
            </div>
          </div>
          <div class="footer">
            <div class="doctor-sign">${p.doctor?.doctorName || "-"}</div>
            <div class="disclaimer">This is a computer generated prescription</div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={styles.wrapper}>

      {/* ===== HEADER ===== */}
      <div style={styles.pageHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaPills />
          </div>
          <div>
            <h1 style={styles.pageTitle}>Prescriptions</h1>
            <p style={styles.pageSubtitle}>
              {filtered.length} prescription{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {(role === "DOCTOR" || role === "ADMIN") && (
          <button
            style={showForm ? styles.cancelHeaderBtn : styles.addHeaderBtn}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm
              ? <><FaTimes /> Cancel</>
              : <><FaPlus /> Add Prescription</>
            }
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
          {message.text}
        </div>
      )}

      {/* ===== FORM ===== */}
      {showForm && (role === "DOCTOR" || role === "ADMIN") && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>New Prescription</h3>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Patient *</label>
              <div style={styles.inputWrapper}>
                <FaUserInjured style={styles.inputIcon} />
                <select
                  style={styles.input}
                  value={formData.patientId}
                  onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map(p => (
                    <option key={p.patientId} value={p.patientId}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Medicine Name *</label>
              <div style={styles.inputWrapper}>
                <FaPills style={styles.inputIcon} />
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. Paracetamol 500mg"
                  value={formData.medicineName}
                  onChange={e => setFormData({ ...formData, medicineName: e.target.value })}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Dosage *</label>
              <input
                style={styles.inputPlain}
                type="text"
                placeholder="e.g. 1 tablet twice daily"
                value={formData.dosage}
                onChange={e => setFormData({ ...formData, dosage: e.target.value })}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Duration *</label>
              <div style={styles.inputWrapper}>
                <FaClock style={styles.inputIcon} />
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. 5 days"
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            </div>

            <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
              <label style={styles.label}>Instructions</label>
              <textarea
                style={{ ...styles.inputPlain, resize: "vertical", height: "80px" }}
                placeholder="e.g. Take after food, avoid alcohol..."
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
              />
            </div>
          </div>

          <div style={styles.formActions}>
            <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>
              <FaTimes /> Cancel
            </button>
            <button style={styles.saveBtn} onClick={handleSubmit}>
              <FaSave /> Save Prescription
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
          placeholder="Search by patient, medicine or doctor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <FaTimes style={styles.clearSearch} onClick={() => setSearch("")} />
        )}
      </div>

      {/* ===== LIST ===== */}
      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p>Loading prescriptions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}><FaPills /></div>
          <h3>No Prescriptions Found</h3>
          <p>Add your first prescription!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filtered.map(p => (
            <div key={p.prescriptionId} style={styles.prescCard}>

              {/* Top Row */}
              <div style={styles.prescTop}>
                <div style={styles.prescLeft}>
                  <div style={styles.prescIconWrap}>
                    <FaFileAlt />
                  </div>
                  <div>
                    <div style={styles.prescMeta}>
                      <div style={styles.metaItem}>
                        <FaUserInjured style={{ color: "#6366f1", fontSize: "13px" }} />
                        <span style={styles.metaValue}>{p.patient?.name || "-"}</span>
                      </div>
                      <span style={styles.metaDivider}>|</span>
                      <div style={styles.metaItem}>
                        <FaUserMd style={{ color: "#0ea5e9", fontSize: "13px" }} />
                        <span style={styles.metaValue}>{p.doctor?.doctorName || "-"}</span>
                      </div>
                      <span style={styles.metaDivider}>|</span>
                      <div style={styles.metaItem}>
                        <FaCalendarCheck style={{ color: "#94a3b8", fontSize: "12px" }} />
                        <span style={{ fontSize: "13px", color: "#64748b" }}>
                          {p.prescribedDate || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={styles.prescActions}>
                  <button
                    style={styles.printBtn}
                    onClick={() => handlePrint(p)}
                  >
                    <FaPrint /> Print
                  </button>
                  {(role === "ADMIN" || role === "DOCTOR") && (
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(p.prescriptionId)}
                    >
                      <FaTrash /> Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Details */}
              <div style={styles.prescDetails}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Medicine</span>
                  <span style={{
                    ...styles.detailValue,
                    color: "#0f172a",
                    fontWeight: "700"
                  }}>
                    {p.medicineName}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Dosage</span>
                  <span style={styles.detailValue}>{p.dosage}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Duration</span>
                  <span style={styles.detailValue}>{p.duration}</span>
                </div>
                {p.instructions && (
                  <div style={{ ...styles.detailItem, gridColumn: "1 / -1" }}>
                    <span style={styles.detailLabel}>Instructions</span>
                    <span style={{ ...styles.detailValue, color: "#475569" }}>
                      {p.instructions}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
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
    background: "linear-gradient(135deg, #059669, #10b981)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    color: "white",
    boxShadow: "0 4px 12px rgba(16,185,129,0.3)"
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
    fontFamily: "'Outfit', sans-serif",
    boxShadow: "0 4px 12px rgba(82,139,94,0.3)"
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
    background: "linear-gradient(135deg, #059669, #10b981)",
    color: "white",
    border: "none",
    padding: "11px 24px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 4px 12px rgba(16,185,129,0.25)"
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
    outline: "none"
  },
  clearSearch: {
    position: "absolute",
    right: "16px",
    color: "#94a3b8",
    cursor: "pointer"
  },
  prescCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px 24px",
    boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0",
    borderLeft: "5px solid #10b981"
  },
  prescTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px"
  },
  prescLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  prescIconWrap: {
    width: "40px",
    height: "40px",
    background: "linear-gradient(135deg, #059669, #10b981)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    color: "white",
    flexShrink: 0
  },
  prescMeta: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap"
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  metaValue: {
    fontWeight: "600",
    color: "#0f172a",
    fontSize: "14px"
  },
  metaDivider: {
    color: "#e2e8f0",
    fontWeight: "300"
  },
  prescActions: {
    display: "flex",
    gap: "8px",
    flexShrink: 0
  },
  printBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "linear-gradient(135deg, #059669, #10b981)",
    color: "white",
    border: "none",
    padding: "8px 16px",
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
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif"
  },
  prescDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "10px"
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  detailLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: "0.8px",
    textTransform: "uppercase"
  },
  detailValue: {
    fontSize: "14px",
    color: "#374151",
    fontWeight: "500"
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
    borderTopColor: "#10b981",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  emptyState: {
    background: "white",
    borderRadius: "20px",
    textAlign: "center",
    padding: "60px 24px"
  },
  emptyIcon: {
    width: "72px",
    height: "72px",
    background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    color: "#10b981",
    margin: "0 auto 20px"
  }
};

export default Prescriptions;