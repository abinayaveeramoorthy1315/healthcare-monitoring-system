package com.healthcare.healthcare_monitoring_system.dto;

import com.healthcare.healthcare_monitoring_system.entity.Patient;

public class AiPredictionResponse {

    private Long predictionId;
    private Patient patient;
    private String risk;
    private Double confidence;
    private String reason;
    private String recommendation;

    public AiPredictionResponse() {
    }

    public AiPredictionResponse(String risk, Double confidence, String reason, String recommendation) {
        this.risk = risk;
        this.confidence = confidence;
        this.reason = reason;
        this.recommendation = recommendation;
    }

    public Long getPredictionId() {
        return predictionId;
    }

    public void setPredictionId(Long predictionId) {
        this.predictionId = predictionId;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public String getRisk() {
        return risk;
    }

    public void setRisk(String risk) {
        this.risk = risk;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }
}
