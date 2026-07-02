import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaHome,
  FaUserInjured,
  FaUserMd,
  FaCalendarCheck,
  FaCog,
  FaHeartbeat,
  FaBell,
  FaSignOutAlt,
  FaClock,
  FaPills,
  FaFileMedical
} from "react-icons/fa";

import api from "../api";
import "./Sidebar.css";

function Sidebar() {
  const [unreadCount, setUnreadCount] = useState(0);

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const res = await api.get(`/api/notifications/unread/${username}`);
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("patientId");
    navigate("/login");
  };

  return (
    <div className="sidebar">

      {/* Logo */}
      <div className="logo-section">
        <FaHeartbeat className="logo-icon" />
        <h2>HealthCare</h2>
      </div>

      {/* User */}
      <div className="user-info">
        <div className="user-avatar">
          {username?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="user-name">{username}</p>
          <p className="user-role">{role}</p>
        </div>
      </div>

      {/* Menu */}
      <ul className="menu">

        <li>
          <Link to="/dashboard">
            <FaHome /> Dashboard
          </Link>
        </li>

        {/* ✅ ADMIN + DOCTOR */}
        {(role === "ADMIN" || role === "DOCTOR") && (
          <>
            <li>
              <Link to="/patients">
                <FaUserInjured /> Patients
              </Link>
            </li>
            <li>
              <Link to="/doctors">
                <FaUserMd /> Doctors
              </Link>
            </li>
            <li>
              <Link to="/appointments">
                <FaCalendarCheck /> Appointments
              </Link>
            </li>
            <li>
              <Link to="/slots">
                <FaClock /> My Slots
              </Link>
            </li>
            <li>
              <Link to="/alerts">
                <FaBell /> Alerts
              </Link>
            </li>
            <li>
              <Link to="/vitals">
                <FaHeartbeat /> Vitals
              </Link>
            </li>
            <li>
              <Link to="/prescriptions">
                <FaPills /> Prescriptions
              </Link>
            </li>
            {/* ✅ My Vitals - DOCTOR section-ல இல்ல */}
          </>
        )}

        {/* ✅ PATIENT மட்டும் */}
{role === "PATIENT" && (
  <>
    <li>
      <Link to="/book-appointment">
        <FaCalendarCheck /> Book Appointment
      </Link>
    </li>
    <li>
      <Link to="/my-vitals">
        <FaHeartbeat /> My Vitals
      </Link>
    </li>
    <li>
      <Link to="/my-prescriptions">
        <FaPills /> My Prescriptions
      </Link>
    </li>
    {/* ✅ My Report -  */}
    <li>
      <Link to="/report">
        <FaFileMedical /> My Report
      </Link>
    </li>
  </>
)}

        {/* ✅ Notifications - for all users */}
        <li>
          <Link to="/notifications" style={{ position: "relative" }}>
            <FaBell /> Notifications
            {unreadCount > 0 && (
              <span style={{
                background: "#dc3545",
                color: "#fff",
                borderRadius: "50%",
                padding: "1px 6px",
                fontSize: "11px",
                fontWeight: "700",
                marginLeft: "6px"
              }}>
                {unreadCount}
              </span>
            )}
          </Link>
        </li>

        {/* ✅ ADMIN மட்டும் */}
        {role === "ADMIN" && (
          <li>
            <Link to="/settings">
              <FaCog /> Settings
            </Link>
          </li>
        )}

      </ul>

      {/* Logout */}
      <div className="logout-section">
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

    </div>
  );
}

export default Sidebar;