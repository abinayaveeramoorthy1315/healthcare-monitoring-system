import React, { useState } from "react";
import api from "../api";
import { FaStar, FaTimes } from "react-icons/fa";

/* inject keyframes once */
if (typeof document !== "undefined" && !document.getElementById("review-modal-kf")) {
  const style = document.createElement("style");
  style.id = "review-modal-kf";
  style.textContent = `
    @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes scaleIn { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  `;
  document.head.appendChild(style);
}

const ReviewModal = ({ appointmentId, doctorId, doctorName, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const patientId = localStorage.getItem("patientId");

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      await api.post("/api/reviews", {
        appointmentId,
        patientId,
        doctorId,
        rating,
        comment,
      });
      onSubmitted();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Unable to submit review. It may already be reviewed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Rate Dr. {doctorName}</h3>
          <FaTimes style={styles.closeIcon} onClick={onClose} />
        </div>

        <p style={styles.subtitle}>How was your appointment experience?</p>

        <div style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              size={32}
              style={{
                cursor: "pointer",
                color: star <= (hoverRating || rating) ? "#f59e0b" : "#e5e7eb",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            />
          ))}
        </div>

        <textarea
          placeholder="Share your experience (optional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          style={styles.textarea}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={styles.submitBtn}
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(15,23,42,.55)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn .2s ease"
  },
  modal: {
    background: "white",
    borderRadius: "20px",
    padding: "32px",
    width: "400px",
    maxWidth: "92%",
    boxShadow: "0 24px 64px rgba(0,0,0,.2), 0 0 0 1px rgba(15,23,42,.05)",
    animation: "scaleIn .25s ease",
    border: "1px solid #e2e8f0"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  title: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-.3px"
  },
  closeIcon: {
    cursor: "pointer",
    color: "#94a3b8",
    fontSize: "16px",
    padding: "4px",
    borderRadius: "6px",
    transition: "color .2s, background .2s"
  },
  subtitle: {
    fontSize: "13.5px",
    color: "#64748b",
    margin: "0 0 22px",
  },
  starsRow: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "22px",
  },
  textarea: {
    width: "100%",
    border: "1.5px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    fontFamily: "'Outfit', sans-serif",
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
    background: "#f8fafc",
    color: "#1a3323",
    transition: "border-color .2s, box-shadow .2s",
    lineHeight: "1.6"
  },
  error: {
    color: "#dc2626",
    fontSize: "13px",
    margin: "10px 0 0",
    fontWeight: "500"
  },
  submitBtn: {
    width: "100%",
    marginTop: "18px",
    padding: "13px",
    background: "linear-gradient(135deg, #35663f, #528b5e)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(82,139,94,.35)",
    fontFamily: "'Outfit', sans-serif",
    transition: "all .25s ease",
    letterSpacing: ".2px"
  },
};

export default ReviewModal;