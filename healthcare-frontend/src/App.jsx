import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Alerts from "./pages/Alerts";
import VitalSigns from "./pages/VitalSigns";
import BookAppointment from "./pages/BookAppointment";
import DoctorSlots from "./pages/DoctorSlots";
import Notifications from "./pages/Notifications";
import Prescriptions from "./pages/Prescriptions";
import MyPrescriptions from "./pages/MyPrescriptions";
import MyVitals from "./pages/MyVitals";
import PatientReport from "./pages/PatientReport";
import SymptomChecker from "./components/SymptomChecker";
import SkinChecker from "./components/SkinChecker";
import AiPredictionPage from "./pages/AiPredictionPage";
import Profile from "./pages/Profile";
import HealthPassport from "./pages/HealthPassport";

import "./App.css";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;
  if (localStorage.getItem("passwordChanged") === "false" && window.location.pathname !== "/change-password") {
    return <Navigate to="/change-password" />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Root */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="content">
                  <Dashboard />
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Patients */}
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="content">
                  <Patients />
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Doctors */}
        <Route
          path="/doctors"
          element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="content">
                  <Doctors />
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Appointments */}
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="content">
                  <Appointments />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
  path="/slots"
  element={
    <ProtectedRoute>
      <div className="app-container">
        <Sidebar />
        <div className="content">
          <DoctorSlots />
        </div>
      </div>
    </ProtectedRoute>
  }
/>

        {/* Alerts */}
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="content">
                  <Alerts />
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Vital Signs */}
        <Route
          path="/vitals"
          element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="content">
                  <VitalSigns />
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        <Route path="/my-vitals" element={
  <ProtectedRoute>
    <div className="app-container">
      <Sidebar />
      <div className="content"><MyVitals /></div>
    </div>
  </ProtectedRoute>
} />

        {/* Book Appointment */}
        <Route
          path="/book-appointment"
          element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="content">
                  <BookAppointment />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
  path="/notifications"
  element={
    <ProtectedRoute>
      <div className="app-container">
        <Sidebar />
        <div className="content">
          <Notifications />
        </div>
      </div>
    </ProtectedRoute>
  }
/>
// DOCTOR + ADMIN
<Route path="/prescriptions" element={
  <ProtectedRoute>
    <div className="app-container">
      <Sidebar />
      <div className="content"><Prescriptions /></div>
    </div>
  </ProtectedRoute>
} />

// PATIENT
<Route path="/my-prescriptions" element={
  <ProtectedRoute>
    <div className="app-container">
      <Sidebar />
      <div className="content"><MyPrescriptions /></div>
    </div>
  </ProtectedRoute>
} />

<Route path="/report" element={
  <ProtectedRoute>
    <div className="app-container">
      <Sidebar />
      <div className="content"><PatientReport /></div>
    </div>
  </ProtectedRoute>
} />
<Route path="/symptom-checker" element={<SymptomChecker />} />

<Route path="/skin-checker" element={<SkinChecker />} />

<Route path="/ai-prediction" element={
  <ProtectedRoute>
    <div className="app-container">
      <Sidebar />
      <div className="content"><AiPredictionPage /></div>
    </div>
  </ProtectedRoute>
} />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div className="app-container">
                <Sidebar />
                <div className="content">
                  <Profile />
                </div>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Health Passport Full Page */}
        <Route path="/health-passport/:patientId" element={<HealthPassport />} />

        {/* Invalid Routes */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;