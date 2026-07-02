import { useEffect, useState } from "react";
import api from "../api";

function Prescriptions() {
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    medicineName: "",
    dosage: "",
    duration: "",
    instructions: ""
  });
  const [message, setMessage] = useState("");

  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  useEffect(() => {
    loadPatients();
    loadPrescriptions();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await api.get("/api/patients");
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPrescriptions = async () => {
    try {
      if (role === "ADMIN") {
        const res = await api.get("/api/prescriptions");
        setPrescriptions(res.data);
      } else if (role === "DOCTOR") {
        const doctorsRes = await api.get("/api/doctors");
        const doctor = doctorsRes.data.find(d => {
          const cleaned = d.doctorName?.toLowerCase()
            .replace(/dr\.?\s*/i, "").replace(/\s+/g, "").trim();
          return cleaned === username?.toLowerCase().replace(/\s+/g, "").trim();
        });
        if (doctor) {
          const res = await api.get(`/api/prescriptions/doctor/${doctor.doctorId}`);
          setPrescriptions(res.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getCurrentDoctorId = async () => {
    const doctorsRes = await api.get("/api/doctors");
    const doctor = doctorsRes.data.find(d => {
      const cleaned = d.doctorName?.toLowerCase()
        .replace(/dr\.?\s*/i, "").replace(/\s+/g, "").trim();
      return cleaned === username?.toLowerCase().replace(/\s+/g, "").trim();
    });
    return doctor?.doctorId;
  };

  const handleSubmit = async () => {
    if (!formData.patientId || !formData.medicineName ||
        !formData.dosage || !formData.duration) {
      setMessage("❌ எல்லா fields-உம் fill பண்ணுங்க!");
      return;
    }
    try {
      const doctorId = await getCurrentDoctorId();
      if (!doctorId) {
        setMessage("❌ Doctor not found!");
        return;
      }
      await api.post("/api/prescriptions", {
        patientId: formData.patientId,
        doctorId: doctorId,
        medicineName: formData.medicineName,
        dosage: formData.dosage,
        duration: formData.duration,
        instructions: formData.instructions
      });
      setMessage("✅ Prescription Added!");
      setFormData({
        patientId: "",
        medicineName: "",
        dosage: "",
        duration: "",
        instructions: ""
      });
      setShowForm(false);
      loadPrescriptions();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete prescription?")) return;
    try {
      await api.delete(`/api/prescriptions/${id}`);
      loadPrescriptions();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = (p) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; border-bottom: 2px solid #1a3c5e; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #1a3c5e; margin: 0; }
            .header p { color: #666; margin: 5px 0; }
            .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info div { font-size: 14px; }
            .info strong { color: #1a3c5e; }
            .medicine-box { border: 2px solid #1a3c5e; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
            .medicine-box h3 { color: #1a3c5e; margin: 0 0 15px; }
            .detail-row { display: flex; margin: 8px 0; font-size: 14px; }
            .detail-label { font-weight: bold; width: 120px; color: #555; }
            .footer { margin-top: 60px; text-align: right; border-top: 1px solid #ddd; padding-top: 20px; }
            .signature { font-style: italic; color: #1a3c5e; font-size: 16px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏥 HealthCare Medical Center</h1>
            <p>Patient Monitoring System</p>
          </div>
          <div class="info">
            <div>
              <strong>Patient:</strong> ${p.patient?.name || "-"}<br/>
              <strong>Date:</strong> ${p.prescribedDate || new Date().toLocaleDateString()}
            </div>
            <div>
              <strong>Doctor:</strong> ${p.doctor?.doctorName || "-"}<br/>
              <strong>Specialization:</strong> ${p.doctor?.specialization || "-"}
            </div>
          </div>
          <div class="medicine-box">
            <h3>💊 Prescription Details</h3>
            <div class="detail-row">
              <span class="detail-label">Medicine:</span>
              <span>${p.medicineName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Dosage:</span>
              <span>${p.dosage}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span>${p.duration}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Instructions:</span>
              <span>${p.instructions || "As directed"}</span>
            </div>
          </div>
          <div class="footer">
            <p class="signature">Dr. ${p.doctor?.doctorName || "-"}</p>
            <p style="font-size:12px; color:#888;">This is a computer generated prescription</p>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2>💊 Prescriptions</h2>
        {(role === "DOCTOR" || role === "ADMIN") && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: "#1a3c5e",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            + Add Prescription
          </button>
        )}
      </div>

      {message && (
        <div style={{
          padding: "12px",
          marginBottom: "16px",
          background: message.includes("✅") ? "#d4edda" : "#f8d7da",
          color: message.includes("✅") ? "#155724" : "#721c24",
          borderRadius: "8px"
        }}>
          {message}
        </div>
      )}

      {/* Add Form */}
      {showForm && (role === "DOCTOR" || role === "ADMIN") && (
        <div style={{
          background: "white",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          marginBottom: "24px"
        }}>
          <h3 style={{ margin: "0 0 20px", color: "#1a3c5e" }}>
            📝 New Prescription
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Select Patient</label>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                style={inputStyle}
              >
                <option value="">-- Select Patient --</option>
                {patients.map(p => (
                  <option key={p.patientId} value={p.patientId}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Medicine Name</label>
              <input
                type="text"
                placeholder="e.g. Paracetamol 500mg"
                value={formData.medicineName}
                onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Dosage</label>
              <input
                type="text"
                placeholder="e.g. 1 tablet twice daily"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Duration</label>
              <input
                type="text"
                placeholder="e.g. 5 days"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Instructions</label>
              <textarea
                placeholder="e.g. Take after food, avoid alcohol..."
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: "10px 20px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={{
                padding: "10px 24px",
                background: "#1a3c5e",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              💾 Save Prescription
            </button>
          </div>
        </div>
      )}

      {/* Prescriptions List */}
      <div style={{ display: "grid", gap: "16px" }}>
        {prescriptions.length === 0 ? (
          <div style={{
            background: "white",
            padding: "40px",
            borderRadius: "12px",
            textAlign: "center",
            color: "#999"
          }}>
            No Prescriptions Found
          </div>
        ) : (
          prescriptions.map(p => (
            <div
              key={p.prescriptionId}
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                borderLeft: "5px solid #1a3c5e"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                    <div>
                      <span style={{ color: "#888", fontSize: "12px" }}>PATIENT</span>
                      <p style={{ margin: "2px 0", fontWeight: "700", color: "#1a3c5e" }}>
                        👤 {p.patient?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: "#888", fontSize: "12px" }}>DOCTOR</span>
                      <p style={{ margin: "2px 0", fontWeight: "600" }}>
                        👨‍⚕️ {p.doctor?.doctorName || "-"}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: "#888", fontSize: "12px" }}>DATE</span>
                      <p style={{ margin: "2px 0" }}>📅 {p.prescribedDate}</p>
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    gap: "24px",
                    marginTop: "12px",
                    flexWrap: "wrap"
                  }}>
                    <div>
                      <span style={{ color: "#888", fontSize: "12px" }}>MEDICINE</span>
                      <p style={{ margin: "2px 0", fontWeight: "600", color: "#059669" }}>
                        💊 {p.medicineName}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: "#888", fontSize: "12px" }}>DOSAGE</span>
                      <p style={{ margin: "2px 0" }}>🔢 {p.dosage}</p>
                    </div>
                    <div>
                      <span style={{ color: "#888", fontSize: "12px" }}>DURATION</span>
                      <p style={{ margin: "2px 0" }}>⏱️ {p.duration}</p>
                    </div>
                    {p.instructions && (
                      <div>
                        <span style={{ color: "#888", fontSize: "12px" }}>INSTRUCTIONS</span>
                        <p style={{ margin: "2px 0" }}>📋 {p.instructions}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button
                    onClick={() => handlePrint(p)}
                    style={{
                      background: "#059669",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px"
                    }}
                  >
                    🖨️ Print
                  </button>
                  {(role === "ADMIN" || role === "DOCTOR") && (
                    <button
                      onClick={() => handleDelete(p.prescriptionId)}
                      style={{
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "13px"
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontWeight: "600",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "14px"
};

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "14px",
  boxSizing: "border-box"
};

export default Prescriptions;