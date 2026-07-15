import { useEffect, useState } from "react";
import api from "../api";
import DashboardCards from "../components/DashboardCards";
import {
  FaCalendarCheck, FaArrowRight, FaHospital,
  FaClock, FaUserMd, FaUserInjured
} from "react-icons/fa";
import "../pages/Dashboard.css";
import ChatWidget from "../components/ChatWidget";

function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  const getWelcomeMessage = () => {
    if (role === "ADMIN") return `Good ${getTimeOfDay()}, Admin!`;
    if (role === "DOCTOR") return `Good ${getTimeOfDay()}, Dr. ${username}!`;
    if (role === "PATIENT") return `Good ${getTimeOfDay()}, ${username}!`;
    return "Welcome Back!";
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  const getSubtitle = () => {
    if (role === "ADMIN") return "Monitor and manage your healthcare system";
    if (role === "DOCTOR") return "View your appointments and patient vitals";
    return "Track your health and appointments";
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await api.get("/api/appointments");
      const all = res.data;

      if (role === "DOCTOR") {
        const doctorsRes = await api.get("/api/doctors");
        const doctor = doctorsRes.data.find(d => {
          const cleaned = d.doctorName?.toLowerCase()
            .replace(/dr\.?\s*/i, "").replace(/\s+/g, "").trim();
          const uname = username?.toLowerCase().replace(/\s+/g, "").trim();
          return cleaned === uname;
        });
        setAppointments(doctor
          ? all.filter(apt => apt.doctor?.doctorId === doctor.doctorId)
          : []);

      } else if (role === "PATIENT") {
        const patientsRes = await api.get("/api/patients");
        const patient = patientsRes.data.find(p =>
          p.name?.toLowerCase().replace(/\s+/g, "").trim() ===
          username?.toLowerCase().replace(/\s+/g, "").trim()
        );
        setAppointments(patient
          ? all.filter(apt => apt.patient?.patientId === patient.patientId)
          : []);

      } else {
        setAppointments(all);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const raiseEmergency = async () => {
    console.log("===== NEW SOS FUNCTION EXECUTED =====");``
  try {

    const patientId = localStorage.getItem("patientId");

    if (!patientId) {
      alert("Patient not found.");
      return;
    }

    const latestAppointment = appointments[0];

    if (!latestAppointment) {
      alert("No appointment found.");
      return;
    }

    const doctorId = latestAppointment.doctor.doctorId;

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          console.log("Latitude:", latitude);
          console.log("Longitude:", longitude);
           
          console.log(
      `/api/emergency?patientId=${patientId}&doctorId=${doctorId}&message=Emergency help needed&latitude=${latitude}&longitude=${longitude}`
    );

          await api.post(
            `/api/emergency?patientId=${patientId}&doctorId=${doctorId}&message=Emergency help needed&latitude=${latitude}&longitude=${longitude}`
          );

          alert("🚨 Emergency request sent successfully!");

        } catch (err) {
          console.error(err);
          alert("Failed to send emergency request.");
        }
      },
      (error) => {
        console.error(error);
        alert("Unable to get your current location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

  } catch (err) {
    console.error(err);
    alert("Failed to send emergency request.");
  }
};

  const getStatusConfig = (status) => {
    switch (status?.toUpperCase()) {
      case "BOOKED":
        return { label: "Booked", className: "booked", dot: "#1d4ed8" };
      case "PENDING":
        return { label: "Pending", className: "pending", dot: "#b45309" };
      case "COMPLETED":
        return { label: "Completed", className: "completed", dot: "#15803d" };
      case "CANCELLED":
        return { label: "Cancelled", className: "cancelled", dot: "#dc2626" };
      default:
        return { label: status, className: "pending", dot: "#64748b" };
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric",
    month: "long", day: "numeric"
  });

  return (
    <div className="dashboard-wrapper">

      {/* ===== WELCOME CARD ===== */}
      <div className="welcome-card">
        <div className="welcome-content">
          <div className="welcome-text">
            <div className="welcome-date">
              <FaClock />
              <span>{today}</span>
            </div>
            <h1>{getWelcomeMessage()}</h1>
            <p>{getSubtitle()}</p>
          </div>
          <div className="welcome-illustration">
            <div className="illus-circle illus-circle-1" />
            <div className="illus-circle illus-circle-2" />
            <div className="illus-circle illus-circle-3" />
            <FaHospital className="illus-icon" />
          </div>
        </div>

        {/* Quick stats row */}
        <div className="welcome-quick-stats">
          <div className="quick-stat">
            <FaCalendarCheck />
            <span>{appointments.length} Appointments</span>
          </div>
          <div className="quick-stat">
            <FaUserInjured />
            <span>
              {appointments.filter(a =>
                a.status?.toUpperCase() === "PENDING"
              ).length} Pending
            </span>
          </div>
          <div className="quick-stat">
            <FaUserMd />
            <span>
              {appointments.filter(a =>
                a.status?.toUpperCase() === "BOOKED"
              ).length} Confirmed
            </span>
          </div>
        </div>
      </div>
      

      {/* ===== SOS BUTTON ===== */}

      {role === "PATIENT" && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "25px 0"
          }}
        >
          <button
            onClick={raiseEmergency}
            style={{
              background: "#dc2626",
              color: "white",
              border: "none",
              padding: "18px 40px",
              borderRadius: "50px",
              fontSize: "22px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            🚨 SOS Emergency
          </button>

          {role === "PATIENT" && (
  <button
    onClick={() => window.location.href = "/symptom-checker"}
    style={{
      background: "#2563eb",
      color: "white",
      border: "none",
      padding: "14px 32px",
      borderRadius: "50px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer",
      marginLeft: "12px"
    }}
  >
    🩺 Check Symptoms
  </button>
)}
        </div>
      )}

      {/* ===== STATS CARDS ===== */}
      <DashboardCards />

      {/* ===== RECENT APPOINTMENTS ===== */}
      <div className="recent-section">

        <div className="section-header">
          <div className="section-title">
            <div className="section-icon">
              <FaCalendarCheck />
            </div>
            <div>
              <h2>Recent Appointments</h2>
              <p>{appointments.length} total appointments</p>
            </div>
          </div>
          <button
            className="view-all-btn"
            onClick={() => window.location.href = "/appointments"}
          >
            View All <FaArrowRight />
          </button>
        </div>

        {loading ? (
          <div className="table-loading">
            <div className="loading-spinner" />
            <p>Loading appointments...</p>
          </div>
        ) : appointments.length > 0 ? (
          <div className="table-wrapper">
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
                {appointments.slice(0, 5).map((apt) => {
                  const statusConfig = getStatusConfig(apt.status);
                  return (
                    <tr key={apt.appointmentId}>
                      <td>
                        <div className="cell-with-avatar">
                          <div className="cell-avatar patient-avatar-color">
                            {apt.patient?.name?.charAt(0).toUpperCase() || "P"}
                          </div>
                          <span>{apt.patient?.name || "-"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-with-avatar">
                          <div className="cell-avatar doctor-avatar-color">
                            {apt.doctor?.doctorName?.charAt(0).toUpperCase() || "D"}
                          </div>
                          <span>{apt.doctor?.doctorName || "-"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <FaClock className="date-icon" />
                          {apt.appointmentDate || "-"}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${statusConfig.className}`}>
                          <span
                            className="status-dot"
                            style={{ background: statusConfig.dot }}
                          />
                          {statusConfig.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FaCalendarCheck />
            </div>
            <h3>No Appointments Found</h3>
            <p>No appointments scheduled yet</p>
          </div>
        )}
      </div>
       {role === "PATIENT" && (
        <ChatWidget patientId={localStorage.getItem("patientId")} />
      )}
    </div>
  );
}

export default Dashboard;