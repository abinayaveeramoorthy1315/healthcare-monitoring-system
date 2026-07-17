import React, { useState, useRef } from "react";
import api from "../api";
import { FaCamera, FaExclamationTriangle, FaUpload, FaUserMd, FaStar } from "react-icons/fa";

const SkinChecker = () => {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    setFile(selected);
    setResult(null);
    setDoctors([]);
    setError("");
    setPreview(URL.createObjectURL(selected));
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);
    setDoctors([]);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await api.post("/api/skin-analysis/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(res.data);

      // Find available doctors matching suggested specialization
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
      setError("Unable to analyze the image right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "mild": return "#15803d";
      case "moderate": return "#b45309";
      case "severe": return "#dc2626";
      default: return "#64748b";
    }
  };

  const handleBookNow = (doctorId) => {
    localStorage.setItem("preSelectedDoctorId", doctorId);
    localStorage.setItem("cameFromSymptomChecker", "true");
    window.location.href = "/book-appointment";
  };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "24px 16px", fontFamily: "'Outfit', sans-serif" }}>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <div style={{
          background: "linear-gradient(135deg, #35663f, #528b5e)", color: "white", width: "52px", height: "52px",
          borderRadius: "12px", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "22px", flexShrink: 0,
          boxShadow: "0 4px 12px rgba(82,139,94,0.3)"
        }}>
          <FaCamera />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", color: "#1a3323" }}>AI Skin Checker</h2>
          <p style={{ margin: "4px 0 0", color: "#5c7564", fontSize: "14px" }}>
            Upload a photo of a skin condition or wound for AI guidance
          </p>
        </div>
      </div>

      <div style={{
        background: "white", borderRadius: "16px", padding: "24px",
        boxShadow: "0 4px 20px rgba(15,23,42,0.06)", border: "1px solid #e2e8f0", marginBottom: "20px"
      }}>
        <div
          onClick={() => fileInputRef.current.click()}
          style={{
            border: "2px dashed #cbd5e1", borderRadius: "12px", padding: "32px",
            textAlign: "center", cursor: "pointer", background: "#f8fafc"
          }}
        >
          {preview ? (
            <img src={preview} alt="preview" style={{ maxHeight: "220px", borderRadius: "10px", margin: "0 auto" }} />
          ) : (
            <>
              <FaUpload style={{ fontSize: "28px", color: "#94a3b8", marginBottom: "10px" }} />
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                Click to upload a photo (JPG, PNG)
              </p>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "10px" }}>{error}</p>}

        <button
          onClick={handleAnalyze}
          disabled={loading || !file}
          style={{
            width: "100%", marginTop: "16px", padding: "12px",
            background: "linear-gradient(135deg, #35663f, #528b5e)",
            color: "white", border: "none", borderRadius: "10px",
            fontSize: "14px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 12px rgba(82,139,94,0.3)"
          }}
        >
          {loading ? "Analyzing..." : "Analyze Image"}
        </button>
      </div>

      {result && (
        <div style={{
          background: "white", borderRadius: "16px", padding: "24px",
          boxShadow: "0 4px 20px rgba(15,23,42,0.06)", border: "1px solid #e2e8f0",
          marginBottom: "20px"
        }}>
          <div style={{
            display: "inline-block", color: "white", padding: "6px 16px",
            borderRadius: "20px", fontSize: "13px", fontWeight: "700",
            marginBottom: "16px", textTransform: "uppercase",
            background: getSeverityColor(result.severity)
          }}>
            {result.severity} Severity
          </div>

          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 4px", fontSize: "13px", color: "#6b7280", textTransform: "uppercase" }}>
              Observation
            </h4>
            <p style={{ margin: 0, fontSize: "15px", color: "#111827" }}>{result.observation}</p>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 4px", fontSize: "13px", color: "#6b7280", textTransform: "uppercase" }}>
              Recommendation
            </h4>
            <p style={{ margin: 0, fontSize: "15px", color: "#111827" }}>{result.recommendation}</p>
          </div>

          <div style={{
            display: "flex", alignItems: "flex-start", gap: "8px",
            background: "#fef3c7", padding: "12px", borderRadius: "8px",
            fontSize: "13px", color: "#92400e"
          }}>
            <FaExclamationTriangle style={{ marginTop: "2px", flexShrink: 0 }} />
            <span>
              This is not a medical diagnosis. Please consult a {result.suggestedSpecialization} for accurate evaluation.
            </span>
          </div>
        </div>
      )}

      {doctors.length > 0 && (
        <div style={{
          background: "white", borderRadius: "16px", padding: "24px",
          boxShadow: "0 4px 20px rgba(15,23,42,0.06)", border: "1px solid #e2e8f0"
        }}>
          <h4 style={{
            display: "flex", alignItems: "center", gap: "8px",
            margin: "0 0 16px", color: "#0f172a", fontSize: "16px", fontWeight: "700"
          }}>
            <FaUserMd /> Recommended Dermatologists for You
          </h4>
          {doctors.map((doc) => (
            <div key={doc.doctorId} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 0", borderBottom: "1px solid #f1f5f9"
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
                  background: "linear-gradient(135deg, #35663f, #528b5e)",
                  color: "white", border: "none", padding: "10px 22px",
                  borderRadius: "10px", fontSize: "13px", fontWeight: "700",
                  cursor: "pointer", boxShadow: "0 4px 12px rgba(82,139,94,0.3)"
                }}
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      )}

      {result && doctors.length === 0 && (
        <div style={{
          background: "#fef3c7", color: "#92400e", padding: "14px",
          borderRadius: "8px", fontSize: "14px", textAlign: "center"
        }}>
          No {result.suggestedSpecialization} doctors have available slots right now.
          Please check the Book Appointment page or try again later.
        </div>
      )}
    </div>
  );
};

export default SkinChecker;