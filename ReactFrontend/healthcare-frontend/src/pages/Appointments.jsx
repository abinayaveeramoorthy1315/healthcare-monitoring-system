import { useEffect, useState } from "react";
import api from "../api";
import {
  getAllAppointments,
  addAppointment,
  deleteAppointment
} from "../services/appointmentService";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    appointmentDate: "",
    appointmentTime: "",
    status: "PENDING",
    patientId: "",
    doctorId: ""
  });

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  useEffect(() => {
    loadAppointments();
    if (role === "ADMIN" || role === "DOCTOR") {
      loadPatients();
      loadDoctors();
    }
  }, []);

  const loadAppointments = async () => {
    try {
      if (role === "DOCTOR") {
        const doctorsRes = await api.get("/api/doctors");

        console.log("=== DEBUG ===");
        console.log("Username:", username);
        console.log("All doctors:", doctorsRes.data);

        const doctor = doctorsRes.data.find(d => {
          const cleaned = d.doctorName?.toLowerCase()
            .replace(/dr\.?\s*/i, "")
            .replace(/\s+/g, "")
            .trim();
          const uname = username?.toLowerCase().replace(/\s+/g, "").trim();
          console.log(`Comparing: "${cleaned}" === "${uname}" →`, cleaned === uname);
          return cleaned === uname;
        });

        console.log("Matched doctor:", doctor);

        if (doctor) {
          const res = await api.get(`/api/appointments/doctor/${doctor.doctorId}`);
          console.log("Appointments response:", res.data);
          setAppointments(res.data);
        } else {
          console.warn("❌ No doctor matched!");
          setAppointments([]);
        }

      } else if (role === "PATIENT") {
        const patientsRes = await api.get("/api/patients");

        console.log("=== PATIENT DEBUG ===");
        console.log("Username:", username);
        console.log("All patients:", patientsRes.data);

        const patient = patientsRes.data.find(p => {
          const cleaned = p.name?.toLowerCase().replace(/\s+/g, "").trim();
          const uname = username?.toLowerCase().replace(/\s+/g, "").trim();
          console.log(`Comparing: "${cleaned}" === "${uname}" →`, cleaned === uname);
          return cleaned === uname;
        });

        console.log("Matched patient:", patient);

        if (patient) {
          const res = await api.get(`/api/appointments/patient/${patient.patientId}`);
          console.log("Appointments response:", res.data);
          setAppointments(res.data);
        } else {
          console.warn("❌ No patient matched!");
          setAppointments([]);
        }

      } else {
        const response = await getAllAppointments();
        setAppointments(response.data);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await api.get("/api/patients");
      setPatients(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await api.get("/api/doctors");
      setDoctors(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setAppointmentData({
      ...appointmentData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    const payload = {
      appointmentDate: appointmentData.appointmentDate,
      appointmentTime: appointmentData.appointmentTime,
      status: "PENDING",
      patient: { patientId: appointmentData.patientId },
      doctor: { doctorId: appointmentData.doctorId }
    };
    try {
      await addAppointment(payload);
      alert("Appointment Booked Successfully");
      setShowForm(false);
      loadAppointments();
    } catch (err) {
      console.error(err);
      alert("Failed!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete Appointment?")) return;
    try {
      await deleteAppointment(id);
      loadAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/appointments/${id}/status?status=${status}`);
      alert(`Appointment ${status}!`);
      loadAppointments();
    } catch (err) {
      console.error(err);
      alert("Failed to update!");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "BOOKED":    return { background: "#d4edda", color: "#155724" };
      case "PENDING":   return { background: "#fff3cd", color: "#856404" };
      case "CANCELLED": return { background: "#f8d7da", color: "#721c24" };
      default:          return { background: "#e2e3e5", color: "#383d41" };
    }
  };

  return (
    <div>
      <h2>📅 Appointments Management</h2>

      {(role === "ADMIN" || role === "DOCTOR") && (
        <div className="patient-header">
          <button className="add-btn" onClick={() => setShowForm(!showForm)}>
            + Book Appointment
          </button>
        </div>
      )}

      {showForm && (
        <div className="patient-form">
          <h3>Book Appointment</h3>

          <select name="patientId" value={appointmentData.patientId} onChange={handleChange}>
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.patientId} value={p.patientId}>{p.name}</option>
            ))}
          </select>

          <select name="doctorId" value={appointmentData.doctorId} onChange={handleChange}>
            <option value="">Select Doctor</option>
            {doctors.map((d) => (
              <option key={d.doctorId} value={d.doctorId}>{d.doctorName}</option>
            ))}
          </select>

          <input
            type="date"
            name="appointmentDate"
            value={appointmentData.appointmentDate}
            onChange={handleChange}
          />

          <input
            type="text"
            name="appointmentTime"
            placeholder="10:00 AM"
            value={appointmentData.appointmentTime}
            onChange={handleChange}
          />

          <button className="save-btn" onClick={handleSubmit}>
            Save Appointment
          </button>
        </div>
      )}

      <table className="patient-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length > 0 ? (
            appointments.map((apt) => (
              <tr key={apt.appointmentId}>
                <td>{apt.appointmentId}</td>
                <td>{apt.patient?.name || "-"}</td>
                <td>{apt.doctor?.doctorName || "-"}</td>
                <td>{apt.appointmentDate}</td>
                <td>{apt.appointmentTime}</td>
                <td>
                  <span style={{
                    ...getStatusStyle(apt.status),
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    {apt.status}
                  </span>
                </td>
                <td>
                  {(role === "ADMIN" || role === "DOCTOR") && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>

                      {apt.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => updateStatus(apt.appointmentId, "BOOKED")}
                            style={{
                              background: "#28a745", color: "white", border: "none",
                              padding: "5px 10px", borderRadius: "6px",
                              cursor: "pointer", fontSize: "12px"
                            }}
                          >
                            ✅ Accept
                          </button>
                          <button
                            onClick={() => updateStatus(apt.appointmentId, "CANCELLED")}
                            style={{
                              background: "#dc3545", color: "white", border: "none",
                              padding: "5px 10px", borderRadius: "6px",
                              cursor: "pointer", fontSize: "12px"
                            }}
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}

                      {apt.status === "BOOKED" && (
                        <>
                          <span style={{ color: "#28a745", fontWeight: "600", fontSize: "12px" }}>
                            ✅ Accepted
                          </span>
                          <button
                            onClick={() => updateStatus(apt.appointmentId, "CANCELLED")}
                            style={{
                              background: "#dc3545", color: "white", border: "none",
                              padding: "5px 10px", borderRadius: "6px",
                              cursor: "pointer", fontSize: "12px"
                            }}
                          >
                            ❌ Cancel
                          </button>
                        </>
                      )}

                      {apt.status === "CANCELLED" && (
                        <span style={{ color: "#dc3545", fontWeight: "600", fontSize: "12px" }}>
                          ❌ Cancelled
                        </span>
                      )}

                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(apt.appointmentId)}
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {role === "PATIENT" && (
                    <span style={{ color: "#666", fontSize: "13px" }}>
                      {apt.status === "BOOKED" ? "✅ Confirmed" :
                       apt.status === "CANCELLED" ? "❌ Cancelled" :
                       "⏳ Waiting"}
                    </span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                {role === "DOCTOR" ? "NO Appointments!" :
                 role === "PATIENT" ? "NO Appointments Booked!" :
                 "No Appointments Found"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Appointments;