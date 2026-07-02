import { useEffect, useState } from "react";
import api from "../api";
import DashboardCards from "../components/DashboardCards";
import "../pages/Dashboard.css";
function Dashboard() {
  const [appointments, setAppointments] = useState([]);

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  const getWelcomeMessage = () => {
    if (role === "ADMIN") return "Welcome Back, Admin 👑";
    if (role === "DOCTOR") return `Welcome, Dr. ${username} 👨‍⚕️`;
    if (role === "PATIENT") return `Welcome, ${username} 🏥`;
    return "Welcome Back!";
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await api.get("/api/appointments");
      const all = res.data;

      if (role === "DOCTOR") {
        // Doctor - own appointments மட்டும்
        const doctorsRes = await api.get("/api/doctors");
        const doctor = doctorsRes.data.find(d => {
          const cleaned = d.doctorName?.toLowerCase()
            .replace(/dr\.?\s*/i, "")
            .replace(/\s+/g, "")
            .trim();
          const uname = username?.toLowerCase().replace(/\s+/g, "").trim();
          return cleaned === uname;
        });

        if (doctor) {
          const filtered = all.filter(
            apt => apt.doctor?.doctorId === doctor.doctorId
          );
          setAppointments(filtered);
        } else {
          setAppointments([]);
        }

      } else if (role === "PATIENT") {
        // Patient - own appointments மட்டும்
        const patientsRes = await api.get("/api/patients");
        const patient = patientsRes.data.find(p =>
          p.name?.toLowerCase().replace(/\s+/g, "").trim() ===
          username?.toLowerCase().replace(/\s+/g, "").trim()
        );

        if (patient) {
          const filtered = all.filter(
            apt => apt.patient?.patientId === patient.patientId
          );
          setAppointments(filtered);
        } else {
          setAppointments([]);
        }

      } else {
        // ADMIN - எல்லாமே
        setAppointments(all);
      }

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="welcome-card">
        <h1>{getWelcomeMessage()}</h1>
        <p>Manage Patients, Doctors and Appointments efficiently.</p>
      </div>

      <DashboardCards />

      <div className="recent-section">
       <div className="section-header">
  <h2>Recent Appointments</h2>

  <button
    className="view-all-btn"
    onClick={() => window.location.href = "/appointments"}
  >
    View All
  </button>
</div>

<table className="appointment-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length > 0 ? (
              appointments.slice(0, 3).map((appointment) => (
                <tr key={appointment.appointmentId}>
                  <td>{appointment.patient?.name}</td>
                  <td>{appointment.doctor?.doctorName}</td>
                  <td>{appointment.appointmentDate}</td>
                  <td>
  <span
    className={`status-badge ${appointment.status?.toLowerCase()}`}
  >
    {appointment.status}
  </span>
</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No Appointments Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Dashboard;