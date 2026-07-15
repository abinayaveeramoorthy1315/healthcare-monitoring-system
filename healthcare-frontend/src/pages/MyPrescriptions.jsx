import { useEffect, useState } from "react";
import api from "../api";
import {
  FaPills, FaPrint, FaUserMd, FaCalendarCheck,
  FaClock, FaFileAlt, FaTint
} from "react-icons/fa";

function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem("username");

  useEffect(() => { loadMyPrescriptions(); }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (p) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription - ${p.patient?.name}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 24px; margin-bottom: 28px; }
            .header h1 { color: #1e40af; font-size: 26px; margin-bottom: 4px; }
            .header p { color: #64748b; font-size: 13px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
            .info-box { background: #f8fafc; padding: 16px; border-radius: 8px; }
            .info-label { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 4px; }
            .info-value { font-size: 15px; font-weight: 600; color: #0f172a; }
            .rx-box { border: 2px solid #1e40af; border-radius: 12px; padding: 24px; margin-bottom: 28px; }
            .rx-title { font-size: 18px; font-weight: 700; color: #1e40af; margin-bottom: 16px; }
            .rx-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
            .rx-label { font-weight: 600; color: #475569; width: 130px; font-size: 14px; }
            .rx-value { color: #0f172a; font-size: 14px; flex: 1; }
            .footer { text-align: right; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            .doctor-sign { font-size: 18px; font-weight: 700; color: #1e40af; }
            .disclaimer { font-size: 11px; color: #94a3b8; margin-top: 8px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HealthCare Medical Center</h1>
            <p>Smart Healthcare Monitoring System | Patient Prescription</p>
          </div>
          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">PATIENT NAME</div>
              <div class="info-value">${p.patient?.name || "-"}</div>
            </div>
            <div class="info-box">
              <div class="info-label">PRESCRIBED BY</div>
              <div class="info-value">${p.doctor?.doctorName || "-"}</div>
            </div>
            <div class="info-box">
              <div class="info-label">SPECIALIZATION</div>
              <div class="info-value">${p.doctor?.specialization || "-"}</div>
            </div>
            <div class="info-box">
              <div class="info-label">DATE</div>
              <div class="info-value">${p.prescribedDate || new Date().toLocaleDateString()}</div>
            </div>
          </div>
          <div class="rx-box">
            <div class="rx-title">Prescription Details</div>
            <div class="rx-row">
              <span class="rx-label">Medicine</span>
              <span class="rx-value">${p.medicineName}</span>
            </div>
            <div class="rx-row">
              <span class="rx-label">Dosage</span>
              <span class="rx-value">${p.dosage}</span>
            </div>
            <div class="rx-row">
              <span class="rx-label">Duration</span>
              <span class="rx-value">${p.duration}</span>
            </div>
            <div class="rx-row" style="border-bottom:none">
              <span class="rx-label">Instructions</span>
              <span class="rx-value">${p.instructions || "As directed by doctor"}</span>
            </div>
          </div>
          <div class="footer">
            <div class="doctor-sign">${p.doctor?.doctorName || "-"}</div>
            <div class="disclaimer">This is a computer generated prescription</div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={styles.wrapper}>

      {/* ===== HEADER ===== */}
      <div style={styles.pageHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIcon}>
            <FaPills />
          </div>
          <div>
            <h1 style={styles.pageTitle}>My Prescriptions</h1>
            <p style={styles.pageSubtitle}>
              {prescriptions.length} prescription{prescriptions.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>
      </div>

      {/* ===== LIST ===== */}
      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p>Loading prescriptions...</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}><FaPills /></div>
          <h3 style={{ color: "#0f172a", margin: "0 0 8px" }}>
            No Prescriptions Yet
          </h3>
          <p style={{ color: "#64748b", margin: 0 }}>
            Your doctor will add prescriptions after consultation
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {prescriptions.map((p, index) => (
            <div key={p.prescriptionId} style={styles.prescCard}>

              {/* Top Row */}
              <div style={styles.prescTop}>
                <div style={styles.prescLeft}>
                  <div style={styles.prescIconWrap}>
                    <FaFileAlt />
                  </div>
                  <div>
                    <p style={styles.prescNumber}>
                      Prescription #{prescriptions.length - index}
                    </p>
                    <div style={styles.prescMeta}>
                      <div style={styles.metaItem}>
                        <FaUserMd style={{ color: "#0ea5e9", fontSize: "13px" }} />
                        <span style={styles.metaValue}>
                          {p.doctor?.doctorName || "-"}
                        </span>
                      </div>
                      {p.doctor?.specialization && (
                        <>
                          <span style={styles.metaDivider}>•</span>
                          <span style={styles.metaSub}>
                            {p.doctor.specialization}
                          </span>
                        </>
                      )}
                      <span style={styles.metaDivider}>•</span>
                      <div style={styles.metaItem}>
                        <FaCalendarCheck style={{ color: "#94a3b8", fontSize: "11px" }} />
                        <span style={styles.metaSub}>
                          {p.prescribedDate || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button style={styles.printBtn} onClick={() => handlePrint(p)}>
                  <FaPrint /> Print
                </button>
              </div>

              {/* Medicine Details */}
              <div style={styles.prescDetails}>
                <div style={styles.medicineHighlight}>
                  <FaPills style={{ color: "#10b981", fontSize: "16px" }} />
                  <span style={styles.medicineName}>{p.medicineName}</span>
                </div>

                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Dosage</span>
                    <span style={styles.detailValue}>{p.dosage}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Duration</span>
                    <div style={styles.detailValueRow}>
                      <FaClock style={{ color: "#94a3b8", fontSize: "11px" }} />
                      <span style={styles.detailValue}>{p.duration}</span>
                    </div>
                  </div>
                  {p.instructions && (
                    <div style={{ ...styles.detailItem, gridColumn: "1 / -1" }}>
                      <span style={styles.detailLabel}>Instructions</span>
                      <span style={{ ...styles.detailValue, color: "#475569" }}>
                        {p.instructions}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    padding: "28px 32px",
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "'Inter', sans-serif"
  },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "24px"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  headerIcon: {
    width: "52px",
    height: "52px",
    background: "linear-gradient(135deg, #059669, #10b981)",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    color: "white",
    boxShadow: "0 4px 12px rgba(16,185,129,0.3)"
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "2px 0 0"
  },
  prescCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px 24px",
    boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0",
    borderLeft: "5px solid #10b981"
  },
  prescTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px"
  },
  prescLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px"
  },
  prescIconWrap: {
    width: "42px",
    height: "42px",
    background: "linear-gradient(135deg, #059669, #10b981)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    color: "white",
    flexShrink: 0
  },
  prescNumber: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 6px"
  },
  prescMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap"
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "5px"
  },
  metaValue: {
    fontWeight: "600",
    color: "#0f172a",
    fontSize: "13px"
  },
  metaSub: {
    fontSize: "13px",
    color: "#64748b"
  },
  metaDivider: {
    color: "#cbd5e1",
    fontSize: "12px"
  },
  printBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "linear-gradient(135deg, #1e40af, #2563eb)",
    color: "white",
    border: "none",
    padding: "9px 18px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 4px 10px rgba(37,99,235,0.25)",
    flexShrink: 0
  },
  prescDetails: {
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "16px 20px"
  },
  medicineHighlight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
    paddingBottom: "14px",
    borderBottom: "1px solid #e2e8f0"
  },
  medicineName: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#0f172a"
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  detailLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: "0.8px",
    textTransform: "uppercase"
  },
  detailValue: {
    fontSize: "14px",
    color: "#374151",
    fontWeight: "500"
  },
  detailValueRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "60px",
    gap: "16px",
    color: "#64748b"
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #e2e8f0",
    borderTopColor: "#10b981",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  emptyState: {
    background: "white",
    borderRadius: "20px",
    textAlign: "center",
    padding: "60px 24px",
    border: "1px solid #e2e8f0"
  },
  emptyIcon: {
    width: "72px",
    height: "72px",
    background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    color: "#10b981",
    margin: "0 auto 20px"
  }
};

export default MyPrescriptions;