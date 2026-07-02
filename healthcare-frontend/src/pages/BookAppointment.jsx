import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function BookAppointment() {
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");

  const [formData, setFormData] = useState({
    doctorId: "",
    slotId: "",
    reason: ""
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const res = await api.get("/api/doctors");
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDoctorChange = async (e) => {
    const doctorId = e.target.value;

    setFormData({
      ...formData,
      doctorId,
      slotId: ""
    });

    setSlots([]);

    if (doctorId) {
      try {
        const res = await api.get(
          `/api/slots/available/${doctorId}`
        );
        setSlots(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.doctorId || !formData.slotId) {
        setMessage("❌ Please select doctor and slot!");
        return;
      }

      const patientId = localStorage.getItem("patientId");

      if (!patientId) {
        setMessage(
          "❌ Patient not found! Please login again."
        );
        return;
      }

      const selectedSlot = slots.find(
        (s) => s.slotId === Number(formData.slotId)
      );

      if (!selectedSlot) {
        setMessage("❌ Invalid slot selected!");
        return;
      }

      await api.post("/api/appointments", {
        patient: {
          patientId: Number(patientId)
        },
        doctor: {
          doctorId: Number(formData.doctorId)
        },
        appointmentDate: selectedSlot.slotDate,
        appointmentTime:
          selectedSlot.startTime +
          " - " +
          selectedSlot.endTime,
        status: "PENDING"
      });

      await api.put(
        `/api/slots/book/${formData.slotId}`
      );

      setMessage(
        "✅ Appointment Booked Successfully!"
      );

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);

    } catch (err) {
      console.error(err);
      setMessage("❌ Booking Failed!");
    }
  };

  const specializations = [
    ...new Set(
      doctors
        .map((doc) => doc.specialization)
        .filter(Boolean)
    )
  ];

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "900px",
        margin: "auto"
      }}
    >
      <h2
        style={{
          marginBottom: "25px",
          color: "#1a3c5e"
        }}
      >
        📅 Book Appointment
      </h2>

      {message && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "10px",
            background: message.includes("✅")
              ? "#d4edda"
              : "#f8d7da",
            color: message.includes("✅")
              ? "#155724"
              : "#721c24"
          }}
        >
          {message}
        </div>
      )}

      {/* Specialization Cards */}

      <h3>Select Specialization</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: "15px",
          marginBottom: "30px"
        }}
      >
        {specializations.map((spec) => (
          <div
            key={spec}
            onClick={() => {
              setSelectedSpecialization(spec);
              setSlots([]);

              setFormData({
                ...formData,
                doctorId: "",
                slotId: ""
              });
            }}
            style={{
              padding: "18px",
              borderRadius: "15px",
              cursor: "pointer",
              textAlign: "center",
              fontWeight: "600",
              fontSize: "16px",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.08)",
              background:
                selectedSpecialization === spec
                  ? "#1a3c5e"
                  : "#ffffff",
              color:
                selectedSpecialization === spec
                  ? "white"
                  : "#333",
              transition: "0.3s"
            }}
          >
            {spec === "Cardiology" && "🫀 "}
            {spec === "Neurology" && "🧠 "}
            {spec === "Orthopedic" && "🦴 "}
            {spec === "Ophthalmology" && "👁 "}
            {spec === "General Physician" && "🩺 "}

            {spec}
          </div>
        ))}
      </div>

      {/* Doctor Dropdown */}

      {selectedSpecialization && (
        <div>
          <label style={{ fontWeight: "600" }}>
            Select Doctor
          </label>

          <select
            name="doctorId"
            value={formData.doctorId}
            onChange={handleDoctorChange}
            style={inputStyle}
          >
            <option value="">
              -- Select Doctor --
            </option>

            {doctors
              .filter(
                (doc) =>
                  doc.specialization ===
                  selectedSpecialization
              )
              .map((doc) => (
                <option
                  key={doc.doctorId}
                  value={doc.doctorId}
                >
                  Dr. {doc.doctorName}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Slots */}

      {formData.doctorId && (
        <div style={{ marginTop: "20px" }}>
          <label style={{ fontWeight: "600" }}>
            Available Slots
          </label>

          {slots.length === 0 ? (
            <p
              style={{
                color: "#999",
                marginTop: "10px"
              }}
            >
              ❌ No slots available
            </p>
          ) : (
            <select
              name="slotId"
              value={formData.slotId}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">
                -- Select Slot --
              </option>

              {slots.map((slot) => (
                <option
                  key={slot.slotId}
                  value={slot.slotId}
                >
                  📅 {slot.slotDate} | ⏰{" "}
                  {slot.startTime} - {slot.endTime}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Reason */}

      <div style={{ marginTop: "20px" }}>
        <label style={{ fontWeight: "600" }}>
          Reason
        </label>

        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          rows="4"
          placeholder="Describe your symptoms..."
          style={{
            ...inputStyle,
            resize: "vertical"
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        style={{
          marginTop: "25px",
          background: "#1a3c5e",
          color: "white",
          padding: "12px 25px",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "600"
        }}
      >
        Book Appointment
      </button>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "8px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  fontSize: "15px"
};

export default BookAppointment;