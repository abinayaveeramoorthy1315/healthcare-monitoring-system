import { useEffect, useState } from "react";
import api from "../api";
import DashboardCards from "../components/DashboardCards";
import {
  FaCalendarCheck, FaArrowRight, FaHospital,
  FaClock, FaUserMd, FaUserInjured
} from "react-icons/fa";
import "./Dashboard.css";
import ChatWidget from "../components/ChatWidget";
import LiveTracking from "../components/LiveTracking";
import { FaMapMarkedAlt, FaAmbulance, FaTrash, FaCheckCircle } from "react-icons/fa";

function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAiAlert, setShowAiAlert] = useState(false);
  const [doctorId, setDoctorId] = useState(null);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [emergencyRequests, setEmergencyRequests] = useState([]);

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
    loadEmergencies();
    
    // Auto-refresh emergencies every 5 seconds for live status updates
    const interval = setInterval(loadEmergencies, 5000);

    // Check for AI Risk on mount and listen for changes
    const checkRisk = () => {
      const risk = localStorage.getItem('latestAiRisk');
      if (risk === 'HIGH' || risk === 'CRITICAL') {
        setShowAiAlert(true);
        localStorage.removeItem('latestAiRisk'); // Show once per trigger
      }
    };
    checkRisk();
    window.addEventListener('storage', checkRisk);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkRisk);
    };
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
        if (doctor) {
            setDoctorId(doctor.doctorId);
            setAppointments(all.filter(apt => apt.doctor?.doctorId === doctor.doctorId));
        } else {
            setAppointments([]);
        }

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

  const loadEmergencies = async () => {
    try {
      if (role === "PATIENT") {
        const res = await api.get(`/api/emergency/patient/${username}`);
        if (res.data && res.data.length > 0) {
          const latest = res.data[res.data.length - 1];
          if (latest.status !== "COMPLETED" && latest.status !== "RESOLVED") {
            setActiveEmergency(latest);
          }
        }
      } else if (role === "DOCTOR") {
        try {
          const assignedRes = await api.get(`/api/emergency/assigned/${username}`);
          if (assignedRes.data && assignedRes.data.length > 0) {
            setEmergencyRequests(assignedRes.data);
            return;
          }
        } catch (e) {
          console.warn("Assigned fetch check:", e);
        }
        const doctorsRes = await api.get("/api/doctors");
        const doctor = doctorsRes.data.find(d => {
          const cleaned = d.doctorName?.toLowerCase()
            .replace(/dr\.?\s*/i, "").replace(/\s+/g, "").trim();
          const uname = username?.toLowerCase().replace(/\s+/g, "").trim();
          return cleaned === uname;
        });
        if (doctor) {
          const res = await api.get(`/api/emergency/doctor/${doctor.doctorName}`);
          setEmergencyRequests(res.data || []);
        }
      } else if (role === "ADMIN") {
        const res = await api.get("/api/emergency");
        setEmergencyRequests(res.data || []);
      }
    } catch (err) {
      console.error("Error loading emergencies:", err);
    }
  };

  const raiseEmergency = async () => {
    console.log("===== NEW SOS FUNCTION EXECUTED =====");
    try {
      const patientId = localStorage.getItem("patientId");

      if (!patientId) {
        alert("Patient not found. Please log out and log in again.");
        return;
      }

      const doctorId = appointments[0]?.doctor?.doctorId || "";

      if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            console.log("Latitude:", latitude, "Longitude:", longitude);
            const queryUrl = `/api/emergency?patientId=${patientId}${doctorId ? `&doctorId=${doctorId}` : ""}&message=Emergency SOS Triggered&latitude=${latitude}&longitude=${longitude}`;
            console.log("Posting SOS:", queryUrl);

            const res = await api.post(queryUrl);

            if (res.data) {
              setActiveEmergency(res.data);
            }

            alert("🚨 Emergency request sent successfully! Targeted doctor alerted & ambulance dispatched.");
            loadEmergencies();
          } catch (err) {
            console.error(err);
            alert("Failed to send emergency request.");
          }
        },
        (error) => {
          console.error(error);
          alert("Unable to get your current location. Using default hospital coordinates.");
          // Fallback if GPS blocked
          api.post(`/api/emergency?patientId=${patientId}${doctorId ? `&doctorId=${doctorId}` : ""}&message=Emergency SOS (GPS Blocked)&latitude=18.5204&longitude=73.8567`)
             .then(res => {
               if (res.data) setActiveEmergency(res.data);
               alert("🚨 Emergency request sent! Targeted doctor alerted.");
               loadEmergencies();
             })
             .catch(e => alert("Failed to send emergency request."));
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
      

      {/* ===== PATIENT ACTION ROW ===== */}
      {role === "PATIENT" && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "16px",
          margin: "28px 0",
          flexWrap: "wrap"
        }}>
          <button
            onClick={raiseEmergency}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "linear-gradient(135deg, #b91c1c, #dc2626)",
              color: "white", border: "none",
              padding: "16px 36px", borderRadius: "99px",
              fontSize: "17px", fontWeight: "800", cursor: "pointer",
              boxShadow: "0 8px 24px rgba(220,38,38,.45)",
              fontFamily: "'Inter', sans-serif", letterSpacing: ".2px",
              transition: "all .25s ease"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 14px 32px rgba(220,38,38,.55)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(220,38,38,.45)"; }}
          >
            🚨 SOS Emergency
          </button>
          {activeEmergency && (
            <button
              onClick={() => setActiveEmergency(activeEmergency)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                color: "white", border: "none",
                padding: "16px 36px", borderRadius: "99px",
                fontSize: "16px", fontWeight: "800", cursor: "pointer",
                boxShadow: "0 8px 24px rgba(22,163,74,.45)",
                fontFamily: "'Inter', sans-serif", letterSpacing: ".2px",
                transition: "all .25s ease"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 14px 32px rgba(22,163,74,.55)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(22,163,74,.45)"; }}
            >
              🚑 Track Active Ambulance
            </button>
          )}
          <button
            onClick={() => window.location.href = "/symptom-checker"}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "linear-gradient(135deg, #35663f, #528b5e)",
              color: "white", border: "none",
              padding: "16px 36px", borderRadius: "99px",
              fontSize: "16px", fontWeight: "700", cursor: "pointer",
              boxShadow: "0 8px 24px rgba(82,139,94,.35)",
              fontFamily: "'Outfit', sans-serif", letterSpacing: ".2px",
              transition: "all .25s ease"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 14px 32px rgba(82,139,94,.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(82,139,94,.35)"; }}
          >
            🩺 Check Symptoms
          </button>
    <button
    onClick={() => window.location.href = "/skin-checker"}
    style={{
      display: "flex", alignItems: "center", gap: "8px",
      background: "linear-gradient(135deg, #7c3aed, #a855f7)",
      color: "white", border: "none",
      padding: "16px 36px", borderRadius: "99px",
      fontSize: "16px", fontWeight: "700", cursor: "pointer",
      boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
      fontFamily: "'Inter', sans-serif",
      transition: "all .25s ease"
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
  >
    📸 Skin Checker
  </button>
  <button
    onClick={() => window.location.href = "/ai-prediction"}
    style={{
      display: "flex", alignItems: "center", gap: "8px",
      background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
      color: "white", border: "none",
      padding: "16px 36px", borderRadius: "99px",
      fontSize: "16px", fontWeight: "700", cursor: "pointer",
      boxShadow: "0 8px 24px rgba(14,165,233,0.35)",
      fontFamily: "'Inter', sans-serif",
      transition: "all .25s ease"
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
  >
    🤖 AI Health Risk
  </button>
        </div>
      )}

      {/* AI Emergency Alert Popup */}
      {showAiAlert && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', padding: '30px', borderRadius: '12px',
            maxWidth: '500px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ color: '#dc2626', marginBottom: '15px' }}>⚠️ Critical Health Risk Detected</h2>
            <p style={{ fontSize: '16px', marginBottom: '25px', color: '#4b5563' }}>
              Our AI has detected a HIGH or CRITICAL health risk based on your latest vital signs. 
              We strongly recommend seeking immediate medical attention or triggering an emergency SOS.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowAiAlert(false)} 
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
              >
                Dismiss
              </button>
              <button 
                onClick={() => { setShowAiAlert(false); raiseEmergency(); }} 
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🚨 Trigger SOS Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== LIVE AMBULANCE TRACKING (PATIENT VIEW) ===== */}
      {role === "PATIENT" && activeEmergency && (
        <LiveTracking emergencyRequest={activeEmergency} onClose={() => setActiveEmergency(null)} />
      )}

      {/* ===== EMERGENCY & AMBULANCE DISPATCH CARDS (DOCTOR & ADMIN VIEW) ===== */}
      {(role === "DOCTOR" || role === "ADMIN") && emergencyRequests.length > 0 && (
        <div className="recent-section" style={{ marginTop: '25px', marginBottom: '25px' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-title">
              <div className="section-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                🚨
              </div>
              <div>
                <h2>Active Emergency Requests & Dispatch</h2>
                <p>{emergencyRequests.length} emergency requests requiring attention</p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (window.confirm("Are you sure you want to clear and dismiss all active emergency notifications?")) {
                  try {
                    if (role === "DOCTOR" && username) {
                      await api.delete(`/api/emergency/doctor/${username}/clear`);
                    } else {
                      await api.delete(`/api/emergency/clear-all`);
                    }
                    setEmergencyRequests([]);
                  } catch (err) {
                    console.error("Failed to clear requests", err);
                    alert("Could not clear emergency requests.");
                  }
                }
              }}
              style={{
                background: '#991b1b', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px',
                fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
                boxShadow: '0 2px 8px rgba(153, 27, 27, 0.3)'
              }}
            >
              <FaTrash /> Clear All Notifications
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', padding: '15px 0' }}>
            {emergencyRequests.map((req) => {
              const reqStatus = req.emergencyStatus || req.status || 'PENDING';
              const isAccepted = reqStatus.toUpperCase() === 'ACCEPTED';
              const isArrived = reqStatus.toUpperCase() === 'ARRIVED';
              const isRejected = reqStatus.toUpperCase() === 'REJECTED';

              return (
              <div key={req.id} style={{
                background: isAccepted ? '#ecfdf5' : isRejected ? '#fef2f2' : '#fff1f2',
                border: `2px solid ${isAccepted ? '#10b981' : isRejected ? '#ef4444' : '#e11d48'}`,
                borderRadius: '16px', padding: '22px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ 
                        background: isAccepted ? '#10b981' : '#e11d48', 
                        color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' 
                      }}>
                        🚨 SOS #{req.id} ({req.emergencySeverity || 'HIGH'})
                      </span>
                    </div>
                    <span style={{ 
                      fontSize: '12px', fontWeight: '800', padding: '4px 10px', borderRadius: '8px',
                      background: isAccepted ? '#d1fae5' : isArrived ? '#edf7ed' : '#ffe4e6',
                      color: isAccepted ? '#065f46' : isArrived ? '#35663f' : '#9f1239'
                    }}>
                      {reqStatus}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '18px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Patient: <strong>{req.patientName || `Patient #${req.patientId}`}</strong></span>
                    {req.doctorName && <small style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}>Dr. {req.doctorName}</small>}
                  </h3>

                  <p style={{ margin: '0 0 14px 0', color: '#334155', fontSize: '14px', background: 'white', padding: '12px', borderRadius: '10px', borderLeft: `4px solid ${isAccepted ? '#10b981' : '#e11d48'}`, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                    <strong>Details:</strong> {req.emergencyMessage || 'Immediate emergency medical assistance requested.'}
                  </p>

                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '10px' }}>
                    <div>📍 <strong>GPS:</strong> {(req.latitude || req.liveLatitude || 18.5204).toFixed(3)}, {(req.longitude || req.liveLongitude || 73.8567).toFixed(3)}</div>
                    <div>⏱️ <strong>ETA:</strong> ~{req.eta || 8} Mins</div>
                    <div>🚑 <strong>Ambulance:</strong> {req.ambulanceStatus || 'DISPATCHED'}</div>
                    <div>📞 <strong>Driver:</strong> {req.ambulanceDriver || 'Team #108'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  {/* DOCTOR ACTION BUTTONS */}
                  {role === "DOCTOR" && !isAccepted && !isArrived && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={async () => {
                          try {
                            await api.post(`/api/emergency/${req.id}/accept?username=${username}`);
                            alert(`✅ You have ACCEPTED SOS #${req.id}. Patient and ambulance team notified!`);
                            loadEmergencies();
                          } catch (err) {
                            console.error(err);
                            alert("Failed to accept emergency request.");
                          }
                        }}
                        style={{
                          flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '10px',
                          fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        ✅ Accept Emergency
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm("Are you sure you want to reject this emergency? It will immediately escalate to the next available specialist doctor.")) {
                            try {
                              await api.post(`/api/emergency/${req.id}/reject?username=${username}`);
                              alert(`⚠️ SOS #${req.id} escalated to next on-duty specialist.`);
                              loadEmergencies();
                            } catch (err) {
                              console.error(err);
                              alert("Failed to escalate request.");
                            }
                          }
                        }}
                        style={{
                          background: '#ef4444', color: 'white', border: 'none', padding: '12px 16px', borderRadius: '10px',
                          fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        ❌ Escalate
                      </button>
                    </div>
                  )}

                  {role === "DOCTOR" && isAccepted && !isArrived && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={async () => {
                          try {
                            await api.post(`/api/emergency/${req.id}/arrived`);
                            alert(`🚨 Marked ARRIVED at patient location!`);
                            loadEmergencies();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        style={{
                          flex: 1, background: '#35663f', color: 'white', border: 'none', padding: '12px', borderRadius: '10px',
                          fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        🏥 Mark Arrived
                      </button>
                    </div>
                  )}

                  {/* NAVIGATION & DISMISS ROW */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => window.open(req.locationLink || `https://www.google.com/maps?q=${req.latitude || req.liveLatitude || 18.5204},${req.longitude || req.liveLongitude || 73.8567}`, '_blank')}
                      style={{
                        flex: 1, minWidth: '130px', background: '#e11d48', color: 'white', border: 'none', padding: '10px', borderRadius: '8px',
                        fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <FaMapMarkedAlt /> Open Live Location
                    </button>

                    {role === "ADMIN" && (
                      <button 
                        onClick={async () => {
                          try {
                            const listRes = await api.get('/api/ambulance/list');
                            const ambs = listRes.data || [];
                            if (ambs.length === 0) {
                              alert("No ambulances found in the fleet.");
                              return;
                            }
                            const ambOptions = ambs.map(a => `${a.ambulanceId}: [${a.vehicleNumber}] Driver: ${a.driverName} (${a.status})`).join('\n');
                            const choice = window.prompt(`Select Ambulance ID to assign to Patient ${req.patientName}:\n\n${ambOptions}`, ambs[0]?.ambulanceId);
                            if (choice) {
                              const selectedId = parseInt(choice.trim());
                              if (selectedId) {
                                await api.post(`/api/ambulance/assign-manual?emergencyId=${req.id}&ambulanceId=${selectedId}`);
                                alert(`✅ Ambulance assigned successfully to Patient ${req.patientName}!`);
                                loadEmergencies();
                              }
                            }
                          } catch (err) {
                            console.error("Failed to reassign ambulance:", err);
                            alert("Could not assign/reassign ambulance.");
                          }
                        }}
                        style={{
                          background: '#16a34a', color: 'white', border: 'none', padding: '10px 14px', borderRadius: '8px',
                          fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <FaAmbulance /> Reassign
                      </button>
                    )}

                    <button 
                      onClick={async () => {
                        try {
                          await api.delete(`/api/emergency/${req.id}`);
                          setEmergencyRequests(prev => prev.filter(r => r.id !== req.id));
                        } catch (err) {
                          console.error("Failed to dismiss request", err);
                          alert("Could not dismiss emergency request.");
                        }
                      }}
                      style={{
                        background: '#475569', color: 'white', border: 'none', padding: '10px 14px', borderRadius: '8px',
                        fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                      title="Dismiss & Resolve Alert"
                    >
                      <FaTrash /> Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
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

      {/* ===== RECENT CRITICAL AI PREDICTIONS (DOCTOR ONLY) ===== */}
      {role === "DOCTOR" && doctorId && (
        <DoctorAIPredictions doctorId={doctorId} />
      )}

       {role === "PATIENT" && (
        <ChatWidget patientId={localStorage.getItem("patientId")} />
      )}
    </div>
  );
}

// Sub-component for Doctor AI Predictions
const DoctorAIPredictions = ({ doctorId }) => {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPredictions = async () => {
            if (!doctorId) return;
            try {
                const res = await api.get(`/api/ai/doctor/predictions?doctorId=${doctorId}`);
                setPredictions(res.data);
            } catch (err) {
                console.error("Failed to fetch AI predictions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPredictions();
    }, [doctorId]);

    return (
        <div className="recent-section" style={{ marginTop: '30px' }}>
            <div className="section-header">
                <div className="section-title">
                    <div className="section-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                        🤖
                    </div>
                    <div>
                        <h2>Critical AI Alerts</h2>
                        <p>{predictions.length} High/Critical cases detected</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="table-loading">
                    <div className="loading-spinner" />
                    <p>Loading AI alerts...</p>
                </div>
            ) : predictions.length > 0 ? (
                <div className="table-wrapper">
                    <table className="appointment-table">
                        <thead>
                            <tr>
                                <th>Patient Name</th>
                                <th>Risk Level</th>
                                <th>AI Confidence</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {predictions.slice(0, 5).map((pred) => (
                                <tr key={pred.predictionId}>
                                    <td>
                                        <div className="cell-with-avatar">
                                            <div className="cell-avatar patient-avatar-color">
                                                {pred.patient?.name?.charAt(0).toUpperCase() || "P"}
                                            </div>
                                            <span>{pred.patient?.name || `ID: ${pred.patient?.patientId}`}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="status-badge" style={{
                                            background: pred.riskLevel === 'CRITICAL' ? '#fef2f2' : '#fff7ed',
                                            color: pred.riskLevel === 'CRITICAL' ? '#991b1b' : '#c2410c',
                                            border: `1px solid ${pred.riskLevel === 'CRITICAL' ? '#f87171' : '#fdba74'}`
                                        }}>
                                            {pred.riskLevel}
                                        </span>
                                    </td>
                                    <td>{pred.confidence}%</td>
                                    <td>
                                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                                            {pred.reason}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon" style={{ background: '#f8fafc', color: '#94a3b8' }}>
                        ✅
                    </div>
                    <h3>No Critical Alerts</h3>
                    <p>No high or critical health risks detected recently.</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;