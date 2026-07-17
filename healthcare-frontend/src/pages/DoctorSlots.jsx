import { useEffect, useState } from "react";
import api from "../api";
import {
  FaClock, FaUserMd, FaCalendarAlt, FaCalendarCheck, FaCheckCircle,
  FaBan, FaSave, FaSyncAlt, FaChevronLeft, FaChevronRight, FaTrash, FaPlus
} from "react-icons/fa";

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function DoctorSlots() {
  const [activeTab, setActiveTab] = useState("weekly"); // "weekly" | "calendar" | "list"
  const [slots, setSlots] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [weeklySchedules, setWeeklySchedules] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ doctorId: "" });

  // Calendar view state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split("T")[0]);

  // Manual single slot addition state (fallback if needed)
  const [manualSlot, setManualSlot] = useState({ slotDate: "", startTime: "", endTime: "" });

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (role === "ADMIN") {
      loadDoctors();
    } else if (role === "DOCTOR") {
      loadCurrentDoctor();
    }
  }, []);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const loadDoctors = async () => {
    try {
      const res = await api.get("/api/doctors");
      setDoctors(res.data);
    } catch (err) { console.error(err); }
  };

  const loadCurrentDoctor = async () => {
    try {
      const res = await api.get("/api/doctors");
      const doctor = res.data.find(d => {
        const cleaned = d.doctorName?.toLowerCase()
          .replace(/dr\.?\s*/i, "").replace(/\s+/g, "").trim();
        const uname = username?.toLowerCase().replace(/\s+/g, "").trim();
        return cleaned === uname;
      });
      if (doctor) {
        setFormData({ doctorId: doctor.doctorId });
        loadSchedulesAndSlots(doctor.doctorId);
      }
    } catch (err) { console.error(err); }
  };

  const loadSchedulesAndSlots = async (doctorId) => {
    if (!doctorId) return;
    setLoading(true);
    try {
      // 1. Load Weekly Schedule
      const schedRes = await api.get(`/api/schedules/doctor/${doctorId}`);
      if (schedRes.data && schedRes.data.length > 0) {
        // Merge with full 7 days order
        const merged = DAYS_OF_WEEK.map(day => {
          const found = schedRes.data.find(s => s.dayOfWeek.toUpperCase() === day);
          return found || {
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "17:00",
            slotDurationMinutes: 30,
            active: day !== "SUNDAY"
          };
        });
        setWeeklySchedules(merged);
      } else {
        // Initialize default 7-day schedule
        const defaults = DAYS_OF_WEEK.map(day => ({
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
          slotDurationMinutes: 30,
          active: day !== "SUNDAY"
        }));
        setWeeklySchedules(defaults);
      }

      // 2. Load All Slots
      const slotsRes = await api.get(`/api/slots/doctor/${doctorId}`);
      setSlots(slotsRes.data || []);
    } catch (err) {
      console.error(err);
      showMsg("Failed to load doctor data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    setFormData({ doctorId });
    if (doctorId) {
      loadSchedulesAndSlots(doctorId);
    } else {
      setSlots([]);
      setWeeklySchedules([]);
    }
  };

  const handleScheduleChange = (index, field, value) => {
    const updated = [...weeklySchedules];
    updated[index] = { ...updated[index], [field]: value };
    setWeeklySchedules(updated);
  };

  const handleSaveWeeklySchedule = async () => {
    if (!formData.doctorId) {
      showMsg("Please select a doctor first!", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/api/schedules/doctor/${formData.doctorId}`, weeklySchedules);
      await api.post(`/api/schedules/generate/${formData.doctorId}`);
      showMsg("✅ Weekly schedule configured & future slots automatically generated for next 30 days!", "success");
      loadSchedulesAndSlots(formData.doctorId);
    } catch (err) {
      console.error(err);
      showMsg("Failed to save schedule or generate slots!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleManualAddSlot = async () => {
    if (!formData.doctorId) {
      showMsg("Please select a doctor first!", "error");
      return;
    }
    if (!manualSlot.slotDate || !manualSlot.startTime || !manualSlot.endTime) {
      showMsg("Please fill all required manual slot fields!", "error");
      return;
    }
    try {
      await api.post("/api/slots", {
        doctorId: formData.doctorId,
        slotDate: manualSlot.slotDate,
        startTime: manualSlot.startTime,
        endTime: manualSlot.endTime
      });
      showMsg("Slot added manually!", "success");
      setManualSlot({ slotDate: "", startTime: "", endTime: "" });
      loadSchedulesAndSlots(formData.doctorId);
    } catch (err) {
      showMsg("Failed to add slot manually!", "error");
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Are you sure you want to delete this slot?")) return;
    try {
      await api.delete(`/api/slots/${slotId}`);
      showMsg("Slot deleted successfully!", "success");
      loadSchedulesAndSlots(formData.doctorId);
    } catch (err) {
      showMsg("Failed to delete slot!", "error");
    }
  };

  const isFormReady = role === "DOCTOR" || (role === "ADMIN" && formData.doctorId);
  const availableCount = slots.filter(s => !s.booked).length;
  const bookedCount = slots.filter(s => s.booked).length;

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

  const getSlotsForDate = (dateStr) => {
    return slots.filter(s => s.slotDate === dateStr);
  };

  const getDateStatus = (dateStr) => {
    if (dateStr < todayStr) return { color: "#cbd5e1", bg: "#f1f5f9", label: "Past Date", type: "gray" };
    const daySlots = getSlotsForDate(dateStr);
    if (daySlots.length === 0) return { color: "#94a3b8", bg: "#f8fafc", label: "No Schedule", type: "neutral" };
    const freeSlots = daySlots.filter(s => !s.booked);
    if (freeSlots.length === 0) return { color: "#dc2626", bg: "#fee2e2", label: "Fully Booked", type: "red" };
    if (freeSlots.length <= 2) return { color: "#d97706", bg: "#fef3c7", label: `Few Slots (${freeSlots.length})`, type: "yellow" };
    return { color: "#15803d", bg: "#dcfce7", label: `Available (${freeSlots.length})`, type: "green" };
  };

  return (
    <div style={styles.wrapper}>
      {/* ===== HEADER ===== */}
      <div style={styles.pageHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaCalendarAlt />
          </div>
          <div>
            <h1 style={styles.pageTitle}>Hospital-Grade Scheduling System</h1>
            <p style={styles.pageSubtitle}>
              Configure recurring weekly working hours and monitor dynamic color-coded slot calendars
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

      {/* ===== ADMIN Doctor Selector ===== */}
      {role === "ADMIN" && (
        <div style={styles.doctorSelectCard}>
          <label style={styles.selectLabel}>
            <FaUserMd style={{ color: "#35663f" }} />
            Select Doctor to Configure Working Schedule & Slots
          </label>
          <select
            value={formData.doctorId}
            onChange={handleDoctorChange}
            style={styles.doctorSelect}
          >
            <option value="">-- Choose Doctor --</option>
            {doctors.map(d => (
              <option key={d.doctorId} value={d.doctorId}>
                {d.doctorName} — ({d.specialization})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ===== TABS & SUMMARY ===== */}
      {isFormReady ? (
        <>
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
            <div style={{ ...styles.summaryCard, background: "linear-gradient(135deg, #35663f, #528b5e)" }}>
              <FaCalendarCheck style={styles.summaryIcon} />
              <div>
                <p style={styles.summaryLabel}>Total Generated Slots</p>
                <h2 style={styles.summaryCount}>{slots.length}</h2>
              </div>
            </div>
          </div>

          <div style={styles.tabHeader}>
            <button
              style={{ ...styles.tabBtn, ...(activeTab === "weekly" ? styles.activeTabBtn : {}) }}
              onClick={() => setActiveTab("weekly")}
            >
              <FaClock /> Weekly Working Schedule Config
            </button>
            <button
              style={{ ...styles.tabBtn, ...(activeTab === "calendar" ? styles.activeTabBtn : {}) }}
              onClick={() => setActiveTab("calendar")}
            >
              <FaCalendarAlt /> Monthly Color-Coded Calendar
            </button>
            <button
              style={{ ...styles.tabBtn, ...(activeTab === "list" ? styles.activeTabBtn : {}) }}
              onClick={() => setActiveTab("list")}
            >
              <FaSyncAlt /> All Slots List & Manual Overrides
            </button>
          </div>

          {/* ===== TAB 1: WEEKLY SCHEDULE CONFIG ===== */}
          {activeTab === "weekly" && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.cardTitle}>Set Weekly Working Schedule</h3>
                  <p style={styles.cardSubtitle}>
                    Configure working hours once. The backend automatically generates slots and hides past/disabled times.
                  </p>
                </div>
                <button
                  style={styles.saveBtn}
                  onClick={handleSaveWeeklySchedule}
                  disabled={loading}
                >
                  <FaSave /> {loading ? "Generating..." : "Save Schedule & Auto-Generate Slots"}
                </button>
              </div>

              <div style={styles.scheduleGrid}>
                {weeklySchedules.map((sched, idx) => (
                  <div
                    key={sched.dayOfWeek}
                    style={{
                      ...styles.dayCard,
                      border: sched.active ? "2px solid #7c3aed" : "1px solid #e2e8f0",
                      background: sched.active ? "white" : "#f8fafc",
                      opacity: sched.active ? 1 : 0.7
                    }}
                  >
                    <div style={styles.dayCardHeader}>
                      <span style={{ fontWeight: "800", color: sched.active ? "#7c3aed" : "#64748b", fontSize: "15px" }}>
                        {sched.dayOfWeek}
                      </span>
                      <label style={styles.toggleWrapper}>
                        <input
                          type="checkbox"
                          checked={sched.active}
                          onChange={(e) => handleScheduleChange(idx, "active", e.target.checked)}
                          style={{ cursor: "pointer", transform: "scale(1.2)" }}
                        />
                        <span style={{ fontSize: "13px", fontWeight: "600", color: sched.active ? "#15803d" : "#64748b" }}>
                          {sched.active ? "Active" : "Off"}
                        </span>
                      </label>
                    </div>

                    {sched.active ? (
                      <div style={styles.dayCardBody}>
                        <div style={styles.formGroupMini}>
                          <label style={styles.miniLabel}>Start Time</label>
                          <input
                            type="time"
                            value={sched.startTime}
                            onChange={(e) => handleScheduleChange(idx, "startTime", e.target.value)}
                            style={styles.inputMini}
                          />
                        </div>
                        <div style={styles.formGroupMini}>
                          <label style={styles.miniLabel}>End Time</label>
                          <input
                            type="time"
                            value={sched.endTime}
                            onChange={(e) => handleScheduleChange(idx, "endTime", e.target.value)}
                            style={styles.inputMini}
                          />
                        </div>
                        <div style={styles.formGroupMini}>
                          <label style={styles.miniLabel}>Duration</label>
                          <select
                            value={sched.slotDurationMinutes}
                            onChange={(e) => handleScheduleChange(idx, "slotDurationMinutes", Number(e.target.value))}
                            style={styles.inputMini}
                          >
                            <option value={15}>15 mins</option>
                            <option value={30}>30 mins</option>
                            <option value={60}>60 mins</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div style={styles.offNote}>Day Off / Inactive Schedule</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== TAB 2: MONTHLY COLOR-CODED CALENDAR ===== */}
          {activeTab === "calendar" && (
            <div style={styles.calendarContainer}>
              <div style={styles.calendarCard}>
                <div style={styles.calendarHeader}>
                  <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                    {monthNames[month]} {year}
                  </h3>
                  <div style={{ display: "flex", gap: "10px" }}>
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
                  <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#10b981" }}></span> Green: Available (3+ slots)</div>
                  <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#f59e0b" }}></span> Yellow: Few Slots Left (1-2)</div>
                  <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#ef4444" }}></span> Red: Fully Booked (0 slots)</div>
                  <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#94a3b8" }}></span> Gray: Past Date</div>
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

                    return (
                      <div
                        key={dateStr}
                        onClick={() => setSelectedDateStr(dateStr)}
                        style={{
                          ...styles.gridCell,
                          background: isSelected ? "#e0e7ff" : status.bg,
                          border: isSelected ? "2px solid #6366f1" : `1px solid ${status.color}`,
                          opacity: status.type === "gray" ? 0.6 : 1
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: "800", fontSize: "16px", color: "#0f172a" }}>{dayNum}</span>
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

              {/* Day Details Panel */}
              <div style={styles.dayDetailsPanel}>
                <h3 style={styles.panelTitle}>
                  Slots for {selectedDateStr}
                </h3>
                {getSlotsForDate(selectedDateStr).length === 0 ? (
                  <div style={styles.emptyPanel}>
                    No slots generated for this date. Check your Weekly Schedule config.
                  </div>
                ) : (
                  <div style={styles.timePillsGrid}>
                    {getSlotsForDate(selectedDateStr).map(slot => (
                      <div
                        key={slot.slotId}
                        style={{
                          ...styles.timePill,
                          background: slot.booked ? "#fee2e2" : "#dcfce7",
                          border: slot.booked ? "1px solid #ef4444" : "1px solid #10b981"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "700", fontSize: "14px", color: slot.booked ? "#991b1b" : "#065f46" }}>
                            <FaClock style={{ marginRight: "6px" }} />
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: slot.booked ? "#dc2626" : "#15803d" }}>
                            {slot.booked ? "🔴 Booked Out" : "🟢 Available"}
                          </span>
                        </div>
                        {!slot.booked && (
                          <button
                            style={styles.miniDeleteBtn}
                            onClick={() => handleDeleteSlot(slot.slotId)}
                            title="Delete slot"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== TAB 3: ALL SLOTS LIST & MANUAL OVERRIDE ===== */}
          {activeTab === "list" && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Manual Override / Single Slot Addition</h3>
              <p style={styles.cardSubtitle}>
                Need to add an ad-hoc slot outside your weekly recurring schedule? You can add it here.
              </p>
              <div style={styles.manualForm}>
                <input
                  type="date"
                  value={manualSlot.slotDate}
                  onChange={(e) => setManualSlot({ ...manualSlot, slotDate: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="time"
                  value={manualSlot.startTime}
                  onChange={(e) => setManualSlot({ ...manualSlot, startTime: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="time"
                  value={manualSlot.endTime}
                  onChange={(e) => setManualSlot({ ...manualSlot, endTime: e.target.value })}
                  style={styles.input}
                />
                <button style={styles.addBtn} onClick={handleManualAddSlot}>
                  <FaPlus /> Add Manual Slot
                </button>
              </div>

              <hr style={{ margin: "24px 0", border: "0.5px solid #e2e8f0" }} />

              <h3 style={styles.cardTitle}>All Generated Slots ({slots.length})</h3>
              <div style={styles.tableCard}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thead}>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Time Window</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map(slot => (
                      <tr key={slot.slotId} style={styles.tr}>
                        <td style={styles.td}>
                          <FaCalendarCheck style={{ color: "#94a3b8", marginRight: "8px" }} />
                          {slot.slotDate}
                        </td>
                        <td style={styles.td}>
                          <FaClock style={{ color: "#94a3b8", marginRight: "8px" }} />
                          {slot.startTime} - {slot.endTime}
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
                              onClick={() => handleDeleteSlot(slot.slotId)}
                            >
                              <FaTrash /> Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={styles.disabledNote}>
          <FaUserMd style={{ fontSize: "36px", color: "#94a3b8" }} />
          <h3>Please Select a Doctor Above</h3>
          <p>Choose a doctor to configure their recurring working schedule and monitor hospital slots.</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    padding: "28px 32px",
    minHeight: "100vh",
    background: "#f8fafc",
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
    fontSize: "24px",
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
    margin: "4px 0 0"
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
    fontSize: "14px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "10px"
  },
  doctorSelect: {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #cbd5e1",
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
    color: "white",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  },
  summaryIcon: { fontSize: "28px", opacity: 0.85 },
  summaryLabel: { fontSize: "13px", opacity: 0.9, margin: "0 0 4px" },
  summaryCount: { fontSize: "28px", fontWeight: "800", margin: 0 },
  tabHeader: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "12px"
  },
  tabBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  activeTabBtn: {
    background: "#7c3aed",
    color: "white",
    boxShadow: "0 4px 12px rgba(124,58,237,0.3)"
  },
  card: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0",
    marginBottom: "24px"
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "12px"
  },
  cardTitle: { fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 },
  cardSubtitle: { fontSize: "13px", color: "#64748b", margin: "4px 0 0" },
  saveBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #16a34a, #15803d)",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(22,163,74,0.3)"
  },
  scheduleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px"
  },
  dayCard: {
    borderRadius: "14px",
    padding: "16px",
    transition: "all 0.2s"
  },
  dayCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "10px"
  },
  toggleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  dayCardBody: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },
  formGroupMini: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  miniLabel: { fontSize: "12px", fontWeight: "600", color: "#475569" },
  inputMini: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    fontFamily: "'Inter', sans-serif"
  },
  offNote: {
    padding: "20px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "600"
  },
  calendarContainer: {
    display: "grid",
    gridTemplateColumns: "2.2fr 1fr",
    gap: "24px"
  },
  calendarCard: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0"
  },
  calendarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  navBtn: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
    color: "#334155"
  },
  legendBar: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    padding: "10px 14px",
    background: "#f8fafc",
    borderRadius: "10px",
    marginBottom: "16px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569"
  },
  legendItem: { display: "flex", alignItems: "center", gap: "6px" },
  legendDot: { width: "10px", height: "10px", borderRadius: "50%", display: "inline-block" },
  calendarGridHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    background: "#f1f5f9",
    borderRadius: "8px",
    padding: "8px 0",
    textAlign: "center",
    fontWeight: "700",
    fontSize: "13px",
    color: "#475569",
    marginBottom: "8px"
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px"
  },
  emptyGridCell: { minHeight: "85px", background: "#f8fafc", borderRadius: "10px" },
  gridCell: {
    minHeight: "85px",
    padding: "10px",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "transform 0.1s, box-shadow 0.1s"
  },
  todayTag: {
    background: "#6366f1",
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
    padding: "4px",
    borderRadius: "6px",
    marginTop: "6px"
  },
  dayDetailsPanel: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    maxHeight: "650px",
    overflowY: "auto"
  },
  panelTitle: { fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 16px" },
  emptyPanel: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "40px 16px",
    fontSize: "14px"
  },
  timePillsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  timePill: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderRadius: "12px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
  },
  miniDeleteBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  manualForm: {
    display: "flex",
    gap: "12px",
    marginTop: "16px",
    flexWrap: "wrap",
    alignItems: "center"
  },
  input: {
    padding: "10px 14px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif"
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "11px 20px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer"
  },
  tableCard: {
    background: "white",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #e2e8f0"
  },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f8fafc" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#64748b", borderBottom: "1px solid #e2e8f0" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#334155" },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700"
  },
  deleteBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer"
  },
  disabledNote: {
    background: "white",
    padding: "60px 24px",
    borderRadius: "16px",
    textAlign: "center",
    border: "1px dashed #cbd5e1",
    color: "#64748b"
  }
};

export default DoctorSlots;