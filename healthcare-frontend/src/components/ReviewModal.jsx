import React, { useState } from "react";
import api from "../api";
import { FaStar, FaTimes } from "react-icons/fa";

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
    background: "rgba(15,23,42,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: "16px",
    padding: "28px",
    width: "380px",
    maxWidth: "90%",
    boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },
  closeIcon: {
    cursor: "pointer",
    color: "#94a3b8",
    fontSize: "16px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 18px",
  },
  starsRow: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
    marginBottom: "18px",
  },
  textarea: {
    width: "100%",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
  },
  error: {
    color: "#dc2626",
    fontSize: "13px",
    margin: "10px 0 0",
  },
  submitBtn: {
    width: "100%",
    marginTop: "16px",
    padding: "12px",
    background: "linear-gradient(135deg, #1e40af, #2563eb)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
  },
};

export default ReviewModal;