import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

import {
  FaUserInjured,
  FaUserMd,
  FaCalendarCheck,
  FaHeartbeat,
  FaBell,
  FaPills
} from "react-icons/fa";

function DashboardCards() {
  const [patientCount, setPatientCount] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [patientVitals, setPatientVitals] = useState(null);
  const [alertCount, setAlertCount] = useState(0);

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  const navigate = useNavigate();

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      if (role === "ADMIN" || role === "DOCTOR") {
        const patients = await api.get("/api/patients");
        const doctors = await api.get("/api/doctors");
        const appointments = await api.get("/api/appointments");

        setPatientCount(patients.data.length);
        setDoctorCount(doctors.data.length);
        setAppointmentCount(appointments.data.length);
      }

      if (role === "PATIENT") {
        const patientsRes = await api.get("/api/patients");

        const patient = patientsRes.data.find(
          (p) =>
            p.name?.toLowerCase().replace(/\s+/g, "").trim() ===
            username?.toLowerCase().replace(/\s+/g, "").trim()
        );

        if (patient) {
          try {
            const vitalsRes = await api.get(
              `/api/vitalsigns/patient/${patient.patientId}`
            );

            if (vitalsRes.data.length > 0) {
              const latest =
                vitalsRes.data[vitalsRes.data.length - 1];

              setPatientVitals(latest);
            }
          } catch (err) {
            console.error(err);
          }

          try {
            const alertsRes = await api.get("/api/alerts");

            const myAlerts = alertsRes.data.filter(
              (a) => a.patient?.patientId === patient.patientId
            );

            setAlertCount(myAlerts.length);
          } catch (err) {
            console.error(err);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  /* =========================
     PATIENT DASHBOARD
  ========================== */

  if (role === "PATIENT") {
    return (
      <div className="card-container">

        <div
          className="dashboard-card card-blue"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/book-appointment")}
        >
          <div className="card-top">
            <FaCalendarCheck className="card-icon" />
          </div>

          <h3>Book Appointment</h3>

          <p>
            Schedule a consultation with your doctor.
          </p>

          <button
            className="add-btn"
            style={{ marginTop: "15px" }}
          >
            + Book Now
          </button>
        </div>

        <div
          className="dashboard-card card-pink"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/my-vitals")}
        >
          <div className="card-top">
            <FaHeartbeat className="card-icon" />
          </div>

          <h3>Your Vitals</h3>

          {patientVitals ? (
            <>
              <p>
                ❤️ Heart Rate :
                <strong>
                  {" "}
                  {patientVitals.heartRate} bpm
                </strong>
              </p>

              <p>
                🫁 Oxygen :
                <strong>
                  {" "}
                  {patientVitals.oxygenLevel}%
                </strong>
              </p>

              <p>
                🌡 Temperature :
                <strong>
                  {" "}
                  {patientVitals.temperature}°C
                </strong>
              </p>

              <small>
                View complete history →
              </small>
            </>
          ) : (
            <p>No vitals recorded yet</p>
          )}
        </div>

        <div
          className="dashboard-card card-orange"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/my-prescriptions")}
        >
          <div className="card-top">
            <FaPills className="card-icon" />
          </div>

          <h3>My Prescriptions</h3>

          <p>
            Access and review prescribed medicines.
          </p>

          <small>
            View prescriptions →
          </small>
        </div>

        <div className="dashboard-card card-yellow">
          <div className="card-top">
            <FaBell className="card-icon" />
          </div>

          <h3>Your Alerts</h3>

          {alertCount > 0 ? (
            <h2>{alertCount}</h2>
          ) : (
            <p>No active alerts</p>
          )}
        </div>

      </div>
    );
  }

  /* =========================
     ADMIN / DOCTOR DASHBOARD
  ========================== */

  return (
    <div className="card-container">

      <div className="dashboard-card card-blue">
        <div className="card-top">
          <FaUserInjured className="card-icon" />
        </div>

        <h3>Total Patients</h3>

        <h2>{patientCount}</h2>
      </div>

      <div className="dashboard-card card-pink">
        <div className="card-top">
          <FaUserMd className="card-icon" />
        </div>

        <h3>Total Doctors</h3>

        <h2>{doctorCount}</h2>
      </div>

      <div className="dashboard-card card-orange">
        <div className="card-top">
          <FaCalendarCheck className="card-icon" />
        </div>

        <h3>Total Appointments</h3>

        <h2>{appointmentCount}</h2>
      </div>

    </div>
  );
}

export default DashboardCards;