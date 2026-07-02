import { useEffect, useState } from "react";
import api from "../api";

function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const username = localStorage.getItem("username");

  useEffect(() => {
    loadMyPrescriptions();
  }, []);

  const loadMyPrescriptions = async () => {
    try {
      const patientsRes = await api.get("/api/patients");
      const patient = patientsRes.data.find(p =>
        p.name?.toLowerCase().replace(/\s+/g, "") ===
        username?.toLowerCase().replace(/\s+/g, "")
      );
      if (patient) {
        const res = await api.get(`/api/prescriptions/patient/${patient.patientId}`);
        setPrescriptions(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = (p) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>My Prescription</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; border-bottom: 2px solid #1a3c5e; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #1a3c5e; margin: 0; }
            .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .medicine-box { border: 2px solid #1a3c5e; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
            .medicine-box h3 { color: #1a3c5e; margin: 0 0 15px; }
            .detail-row { display: flex; margin: 8px 0; font-size: 14px; }
            .detail-label { font-weight: bold; width: 120px; color: #555; }
            .footer { margin-top: 60px; text-align: right; border-top: 1px solid #ddd; padding-top: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏥 HealthCare Medical Center</h1>
            <p>Patient Monitoring System</p>
          </div>
          <div class="info">
            <div><strong>Patient:</strong> ${p.patient?.name}<br/><strong>Date:</strong> ${p.prescribedDate}</div>
            <div><strong>Doctor:</strong> ${p.doctor?.doctorName}<br/><strong>Specialization:</strong> ${p.doctor?.specialization}</div>
          </div>
          <div class="medicine-box">
            <h3>💊 Prescription Details</h3>
            <div class="detail-row"><span class="detail-label">Medicine:</span><span>${p.medicineName}</span></div>
            <div class="detail-row"><span class="detail-label">Dosage:</span><span>${p.dosage}</span></div>
            <div class="detail-row"><span class="detail-label">Duration:</span><span>${p.duration}</span></div>
            <div class="detail-row"><span class="detail-label">Instructions:</span><span>${p.instructions || "As directed"}</span></div>
          </div>
          <div class="footer">
            <p style="font-style:italic; color:#1a3c5e; font-size:16px;">Dr. ${p.doctor?.doctorName}</p>
            <p style="font-size:12px; color:#888;">Computer generated prescription</p>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      <h2>💊 My Prescriptions</h2>

      <div style={{ display: "grid", gap: "16px", marginTop: "20px" }}>
        {prescriptions.length === 0 ? (
          <div style={{
            background: "white",
            padding: "40px",
            borderRadius: "12px",
            textAlign: "center",
            color: "#999"
          }}>
            No Prescriptions Yet
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
                borderLeft: "5px solid #059669"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: "0 0 8px", color: "#888", fontSize: "12px" }}>
                    📅 {p.prescribedDate} | 👨‍⚕️ {p.doctor?.doctorName}
                  </p>
                  <p style={{ margin: "0 0 6px", fontWeight: "700", color: "#059669", fontSize: "16px" }}>
                    💊 {p.medicineName}
                  </p>
                  <p style={{ margin: "0 0 4px", fontSize: "14px" }}>
                    🔢 Dosage: {p.dosage}
                  </p>
                  <p style={{ margin: "0 0 4px", fontSize: "14px" }}>
                    ⏱️ Duration: {p.duration}
                  </p>
                  {p.instructions && (
                    <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
                      📋 {p.instructions}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handlePrint(p)}
                  style={{
                    background: "#1a3c5e",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    alignSelf: "flex-start"
                  }}
                >
                  🖨️ Print
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyPrescriptions;