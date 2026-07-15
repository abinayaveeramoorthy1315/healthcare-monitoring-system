package com.healthcare.healthcare_monitoring_system.dto;

public class SkinAnalysisResponseDTO {
    private String severity;
    private String observation;
    private String recommendation;
    private String suggestedSpecialization;

    public SkinAnalysisResponseDTO() {}

    public SkinAnalysisResponseDTO(String severity, String observation,
                                    String recommendation, String suggestedSpecialization) {
        this.severity = severity;
        this.observation = observation;
        this.recommendation = recommendation;
        this.suggestedSpecialization = suggestedSpecialization;
    }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getObservation() { return observation; }
    public void setObservation(String observation) { this.observation = observation; }

    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }

    public String getSuggestedSpecialization() { return suggestedSpecialization; }
    public void setSuggestedSpecialization(String suggestedSpecialization) { this.suggestedSpecialization = suggestedSpecialization; }
}