import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaHome, FaUserInjured, FaUserMd, FaCalendarCheck,
  FaCog, FaHeartbeat, FaBell, FaSignOutAlt, FaClock,
  FaPills, FaFileMedical, FaHospital, FaChevronRight,
  FaUser, FaIdCard
} from "react-icons/fa";
import api from "../api";
import "./Sidebar.css";

function Sidebar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (role === "ADMIN" || role === "DOCTOR") {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
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
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const getRoleBadgeColor = () => {
    if (role === "ADMIN") return "#d97706";
    if (role === "DOCTOR") return "#35663f";
    return "#528b5e";
  };

  const getRoleIcon = () => {
    if (role === "ADMIN") return "👑";
    if (role === "DOCTOR") return "👨‍⚕️";
    return "🏥";
  };

  const adminDoctorMenus = [
    { path: "/patients", icon: <FaUserInjured />, label: "Patients" },
    { path: "/doctors", icon: <FaUserMd />, label: "Doctors" },
    { path: "/appointments", icon: <FaCalendarCheck />, label: "Appointments" },
    { path: "/slots", icon: <FaClock />, label: "My Slots" },
    { path: "/alerts", icon: <FaBell />, label: "Alerts" },
    { path: "/vitals", icon: <FaHeartbeat />, label: "Vitals" },
    { path: "/prescriptions", icon: <FaPills />, label: "Prescriptions" },
  ];

  const patientMenus = [
    { path: "/book-appointment", icon: <FaCalendarCheck />, label: "Book Appointment" },
    { path: "/my-vitals", icon: <FaHeartbeat />, label: "My Vitals" },
    { path: "/my-prescriptions", icon: <FaPills />, label: "My Prescriptions" },
    { path: "/report", icon: <FaFileMedical />, label: "My Report" },
  ];

  return (
    <div className="sidebar">

      {/* ===== LOGO ===== */}
      <div className="sidebar-logo">
        <div className="logo-icon-wrap">
          <FaHospital />
        </div>
        <div className="logo-text">
          <h2>HealthCare</h2>
          <span>Pro System</span>
        </div>
      </div>

      {/* ===== USER INFO ===== */}
      <Link to="/profile" className="sidebar-user" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
        <div className="user-avatar">
          {username?.charAt(0).toUpperCase()}
        </div>
        <div className="user-details">
          <p className="user-name">{username}</p>
          <span
            className="user-role-badge"
            style={{ background: getRoleBadgeColor() + "22",
                     color: getRoleBadgeColor(),
                     border: `1px solid ${getRoleBadgeColor()}44` }}
          >
            {getRoleIcon()} {role}
          </span>
        </div>
      </Link>

      {/* ===== DIVIDER ===== */}
      <div className="sidebar-divider" />

      {/* ===== MENU ===== */}
      <nav className="sidebar-nav">

        {/* Dashboard - எல்லாருக்கும் */}
        <Link
          to="/dashboard"
          className={`nav-item ${isActive("/dashboard") ? "active" : ""}`}
        >
          <span className="nav-icon"><FaHome /></span>
          <span className="nav-label">Dashboard</span>
          {isActive("/dashboard") && (
            <FaChevronRight className="nav-arrow" />
          )}
        </Link>

        {/* ADMIN + DOCTOR */}
        {(role === "ADMIN" || role === "DOCTOR") && (
          <>
            <p className="nav-section-title">MANAGEMENT</p>
            {adminDoctorMenus.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.path === "/alerts" && unreadCount > 0 && (
                  <span className="nav-badge">{unreadCount}</span>
                )}
                {isActive(item.path) && (
                  <FaChevronRight className="nav-arrow" />
                )}
              </Link>
            ))}
          </>
        )}

        {/* PATIENT */}
        {role === "PATIENT" && (
          <>
            <p className="nav-section-title">MY HEALTH</p>
            {patientMenus.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {isActive(item.path) && (
                  <FaChevronRight className="nav-arrow" />
                )}
              </Link>
            ))}
          </>
        )}

        {/* Notifications & Profile */}
        <p className="nav-section-title">GENERAL</p>
        <Link
          to="/profile"
          className={`nav-item ${isActive("/profile") ? "active" : ""}`}
        >
          <span className="nav-icon">{role === "PATIENT" ? <FaIdCard /> : <FaUser />}</span>
          <span className="nav-label">{role === "PATIENT" ? "Health Passport" : "My Profile"}</span>
          {isActive("/profile") && (
            <FaChevronRight className="nav-arrow" />
          )}
        </Link>
        <Link
          to="/notifications"
          className={`nav-item ${isActive("/notifications") ? "active" : ""}`}
        >
          <span className="nav-icon"><FaBell /></span>
          <span className="nav-label">Notifications</span>
          {unreadCount > 0 && (
            <span className="nav-badge">{unreadCount}</span>
          )}
        </Link>

        {/* ADMIN Settings */}
        {role === "ADMIN" && (
          <Link
            to="/settings"
            className={`nav-item ${isActive("/settings") ? "active" : ""}`}
          >
            <span className="nav-icon"><FaCog /></span>
            <span className="nav-label">Settings</span>
          </Link>
        )}

      </nav>

      {/* ===== LOGOUT ===== */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );
}

export default Sidebar;