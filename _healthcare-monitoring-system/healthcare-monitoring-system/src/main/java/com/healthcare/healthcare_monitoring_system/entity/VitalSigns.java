package com.healthcare.healthcare_monitoring_system.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "vital_signs")
public class VitalSigns {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long vitalId;

    private Integer heartRate;

    private String bloodPressure;

    private Double temperature;

    private Integer oxygenLevel;

    private String riskLevel;

    private LocalDateTime recordedAt;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    public VitalSigns() {
        this.recordedAt = LocalDateTime.now();
    }

    public Long getVitalId() {
        return vitalId;
    }

    public void setVitalId(Long vitalId) {
        this.vitalId = vitalId;
    }

    public Integer getHeartRate() {
        return heartRate;
    }

    public void setHeartRate(Integer heartRate) {
        this.heartRate = heartRate;
    }

    public String getBloodPressure() {
        return bloodPressure;
    }

    public void setBloodPressure(String bloodPressure) {
        this.bloodPressure = bloodPressure;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Integer getOxygenLevel() {
        return oxygenLevel;
    }

    public void setOxygenLevel(Integer oxygenLevel) {
        this.oxygenLevel = oxygenLevel;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }
}