package com.healthcare.healthcare_monitoring_system.dto;



public class ChatRequestDTO {
    private String patientId;
    private String message;

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}