import { useState, useEffect } from "react";
import api from "../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function PatientReport() {
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  const patientId = localStorage.getItem("patientId");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // Patient details
      const patientsRes = await api.get("/api/patients");
      let patient;

      if (patientId) {
        patient = patientsRes.data.find(
          p => p.patientId === Number(patientId)
        );
      } else {
        patient = patientsRes.data.find(p =>
          p.name?.toLowerCase().replace(/\s+/g, "") ===
          username?.toLowerCase().replace(/\s+/g, "")
        );
      }

      if (patient) {
        setPatientData(patient);

        // Appointments
        const aptsRes = await api.get("/api/appointments");
        const myApts = aptsRes.data.filter(
          a => a.patient?.patientId === patient.patientId
        );
        setAppointments(myApts);

        // Vitals
        try {
          const vitalsRes = await api.get(
            `/api/vitalsigns/patient/${patient.patientId}`
          );
          setVitals(vitalsRes.data);
        } catch (err) {
          console.error(err);
        }

        // Prescriptions
        try {
          const presRes = await api.get(
            `/api/prescriptions/patient/${patient.patientId}`
          );
          setPrescriptions(presRes.data);
        } catch (err) {
          console.error(err);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // ===== HEADER =====
    doc.setFillColor(26, 60, 94);
    doc.rect(0, 0, pageWidth, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("HealthCare Medical Center", pageWidth / 2, 14, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Patient Health Report", pageWidth / 2, 22, { align: "center" });
    doc.text("Smart Healthcare Monitoring System", pageWidth / 2, 29, { align: "center" });

    // ===== REPORT INFO =====
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);
    doc.text(`Report ID: RPT-${Date.now()}`, pageWidth - 14, 42, { align: "right" });

    // Divider
    doc.setDrawColor(26, 60, 94);
    doc.setLineWidth(0.5);
    doc.line(14, 45, pageWidth - 14, 45);

    // ===== PATIENT INFO =====
    doc.setTextColor(26, 60, 94);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Information", 14, 54);

    doc.setFillColor(240, 245, 255);
    doc.rect(14, 57, pageWidth - 28, 32, "F");

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const col1X = 20;
    const col2X = pageWidth / 2 + 10;

    doc.setFont("helvetica", "bold");
    doc.text("Name:", col1X, 65);
    doc.setFont("helvetica", "normal");
    doc.text(patientData?.name || "-", col1X + 25, 65);

    doc.setFont("helvetica", "bold");
    doc.text("Age:", col1X, 73);
    doc.setFont("helvetica", "normal");
    doc.text(`${patientData?.age || "-"} years`, col1X + 25, 73);

    doc.setFont("helvetica", "bold");
    doc.text("Gender:", col1X, 81);
    doc.setFont("helvetica", "normal");
    doc.text(patientData?.gender || "-", col1X + 25, 81);

    doc.setFont("helvetica", "bold");
    doc.text("Blood Group:", col2X, 65);
    doc.setFont("helvetica", "normal");
    doc.text(patientData?.bloodGroup || "-", col2X + 32, 65);

    doc.setFont("helvetica", "bold");
    doc.text("Phone:", col2X, 73);
    doc.setFont("helvetica", "normal");
    doc.text(patientData?.phone || "-", col2X + 32, 73);

    doc.setFont("helvetica", "bold");
    doc.text("Email:", col2X, 81);
    doc.setFont("helvetica", "normal");
    doc.text(patientData?.email || "-", col2X + 32, 81);

    // ===== LATEST VITALS SUMMARY =====
    let yPos = 98;

    if (vitals.length > 0) {
      const latest = vitals[vitals.length - 1];

      doc.setTextColor(26, 60, 94);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Latest Vitals Summary", 14, yPos);
      yPos += 5;

      // Vitals boxes
      const boxWidth = (pageWidth - 28 - 12) / 4;
      const vitalsData = [
        { label: "Heart Rate", value: `${latest.heartRate} bpm`, color: [239, 68, 68] },
        { label: "Oxygen Level", value: `${latest.oxygenLevel}%`, color: [34, 197, 94] },
        { label: "Temperature", value: `${latest.temperature}°C`, color: [245, 158, 11] },
        { label: "Blood Pressure", value: latest.bloodPressure || "-", color: [37, 99, 235] }
      ];

      vitalsData.forEach((v, i) => {
        const x = 14 + i * (boxWidth + 4);
        doc.setFillColor(...v.color);
        doc.rect(x, yPos, boxWidth, 18, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(v.label, x + boxWidth / 2, yPos + 7, { align: "center" });
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(v.value, x + boxWidth / 2, yPos + 14, { align: "center" });
      });

      yPos += 25;

      // Risk Level
      const riskColor = latest.riskLevel === "CRITICAL"
        ? [220, 53, 69]
        : latest.riskLevel === "HIGH"
        ? [255, 193, 7]
        : [40, 167, 69];

      doc.setFillColor(...riskColor);
      doc.rect(14, yPos, 60, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Risk Level: ${latest.riskLevel || "NORMAL"}`, 44, yPos + 5.5, { align: "center" });

      yPos += 14;
    }

    // ===== APPOINTMENTS TABLE =====
    doc.setTextColor(26, 60, 94);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Appointments History", 14, yPos);
    yPos += 4;

    if (appointments.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["#", "Doctor", "Date", "Time", "Status"]],
        body: appointments.map((a, i) => [
          i + 1,
          a.doctor?.doctorName || "-",
          a.appointmentDate || "-",
          a.appointmentTime || "-",
          a.status || "-"
        ]),
        headStyles: {
          fillColor: [26, 60, 94],
          textColor: 255,
          fontSize: 9,
          fontStyle: "bold"
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [240, 245, 255]
        },
        columnStyles: {
          4: {
            fontStyle: "bold",
            textColor: (cell) =>
              cell.raw === "BOOKED" ? [40, 167, 69] :
              cell.raw === "CANCELLED" ? [220, 53, 69] :
              [255, 193, 7]
          }
        },
        margin: { left: 14, right: 14 }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(9);
      doc.text("No appointments found", 14, yPos + 6);
      yPos += 14;
    }

    // ===== PRESCRIPTIONS TABLE =====
    doc.setTextColor(26, 60, 94);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Prescriptions", 14, yPos);
    yPos += 4;

    if (prescriptions.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["#", "Medicine", "Dosage", "Duration", "Doctor", "Date"]],
        body: prescriptions.map((p, i) => [
          i + 1,
          p.medicineName || "-",
          p.dosage || "-",
          p.duration || "-",
          p.doctor?.doctorName || "-",
          p.prescribedDate || "-"
        ]),
        headStyles: {
          fillColor: [5, 150, 105],
          textColor: 255,
          fontSize: 9,
          fontStyle: "bold"
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [240, 255, 248]
        },
        margin: { left: 14, right: 14 }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(9);
      doc.text("No prescriptions found", 14, yPos + 6);
      yPos += 14;
    }

    // ===== VITALS HISTORY TABLE =====
    if (vitals.length > 0) {
      // New page if needed
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setTextColor(26, 60, 94);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Vitals History", 14, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [["#", "Heart Rate", "Oxygen", "Temperature", "BP", "Risk", "Date"]],
        body: vitals.slice(-10).map((v, i) => [
          i + 1,
          `${v.heartRate} bpm`,
          `${v.oxygenLevel}%`,
          `${v.temperature}°C`,
          v.bloodPressure || "-",
          v.riskLevel || "NORMAL",
          v.recordedAt
            ? new Date(v.recordedAt).toLocaleDateString()
            : "-"
        ]),
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontSize: 9,
          fontStyle: "bold"
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [240, 245, 255]
        },
        margin: { left: 14, right: 14 }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // ===== FOOTER =====
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = doc.internal.pageSize.getHeight() - 15;

      doc.setDrawColor(26, 60, 94);
      doc.setLineWidth(0.3);
      doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        "HealthCare Medical Center | Smart Healthcare Monitoring System",
        pageWidth / 2,
        footerY,
        { align: "center" }
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - 14,
        footerY,
        { align: "right" }
      );
      doc.text(
        "Confidential - For Medical Use Only",
        14,
        footerY
      );
    }

    // Save PDF
    doc.save(`Health_Report_${patientData?.name}_${new Date().toLocaleDateString()}.pdf`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px" }}>
        <p>Loading report data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "800px" }}>
      <h2>📋 Health Report</h2>

      {/* Patient Summary Card */}
      {patientData && (
        <div style={{
          background: "white",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          marginBottom: "24px",
          borderLeft: "5px solid #1a3c5e"
        }}>
          <h3 style={{ margin: "0 0 16px", color: "#1a3c5e" }}>
            👤 {patientData.name}
          </h3>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "16px"
          }}>
            <div>
              <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>AGE</p>
              <p style={{ margin: "4px 0", fontWeight: "600" }}>{patientData.age} years</p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>GENDER</p>
              <p style={{ margin: "4px 0", fontWeight: "600" }}>{patientData.gender}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>BLOOD GROUP</p>
              <p style={{ margin: "4px 0", fontWeight: "600" }}>{patientData.bloodGroup}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>APPOINTMENTS</p>
              <p style={{ margin: "4px 0", fontWeight: "600" }}>{appointments.length}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>PRESCRIPTIONS</p>
              <p style={{ margin: "4px 0", fontWeight: "600" }}>{prescriptions.length}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>VITALS RECORDS</p>
              <p style={{ margin: "4px 0", fontWeight: "600" }}>{vitals.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Download Button */}
      <button
        onClick={generatePDF}
        style={{
          background: "#1a3c5e",
          color: "white",
          border: "none",
          padding: "14px 32px",
          borderRadius: "10px",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 4px 12px rgba(26,60,94,0.3)"
        }}
      >
        📥 Download Health Report PDF
      </button>

      <p style={{ marginTop: "12px", color: "#888", fontSize: "13px" }}>
        Report includes: Patient details, Appointments, Prescriptions & Vitals history
      </p>
    </div>
  );
}

export default PatientReport;