import React, { useState } from "react";
import api from "../api";
import { FaStethoscope, FaExclamationTriangle, FaUserMd, FaStar } from "react-icons/fa";
import "./SymptomChecker.css";

const SymptomChecker = () => {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const patientId = localStorage.getItem("patientId");

  const handleCheck = async () => {
    if (!symptoms.trim()) {
      setError("Please enter your symptoms.");
      return;
    }

    setError("");
    setResult(null);
    setDoctors([]);
    setLoading(true);

    try {
      const res = await api.post("/api/symptom-checker/analyze", {
        patientId: patientId,
        symptoms: symptoms,
      });
      setResult(res.data);

      const doctorsRes = await api.get("/api/doctors");
      const suggested = (res.data.suggestedSpecialization || "").trim().toLowerCase();

      let matched = doctorsRes.data.filter(
        (doc) => doc.specialization?.trim().toLowerCase() === suggested
      );

      if (matched.length === 0) {
        matched = doctorsRes.data.filter(
          (doc) =>
            doc.specialization?.trim().toLowerCase().includes(suggested) ||
            suggested.includes(doc.specialization?.trim().toLowerCase())
        );
      }

      const availableDoctors = [];
      for (const doc of matched) {
        try {
          const slotsRes = await api.get(`/api/slots/available/${doc.doctorId}`);
          if (slotsRes.data && slotsRes.data.length > 0) {
            let ratingInfo = { averageRating: 0, totalReviews: 0 };
            try {
              const ratingRes = await api.get(`/api/reviews/doctor/${doc.doctorId}/summary`);
              ratingInfo = ratingRes.data;
            } catch (err) {
              console.error("Rating fetch failed", err);
            }

            availableDoctors.push({
              ...doc,
              availableSlotCount: slotsRes.data.length,
              nextAvailableDate: slotsRes.data[0]?.slotDate || "N/A",
              averageRating: ratingInfo.averageRating || 0,
              totalReviews: ratingInfo.totalReviews || 0,
            });
          }
        } catch (err) {
          console.error(`Failed to check slots for doctor ${doc.doctorId}`, err);
        }
      }

      availableDoctors.sort((a, b) => b.averageRating - a.averageRating);
      setDoctors(availableDoctors);
    } catch (err) {
      console.error(err);
      setError("Unable to analyze symptoms right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "mild":
        return "#15803d";
      case "moderate":
        return "#b45309";
      case "severe":
        return "#dc2626";
      default:
        return "#64748b";
    }
  };

  const handleBookNow = (doctorId) => {
    localStorage.setItem("preSelectedDoctorId", doctorId);
    localStorage.setItem("cameFromSymptomChecker", "true");
    window.location.href = "/book-appointment";
  };

  return (
    <div className="symptom-checker-wrapper">
      <div className="symptom-header">
        <div className="symptom-icon">
          <FaStethoscope />
        </div>
        <div>
          <h2>AI Symptom Checker</h2>
          <p>Describe your symptoms and get instant AI-powered guidance</p>
        </div>
      </div>

      <div className="symptom-input-card">
        <label>What symptoms are you experiencing?</label>
        <textarea
          rows={4}
          placeholder="e.g. fever, headache, body pain..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
        />
        {error && <p className="symptom-error">{error}</p>}
        <button onClick={handleCheck} disabled={loading}>
          {loading ? "Analyzing..." : "Check Symptoms"}
        </button>
      </div>

      {result && (
        <div className="symptom-result-card">
          <div
            className="severity-badge"
            style={{ background: getSeverityColor(result.severity) }}
          >
            {result.severity} Severity
          </div>

          <div className="result-section">
            <h4>Possible Causes</h4>
            <p>{result.possibleCauses}</p>
          </div>

          <div className="result-section">
            <h4>Recommendation</h4>
            <p>{result.recommendation}</p>
          </div>

          <div className="result-section">
            <h4>Suggested Specialist</h4>
            <p>{result.suggestedSpecialization}</p>
          </div>

          <div className="disclaimer">
            <FaExclamationTriangle />
            <span>
              This is not a medical diagnosis. Please consult a doctor for
              accurate evaluation.
            </span>
          </div>
        </div>
      )}

      {doctors.length > 0 && (
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(15,23,42,0.06)",
          border: "1px solid #e2e8f0",
          marginTop: "20px"
        }}>
          <h4 style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: "0 0 16px",
            color: "#0f172a",
            fontSize: "16px",
            fontWeight: "700"
          }}>
            <FaUserMd /> Recommended Doctors for You
          </h4>
          {doctors.map((doc) => (
            <div key={doc.doctorId} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "14px",
              border: "1px solid #cbd5e1",
              marginBottom: "12px",
              flexWrap: "wrap",
              gap: "12px"
            }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <div style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: "800",
                  flexShrink: 0,
                  boxShadow: "0 4px 10px rgba(14,165,233,0.3)"
                }}>
                  {doc.doctorName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "16px", color: "#0f172a", textTransform: "capitalize" }}>
                      Dr. {doc.doctorName}
                    </strong>
                    <span style={{
                      background: "#ede9fe",
                      color: "#6d28d9",
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "12px"
                    }}>
                      Senior Consultant · 10+ Yrs Exp
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 6px", fontSize: "13px", color: "#475569", fontWeight: "600", textTransform: "capitalize" }}>
                    {doc.specialization} · <span style={{ color: "#16a34a" }}>🟢 {doc.availableSlotCount} slots available</span>
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {doc.totalReviews > 0 ? (
                        <>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <FaStar
                              key={i}
                              size={13}
                              color={i <= Math.round(doc.averageRating) ? "#f59e0b" : "#e5e7eb"}
                            />
                          ))}
                          <span style={{ fontSize: "12px", color: "#475569", marginLeft: "4px", fontWeight: "600" }}>
                            {doc.averageRating} ({doc.totalReviews} reviews)
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>★ 4.9 (Verified Specialist)</span>
                      )}
                    </div>
                    {doc.nextAvailableDate && (
                      <span style={{
                        background: "#dcfce7",
                        color: "#15803d",
                        fontSize: "12px",
                        fontWeight: "700",
                        padding: "3px 10px",
                        borderRadius: "8px"
                      }}>
                        📅 Next Slot: {doc.nextAvailableDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleBookNow(doc.doctorId)}
                style={{
                  background: "linear-gradient(135deg, #35663f, #528b5e)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(82,139,94,0.3)",
                  transition: "all 0.2s"
                }}
              >
                Instant Direct Booking →
              </button>
            </div>
          ))}
        </div>
      )}

      {result && doctors.length === 0 && (
        <div className="no-doctors-msg">
          No {result.suggestedSpecialization} doctors have available slots right now.
          Please check the Book Appointment page or try again later.
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;