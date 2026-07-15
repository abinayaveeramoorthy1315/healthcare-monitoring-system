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
              padding: "14px 0",
              borderBottom: "1px solid #f1f5f9"
            }}>
              <div>
                <strong style={{ fontSize: "15px", color: "#0f172a", textTransform: "capitalize" }}>
                  {doc.doctorName}
                </strong>
                <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#64748b", textTransform: "capitalize" }}>
                  {doc.specialization} · {doc.availableSlotCount} slots available
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                  {doc.totalReviews > 0 ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <FaStar
                          key={i}
                          size={13}
                          color={i <= Math.round(doc.averageRating) ? "#f59e0b" : "#e5e7eb"}
                        />
                      ))}
                      <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "4px" }}>
                        {doc.averageRating} ({doc.totalReviews} reviews)
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>No reviews yet</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleBookNow(doc.doctorId)}
                style={{
                  background: "linear-gradient(135deg, #1e40af, #2563eb)",
                  color: "white",
                  border: "none",
                  padding: "10px 22px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
                }}
              >
                Book Now
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