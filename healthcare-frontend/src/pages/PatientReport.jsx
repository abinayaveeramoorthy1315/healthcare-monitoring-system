import { useState, useEffect } from "react";
import api from "../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FaFileMedical, FaDownload, FaUser, FaCalendarCheck,
  FaPills, FaHeartbeat, FaTint, FaVenusMars, FaBirthdayCake
} from "react-icons/fa";

function PatientReport() {
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const username = localStorage.getItem("username");
  const patientId = localStorage.getItem("patientId");

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    try {
      const patientsRes = await api.get("/api/patients");
      let patient;

      if (patientId) {
        patient = patientsRes.data.find(p => p.patientId === Number(patientId));
      } else {
        patient = patientsRes.data.find(p =>
          p.name?.toLowerCase().replace(/\s+/g, "") ===
          username?.toLowerCase().replace(/\s+/g, "")
        );
      }

      if (patient) {
        setPatientData(patient);

        const aptsRes = await api.get("/api/appointments");
        setAppointments(aptsRes.data.filter(a => a.patient?.patientId === patient.patientId));

        try {
          const vitalsRes = await api.get(`/api/vitalsigns/patient/${patient.patientId}`);
          setVitals(vitalsRes.data);
        } catch (err) { console.error(err); }

        try {
          const presRes = await api.get(`/api/prescriptions/patient/${patient.patientId}`);
          setPrescriptions(presRes.data);
        } catch (err) { console.error(err); }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    setGenerating(true);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(53, 102, 63);
    doc.rect(0, 0, pageWidth, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("HealthCare Medical Center", pageWidth / 2, 14, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Patient Health Report", pageWidth / 2, 22, { align: "center" });
    doc.text("Smart Healthcare Monitoring System", pageWidth / 2, 29, { align: "center" });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);
    doc.text(`Report ID: RPT-${Date.now()}`, pageWidth - 14, 42, { align: "right" });

    doc.setDrawColor(53, 102, 63);
    doc.setLineWidth(0.5);
    doc.line(14, 45, pageWidth - 14, 45);

    doc.setTextColor(26, 51, 35);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Information", 14, 54);

    doc.setFillColor(237, 247, 237);
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

    let yPos = 98;

    if (vitals.length > 0) {
      const latest = vitals[vitals.length - 1];
      doc.setTextColor(26, 51, 35);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Latest Vitals Summary", 14, yPos);
      yPos += 5;

      const boxWidth = (pageWidth - 28 - 12) / 4;
      const vitalsData = [
        { label: "Heart Rate", value: `${latest.heartRate} bpm`, color: [239, 68, 68] },
        { label: "Oxygen Level", value: `${latest.oxygenLevel}%`, color: [34, 197, 94] },
        { label: "Temperature", value: `${latest.temperature}°C`, color: [245, 158, 11] },
        { label: "Blood Pressure", value: latest.bloodPressure || "-", color: [82, 139, 94] }
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

      const riskColor = latest.riskLevel === "CRITICAL"
        ? [220, 53, 69] : latest.riskLevel === "HIGH"
        ? [255, 193, 7] : [40, 167, 69];

      doc.setFillColor(...riskColor);
      doc.rect(14, yPos, 60, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Risk Level: ${latest.riskLevel || "NORMAL"}`, 44, yPos + 5.5, { align: "center" });
      yPos += 14;
    }

    doc.setTextColor(26, 51, 35);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Appointments History", 14, yPos);
    yPos += 4;

    if (appointments.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["#", "Doctor", "Date", "Time", "Status"]],
        body: appointments.map((a, i) => [
          i + 1, a.doctor?.doctorName || "-",
          a.appointmentDate || "-", a.appointmentTime || "-", a.status || "-"
        ]),
        headStyles: { fillColor: [53, 102, 63], textColor: 255, fontSize: 9, fontStyle: "bold" },
        bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [237, 247, 237] },
        margin: { left: 14, right: 14 }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(9);
      doc.text("No appointments found", 14, yPos + 6);
      yPos += 14;
    }

    doc.setTextColor(26, 51, 35);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Prescriptions", 14, yPos);
    yPos += 4;

    if (prescriptions.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [["#", "Medicine", "Dosage", "Duration", "Doctor", "Date"]],
        body: prescriptions.map((p, i) => [
          i + 1, p.medicineName || "-", p.dosage || "-",
          p.duration || "-", p.doctor?.doctorName || "-", p.prescribedDate || "-"
        ]),
        headStyles: { fillColor: [5, 150, 105], textColor: 255, fontSize: 9, fontStyle: "bold" },
        bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [240, 255, 248] },
        margin: { left: 14, right: 14 }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(9);
      doc.text("No prescriptions found", 14, yPos + 6);
      yPos += 14;
    }

    if (vitals.length > 0) {
      if (yPos > 220) { doc.addPage(); yPos = 20; }
      doc.setTextColor(26, 51, 35);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Vitals History", 14, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [["#", "Heart Rate", "Oxygen", "Temperature", "BP", "Risk", "Date"]],
        body: vitals.slice(-10).map((v, i) => [
          i + 1, `${v.heartRate} bpm`, `${v.oxygenLevel}%`,
          `${v.temperature}°C`, v.bloodPressure || "-", v.riskLevel || "NORMAL",
          v.recordedAt ? new Date(v.recordedAt).toLocaleDateString() : "-"
        ]),
        headStyles: { fillColor: [82, 139, 94], textColor: 255, fontSize: 9, fontStyle: "bold" },
        bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [237, 247, 237] },
        margin: { left: 14, right: 14 }
      });
    }

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
      doc.text("HealthCare Medical Center | Smart Healthcare Monitoring System",
        pageWidth / 2, footerY, { align: "center" });
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, footerY, { align: "right" });
      doc.text("Confidential - For Medical Use Only", 14, footerY);
    }

    doc.save(`Health_Report_${patientData?.name}_${new Date().toLocaleDateString()}.pdf`);
    setGenerating(false);
  };

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>

      {/* ===== HEADER ===== */}
      <div style={styles.pageHeader}>
        <div style={styles.headerIcon}>
          <FaFileMedical />
        </div>
        <div>
          <h1 style={styles.pageTitle}>Health Report</h1>
          <p style={styles.pageSubtitle}>
            Complete medical history and vitals summary
          </p>
        </div>
      </div>

      {/* ===== PATIENT SUMMARY ===== */}
      {patientData && (
        <div style={styles.summaryCard}>
          <div style={styles.summaryTop}>
            <div style={styles.patientAvatar}>
              {patientData.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={styles.patientName}>{patientData.name}</h3>
              <div style={styles.patientMeta}>
                <span style={styles.metaTag}>
                  <FaBirthdayCake style={{ fontSize: "11px" }} />
                  {patientData.age} years
                </span>
                <span style={styles.metaTag}>
                  <FaVenusMars style={{ fontSize: "11px" }} />
                  {patientData.gender}
                </span>
                <span style={styles.metaTag}>
                  <FaTint style={{ fontSize: "11px" }} />
                  {patientData.bloodGroup}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <div style={styles.statIconWrap}>
                <FaCalendarCheck style={{ color: "#0f766e" }} />
              </div>
              <div>
                <p style={styles.statNum}>{appointments.length}</p>
                <p style={styles.statLbl}>Appointments</p>
              </div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statIconWrap}>
                <FaPills style={{ color: "#059669" }} />
              </div>
              <div>
                <p style={styles.statNum}>{prescriptions.length}</p>
                <p style={styles.statLbl}>Prescriptions</p>
              </div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statIconWrap}>
                <FaHeartbeat style={{ color: "#dc2626" }} />
              </div>
              <div>
                <p style={styles.statNum}>{vitals.length}</p>
                <p style={styles.statLbl}>Vitals Records</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DOWNLOAD BUTTON ===== */}
      <button
        onClick={generatePDF}
        disabled={generating}
        style={styles.downloadBtn}
      >
        {generating ? (
          <><span style={styles.spinnerSmall} /> Generating PDF...</>
        ) : (
          <><FaDownload /> Download Health Report PDF</>
        )}
      </button>

      <p style={styles.note}>
        Report includes: Patient details, Appointments, Prescriptions & Vitals history
      </p>
    </div>
  );
}

const styles = {
  wrapper: {
    padding: "28px 32px",
    minHeight: "100vh",
    background: "#edf7ed",
    fontFamily: "'Outfit', sans-serif",
    maxWidth: "800px"
  },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px"
  },
  headerIcon: {
    width: "52px",
    height: "52px",
    background: "linear-gradient(135deg, #35663f, #528b5e)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    color: "white",
    boxShadow: "0 4px 12px rgba(82,139,94,0.3)"
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#1a3323",
    margin: 0
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#5c7564",
    margin: "2px 0 0"
  },
  summaryCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 16px 40px rgba(27,58,38,0.08)",
    border: "1px solid rgba(82,139,94,0.2)",
    marginBottom: "24px"
  },
  summaryTop: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    paddingBottom: "24px",
    borderBottom: "1px solid rgba(82,139,94,0.12)"
  },
  patientAvatar: {
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #35663f, #528b5e)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "700",
    color: "white",
    flexShrink: 0
  },
  patientName: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#1a3323",
    margin: "0 0 8px"
  },
  patientMeta: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  metaTag: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "#f8fafc",
    color: "#5c7564",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid rgba(82,139,94,0.15)"
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px"
  },
  statBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#f8fafc",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(82,139,94,0.1)"
  },
  statIconWrap: {
    width: "36px",
    height: "36px",
    background: "white",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    flexShrink: 0,
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)"
  },
  statNum: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#1a3323",
    margin: 0,
    lineHeight: 1
  },
  statLbl: {
    fontSize: "11px",
    color: "#82c08e",
    margin: "2px 0 0"
  },
  downloadBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "linear-gradient(135deg, #35663f, #528b5e)",
    color: "white",
    border: "none",
    padding: "15px 32px",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
    boxShadow: "0 8px 20px rgba(82,139,94,0.3)"
  },
  note: {
    marginTop: "12px",
    color: "#82c08e",
    fontSize: "13px"
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "80px",
    gap: "16px",
    color: "#5c7564"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(82,139,94,0.2)",
    borderTopColor: "#528b5e",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  spinnerSmall: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  }
};

export default PatientReport;