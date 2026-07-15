import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import {
  FaUserInjured, FaUserMd, FaCalendarCheck,
  FaHeartbeat, FaBell, FaPills, FaArrowRight,
  FaExclamationTriangle,FaLungs, FaThermometerHalf
} from "react-icons/fa";

function DashboardCards() {
  const [patientCount, setPatientCount] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [patientVitals, setPatientVitals] = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      if (role === "ADMIN" || role === "DOCTOR") {
        const [patients, doctors, appointments] = await Promise.all([
          api.get("/api/patients"),
          api.get("/api/doctors"),
          api.get("/api/appointments")
        ]);
        setPatientCount(patients.data.length);
        setDoctorCount(doctors.data.length);
        setAppointmentCount(appointments.data.length);
      }

      if (role === "PATIENT") {
        const patientsRes = await api.get("/api/patients");
        const patient = patientsRes.data.find(p =>
          p.name?.toLowerCase().replace(/\s+/g, "").trim() ===
          username?.toLowerCase().replace(/\s+/g, "").trim()
        );

        if (patient) {
          try {
            const vitalsRes = await api.get(
              `/api/vitalsigns/patient/${patient.patientId}`
            );
            if (vitalsRes.data.length > 0) {
              setPatientVitals(vitalsRes.data[vitalsRes.data.length - 1]);
            }
          } catch (err) { console.error(err); }

          try {
            const alertsRes = await api.get("/api/alerts");
            const myAlerts = alertsRes.data.filter(
              a => a.patient?.patientId === patient.patientId
            );
            setAlertCount(myAlerts.length);
          } catch (err) { console.error(err); }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /* ===== PATIENT DASHBOARD ===== */
  if (role === "PATIENT") {
    return (
      <div className="card-container">

        {/* Book Appointment */}
        <div
          className="dashboard-card card-blue"
          onClick={() => navigate("/book-appointment")}
        >
          <div className="card-top">
            <FaCalendarCheck className="card-icon" />
          </div>
          <h3>Book Appointment</h3>
          <p>Schedule a consultation with your preferred doctor</p>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "16px",
            fontSize: "13px",
            fontWeight: "600",
            opacity: 0.9
          }}>
            Book Now <FaArrowRight style={{ fontSize: "11px" }} />
          </div>
        </div>

        {/* Vitals */}
        <div
          className="dashboard-card card-pink"
          onClick={() => navigate("/my-vitals")}
        >
          <div className="card-top">
            <FaHeartbeat className="card-icon" />
          </div>
          <h3>My Vitals</h3>
          {patientVitals ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
             <p><FaHeartbeat style={{color:"rgba(255,255,255,0.8)", marginRight:"6px"}}/>
  Heart Rate: <strong>{patientVitals.heartRate} bpm</strong></p>
<p><FaLungs style={{color:"rgba(255,255,255,0.8)", marginRight:"6px"}}/>
  Oxygen: <strong>{patientVitals.oxygenLevel}%</strong></p>
<p><FaThermometerHalf style={{color:"rgba(255,255,255,0.8)", marginRight:"6px"}}/>
  Temp: <strong>{patientVitals.temperature}°C</strong></p>
              <small style={{ marginTop: "8px", opacity: 0.8 }}>
                View full history →
              </small>
            </div>
          ) : (
            <p style={{ opacity: 0.75 }}>No vitals recorded yet</p>
          )}
        </div>

        {/* Prescriptions */}
        <div
          className="dashboard-card card-orange"
          onClick={() => navigate("/my-prescriptions")}
        >
          <div className="card-top">
            <FaPills className="card-icon" />
          </div>
          <h3>My Prescriptions</h3>
          <p>Access and review your prescribed medicines</p>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "16px",
            fontSize: "13px",
            fontWeight: "600",
            opacity: 0.9
          }}>
            View All <FaArrowRight style={{ fontSize: "11px" }} />
          </div>
        </div>

        {/* Alerts */}
        <div className="dashboard-card card-yellow">
          <div className="card-top">
            <FaBell className="card-icon" />
          </div>
          <h3>Health Alerts</h3>
          {alertCount > 0 ? (
            <>
              <h2>{alertCount}</h2>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "8px",
                fontSize: "13px",
                opacity: 0.85
              }}>
                <FaExclamationTriangle />
                Active alerts
              </div>
            </>
          ) : (
            <p style={{ opacity: 0.75 }}>No active alerts 🎉</p>
          )}
        </div>

      </div>
    );
  }

  /* ===== ADMIN / DOCTOR DASHBOARD ===== */
  return (
    <div className="card-container">

      {/* Total Patients */}
      <div
        className="dashboard-card card-blue"
        onClick={() => navigate("/patients")}
      >
        <div className="card-top">
          <FaUserInjured className="card-icon" />
        </div>
        <h3>Total Patients</h3>
        <h2>{loading ? "..." : patientCount}</h2>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "12px",
          fontSize: "12px",
          opacity: 0.8
        }}>
          View all patients <FaArrowRight style={{ fontSize: "10px" }} />
        </div>
      </div>

      {/* Total Doctors */}
      <div
        className="dashboard-card card-pink"
        onClick={() => navigate("/doctors")}
      >
        <div className="card-top">
          <FaUserMd className="card-icon" />
        </div>
        <h3>Total Doctors</h3>
        <h2>{loading ? "..." : doctorCount}</h2>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "12px",
          fontSize: "12px",
          opacity: 0.8
        }}>
          View all doctors <FaArrowRight style={{ fontSize: "10px" }} />
        </div>
      </div>

      {/* Total Appointments */}
      <div
        className="dashboard-card card-orange"
        onClick={() => navigate("/appointments")}
      >
        <div className="card-top">
          <FaCalendarCheck className="card-icon" />
        </div>
        <h3>Total Appointments</h3>
        <h2>{loading ? "..." : appointmentCount}</h2>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "12px",
          fontSize: "12px",
          opacity: 0.8
        }}>
          View appointments <FaArrowRight style={{ fontSize: "10px" }} />
        </div>
      </div>

    </div>
  );
}

export default DashboardCards;