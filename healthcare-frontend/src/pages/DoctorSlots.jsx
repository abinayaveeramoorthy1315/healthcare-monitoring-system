import { useEffect, useState } from "react";
import api from "../api";

function DoctorSlots() {
  const [slots, setSlots] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    doctorId: "",
    slotDate: "",
    startTime: "",
    endTime: ""
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

  const loadDoctors = async () => {
    try {
      const res = await api.get("/api/doctors");
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    }
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleDoctorChange = async (e) => {
    const doctorId = e.target.value;
    setFormData({ ...formData, doctorId });
    if (doctorId) {
      const res = await api.get(`/api/slots/doctor/${doctorId}`);
      setSlots(res.data);
    } else {
      setSlots([]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSlot = async () => {
    if (!formData.doctorId || !formData.slotDate ||
        !formData.startTime || !formData.endTime) {
      alert("required fields are missing!");
      return;
    }
    if (formData.startTime >= formData.endTime) {
      alert("End time must be after Start time!");
      return;
    }
    try {
      await api.post("/api/slots", {
        doctorId: formData.doctorId,
        slotDate: formData.slotDate,
        startTime: formData.startTime,
        endTime: formData.endTime
      });
      alert("✅ Slot Added!");
      setFormData(prev => ({ ...prev, slotDate: "", startTime: "", endTime: "" }));
      if (role === "DOCTOR") {
        loadCurrentDoctorSlots();
      } else {
        const res = await api.get(`/api/slots/doctor/${formData.doctorId}`);
        setSlots(res.data);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add slot!");
    }
  };

  const handleDelete = async (slotId) => {
    if (!window.confirm("Delete this slot?")) return;
    try {
      await api.delete(`/api/slots/${slotId}`);
      if (role === "DOCTOR") {
        loadCurrentDoctorSlots();
      } else {
        const res = await api.get(`/api/slots/doctor/${formData.doctorId}`);
        setSlots(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>🕐 Manage Availability Slots</h2>

      {/* ADMIN - Doctor select */}
      {role === "ADMIN" && (
        <div style={{ marginBottom: "20px" }}>
          <select
            name="doctorId"
            value={formData.doctorId}
            onChange={handleDoctorChange}
            style={inputStyle}
          >
            <option value="">-- Select Doctor --</option>
            {doctors.map(d => (
              <option key={d.doctorId} value={d.doctorId}>
                {d.doctorName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Add Slot Form */}
      <div style={{
        background: "#f8f9fa",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "24px",
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        alignItems: "flex-end"
      }}>
        <div>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
            Date
          </label>
          <input
            type="date"
            name="slotDate"
            value={formData.slotDate}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
            Start Time
          </label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "4px" }}>
            End Time
          </label>
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <button
          onClick={handleAddSlot}
          style={{
            background: "#1a3c5e",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          + Add Slot
        </button>
      </div>

      {/* Slots Table */}
      <table className="patient-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {slots.length > 0 ? slots.map(slot => (
            <tr key={slot.slotId}>
              <td>{slot.slotDate}</td>
              <td>{slot.startTime} - {slot.endTime}</td>
              <td>
                <span style={{
                  background: slot.booked ? "#f8d7da" : "#d4edda",
                  color: slot.booked ? "#721c24" : "#155724",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {slot.booked ? "❌ Booked" : "✅ Available"}
                </span>
              </td>
              <td>
                {!slot.booked && (
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(slot.slotId)}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", color: "#999", padding: "20px" }}>
                No Slots Added Yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const inputStyle = {
  padding: "8px 12px",
  border: "1.5px solid #ddd",
  borderRadius: "8px",
  fontSize: "14px"
};

export default DoctorSlots;