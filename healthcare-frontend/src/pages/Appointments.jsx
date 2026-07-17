import { useEffect, useState } from "react";
import api from "../api";
import {
  getAllAppointments,
  addAppointment,
  deleteAppointment
} from "../services/appointmentService";
import {
  FaCalendarCheck, FaPlus, FaTrash, FaTimes,
  FaSave, FaCheck, FaBan, FaUserInjured,
  FaUserMd, FaClock, FaSearch, FaStar
} from "react-icons/fa";
import ReviewModal from "../components/ReviewModal";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [search, setSearch] = useState("");

  const [appointmentData, setAppointmentData] = useState({
    appointmentDate: "",
    appointmentTime: "",
    status: "PENDING",
    patientId: "",
    doctorId: ""
  });

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  const [reviewModal, setReviewModal] = useState(null);
  const [reviewedMap, setReviewedMap] = useState({});

  useEffect(() => {
    loadAppointments();
    if (role === "ADMIN" || role === "DOCTOR") {
      loadPatients();
      loadDoctors();
    }
  }, []);

  useEffect(() => {
    if (role === "PATIENT") {
      appointments
        .filter((a) => a.status === "BOOKED")
        .forEach((a) => checkReviewed(a.appointmentId));
    }
  }, [appointments]);

  const checkReviewed = async (appointmentId) => {
    try {
      const res = await api.get(`/api/reviews/exists/${appointmentId}`);
      setReviewedMap((prev) => ({ ...prev, [appointmentId]: res.data.reviewed }));
    } catch (err) {
      console.error(err);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      if (role === "DOCTOR") {
        const doctorsRes = await api.get("/api/doctors");
        const doctor = doctorsRes.data.find(d => {
          const cleaned = d.doctorName?.toLowerCase()
            .replace(/dr\.?\s*/i, "").replace(/\s+/g, "").trim();
          const uname = username?.toLowerCase().replace(/\s+/g, "").trim();
          return cleaned === uname;
        });
        if (doctor) {
          const res = await api.get(`/api/appointments/doctor/${doctor.doctorId}`);
          setAppointments(res.data);
        } else {
          setAppointments([]);
        }
      } else if (role === "PATIENT") {
        const patientsRes = await api.get("/api/patients");
        const patient = patientsRes.data.find(p =>
          p.name?.toLowerCase().replace(/\s+/g, "").trim() ===
          username?.toLowerCase().replace(/\s+/g, "").trim()
        );
        if (patient) {
          const res = await api.get(`/api/appointments/patient/${patient.patientId}`);
          setAppointments(res.data);
        } else {
          setAppointments([]);
        }
      } else {
        const res = await getAllAppointments();
        setAppointments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await api.get("/api/patients");
      setPatients(res.data);
    } catch (err) { console.error(err); }
  };

  const loadDoctors = async () => {
    try {
      const res = await api.get("/api/doctors");
      setDoctors(res.data);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => {
    setAppointmentData({ ...appointmentData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!appointmentData.patientId || !appointmentData.doctorId ||
        !appointmentData.appointmentDate) {
      showMessage("Please fill all required fields!", "error");
      return;
    }
    const payload = {
      appointmentDate: appointmentData.appointmentDate,
      appointmentTime: appointmentData.appointmentTime,
      status: "PENDING",
      patient: { patientId: appointmentData.patientId },
      doctor: { doctorId: appointmentData.doctorId }
    };
    try {
      await addAppointment(payload);
      showMessage("Appointment booked successfully!", "success");
      setShowForm(false);
      setAppointmentData({
        appointmentDate: "", appointmentTime: "",
        status: "PENDING", patientId: "", doctorId: ""
      });
      loadAppointments();
    } catch (err) {
      showMessage("Booking failed!", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this appointment?")) return;
    try {
      await deleteAppointment(id);
      showMessage("Appointment deleted!", "success");
      loadAppointments();
    } catch (err) {
      showMessage("Delete failed!", "error");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/appointments/${id}/status?status=${status}`);
      showMessage(`Appointment ${status.toLowerCase()}!`, "success");
      loadAppointments();
    } catch (err) {
      showMessage("Status update failed!", "error");
    }
  };

  const getStatusConfig = (status) => {
    switch (status?.toUpperCase()) {
      case "BOOKED":
        return { bg: "#dbeafe", color: "#1d4ed8", label: "Confirmed" };
      case "PENDING":
        return { bg: "#fef3c7", color: "#b45309", label: "Pending" };
      case "CANCELLED":
        return { bg: "#fee2e2", color: "#dc2626", label: "Cancelled" };
      default:
        return { bg: "#f1f5f9", color: "#64748b", label: status };
    }
  };

  const filtered = appointments.filter(apt =>
    apt.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
    apt.doctor?.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
    apt.status?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.wrapper}>

      {/* ===== HEADER ===== */}
      <div style={styles.pageHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaCalendarCheck />
          </div>
          <div>
            <h1 style={styles.pageTitle}>Appointments</h1>
            <p style={styles.pageSubtitle}>
              {filtered.length} appointment{filtered.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {(role === "ADMIN" || role === "DOCTOR") && (
          <button
            style={showForm ? styles.cancelHeaderBtn : styles.addHeaderBtn}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm
              ? <><FaTimes /> Cancel</>
              : <><FaPlus /> Book Appointment</>
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
      {showForm && (role === "ADMIN" || role === "DOCTOR") && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Book New Appointment</h3>

          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Patient *</label>
              <div style={styles.inputWrapper}>
                <FaUserInjured style={styles.inputIcon} />
                <select
                  style={styles.input}
                  name="patientId"
                  value={appointmentData.patientId}
                  onChange={handleChange}
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map(p => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Select Doctor *</label>
              <div style={styles.inputWrapper}>
                <FaUserMd style={styles.inputIcon} />
                <select
                  style={styles.input}
                  name="doctorId"
                  value={appointmentData.doctorId}
                  onChange={handleChange}
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.doctorId} value={d.doctorId}>
                      {d.doctorName} - {d.specialization}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Appointment Date *</label>
              <input
                style={styles.inputPlain}
                type="date"
                name="appointmentDate"
                value={appointmentData.appointmentDate}
                onChange={handleChange}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Appointment Time</label>
              <div style={styles.inputWrapper}>
                <FaClock style={styles.inputIcon} />
                <input
                  style={styles.input}
                  type="text"
                  name="appointmentTime"
                  placeholder="e.g. 10:00 AM"
                  value={appointmentData.appointmentTime}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div style={styles.formActions}>
            <button
              style={styles.cancelBtn}
              onClick={() => setShowForm(false)}
            >
              <FaTimes /> Cancel
            </button>
            <button style={styles.saveBtn} onClick={handleSubmit}>
              <FaSave /> Save Appointment
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
          placeholder="Search by patient, doctor or status..."
          value={search}
          onChange={e => setSearch(e.target.value)}
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
            <p>Loading appointments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}><FaCalendarCheck /></div>
            <h3>No Appointments Found</h3>
            <p>{role === "DOCTOR" ? "No appointments assigned to you yet." :
                role === "PATIENT" ? "You have no appointments yet." :
                "No appointments in the system."}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>Doctor</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((apt, index) => {
                  const statusConfig = getStatusConfig(apt.status);
                  return (
                    <tr
                      key={apt.appointmentId}
                      style={styles.tr}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}
                    >
                      <td style={styles.td}>
                        <span style={styles.indexBadge}>{index + 1}</span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.personCell}>
                          <div style={{
                            ...styles.avatar,
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)"
                          }}>
                            {apt.patient?.name?.charAt(0).toUpperCase() || "P"}
                          </div>
                          <span style={styles.personName}>
                            {apt.patient?.name || "-"}
                          </span>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.personCell}>
                          <div style={{
                            ...styles.avatar,
                            background: "linear-gradient(135deg, #0ea5e9, #06b6d4)"
                          }}>
                            {apt.doctor?.doctorName?.charAt(0).toUpperCase() || "D"}
                          </div>
                          <span style={styles.personName}>
                            {apt.doctor?.doctorName || "-"}
                          </span>
                        </div>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.dateCell}>
                          <FaCalendarCheck style={{ color: "#94a3b8", fontSize: "12px" }} />
                          {apt.appointmentDate || "-"}
                        </div>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.dateCell}>
                          <FaClock style={{ color: "#94a3b8", fontSize: "12px" }} />
                          {apt.appointmentTime || "-"}
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          background: statusConfig.bg,
                          color: statusConfig.color
                        }}>
                          <span style={{
                            width: "6px", height: "6px",
                            borderRadius: "50%",
                            background: statusConfig.color,
                            display: "inline-block"
                          }} />
                          {statusConfig.label}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.actionBtns}>

                          {/* ADMIN + DOCTOR actions */}
                          {(role === "ADMIN" || role === "DOCTOR") && (
                            <>
                              {apt.status === "PENDING" && (
                                <>
                                  <button
                                    style={styles.acceptBtn}
                                    onClick={() => updateStatus(apt.appointmentId, "BOOKED")}
                                    title="Accept"
                                  >
                                    <FaCheck /> Accept
                                  </button>
                                  <button
                                    style={styles.rejectBtn}
                                    onClick={() => updateStatus(apt.appointmentId, "CANCELLED")}
                                    title="Reject"
                                  >
                                    <FaBan /> Reject
                                  </button>
                                </>
                              )}

                              {apt.status === "BOOKED" && (
                                <button
                                  style={styles.rejectBtn}
                                  onClick={() => updateStatus(apt.appointmentId, "CANCELLED")}
                                >
                                  <FaBan /> Cancel
                                </button>
                              )}

                              {apt.status === "CANCELLED" && (
                                <span style={styles.closedText}>Closed</span>
                              )}

                              <button
                                style={styles.deleteBtn}
                                onClick={() => handleDelete(apt.appointmentId)}
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}

                          {/* PATIENT view */}
                          {role === "PATIENT" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                              <span style={{
                                ...styles.statusBadge,
                                background: statusConfig.bg,
                                color: statusConfig.color
                              }}>
                                {apt.status === "BOOKED" ? "Confirmed" :
                                 apt.status === "CANCELLED" ? "Cancelled" :
                                 "Awaiting Confirmation"}
                              </span>

                              {apt.status === "BOOKED" && !reviewedMap[apt.appointmentId] && (
                                <button
                                  style={styles.rateBtn}
                                  onClick={() => setReviewModal({
                                    appointmentId: apt.appointmentId,
                                    doctorId: apt.doctor?.doctorId,
                                    doctorName: apt.doctor?.doctorName
                                  })}
                                >
                                  <FaStar /> Rate Doctor
                                </button>
                              )}

                              {apt.status === "BOOKED" && reviewedMap[apt.appointmentId] && (
                                <span style={{ fontSize: "12px", color: "#15803d", fontWeight: "600" }}>
                                  ✓ Reviewed
                                </span>
                              )}
                            </div>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reviewModal && (
        <ReviewModal
          appointmentId={reviewModal.appointmentId}
          doctorId={reviewModal.doctorId}
          doctorName={reviewModal.doctorName}
          onClose={() => setReviewModal(null)}
          onSubmitted={() =>
            setReviewedMap((prev) => ({ ...prev, [reviewModal.appointmentId]: true }))
          }
        />
      )}
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
    background: "linear-gradient(135deg, #0f766e, #14b8a6)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    color: "white",
    boxShadow: "0 4px 12px rgba(20,184,166,0.3)"
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
    background: "linear-gradient(135deg, #0f766e, #14b8a6)",
    color: "white",
    border: "none",
    padding: "11px 24px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 4px 12px rgba(20,184,166,0.3)"
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
    padding: "14px 18px",
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
  personCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
    color: "white",
    flexShrink: 0
  },
  personName: {
    fontWeight: "600",
    color: "#0f172a"
  },
  dateCell: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#475569"
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
  actionBtns: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap"
  },
  acceptBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "linear-gradient(135deg, #15803d, #16a34a)",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif"
  },
  rejectBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
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
  deleteBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "#f1f5f9",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    padding: "6px 10px",
    borderRadius: "8px",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif"
  },
  closedText: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "600"
  },
  rateBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
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
    borderTopColor: "#14b8a6",
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
    background: "linear-gradient(135deg, #ccfbf1, #99f6e4)",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    color: "#14b8a6",
    margin: "0 auto 20px"
  }
};

export default Appointments;