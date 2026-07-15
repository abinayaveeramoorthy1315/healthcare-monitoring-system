package com.healthcare.healthcare_monitoring_system.dto;

public class SymptomRequestDTO {
    private String patientId;
    private String symptoms;

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }
}