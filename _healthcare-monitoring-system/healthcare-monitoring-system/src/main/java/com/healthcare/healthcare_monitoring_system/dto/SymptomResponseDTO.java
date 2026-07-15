package com.healthcare.healthcare_monitoring_system.dto;

public class SymptomResponseDTO {
    private String severity;       // Mild / Moderate / Severe
    private String possibleCauses;
    private String recommendation;
    private String suggestedSpecialization;

    public SymptomResponseDTO() {}

    public SymptomResponseDTO(String severity, String possibleCauses,
                               String recommendation, String suggestedSpecialization) {
        this.severity = severity;
        this.possibleCauses = possibleCauses;
        this.recommendation = recommendation;
        this.suggestedSpecialization = suggestedSpecialization;
    }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getPossibleCauses() { return possibleCauses; }
    public void setPossibleCauses(String possibleCauses) { this.possibleCauses = possibleCauses; }

    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }

    public String getSuggestedSpecialization() { return suggestedSpecialization; }
    public void setSuggestedSpecialization(String suggestedSpecialization) { this.suggestedSpecialization = suggestedSpecialization; }
}