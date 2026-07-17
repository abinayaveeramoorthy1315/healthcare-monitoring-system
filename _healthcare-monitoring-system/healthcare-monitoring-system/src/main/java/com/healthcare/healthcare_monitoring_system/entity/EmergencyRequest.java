package com.healthcare.healthcare_monitoring_system.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "emergency_requests")
public class EmergencyRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientName;

    private String doctorName;

    private String emergencyMessage;

    private String status;

    private LocalDateTime createdAt;
    
    private Double latitude;

    private Double longitude;

    private String locationLink;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "assigned_doctor_id")
    private Long assignedDoctorId;

    @Column(name = "emergency_status")
    private String emergencyStatus;

    @Column(name = "emergency_severity")
    private String emergencySeverity;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "ambulance_status")
    private String ambulanceStatus;

    @Column(name = "ambulance_driver")
    private String ambulanceDriver;

    private String eta;

    @Column(name = "live_latitude")
    private Double liveLatitude;

    @Column(name = "live_longitude")
    private Double liveLongitude;

    @Column(name = "notifications_sent")
    private Boolean notificationsSent = false;

    public EmergencyRequest() {
        this.createdAt = LocalDateTime.now();
        this.status = "PENDING";
        this.emergencyStatus = "PENDING";
        this.emergencySeverity = "HIGH";
        this.ambulanceStatus = "DISPATCHED";
        this.notificationsSent = false;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id=id;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName=patientName;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName=doctorName;
    }

    public String getEmergencyMessage() {
        return emergencyMessage;
    }

    public void setEmergencyMessage(String emergencyMessage) {
        this.emergencyMessage=emergencyMessage;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status=status;
        if (status != null) {
            this.emergencyStatus = status;
        }
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt=createdAt;
    }
    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
        this.liveLatitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
        this.liveLongitude = longitude;
    }

    public String getLocationLink() {
        return locationLink;
    }

    public void setLocationLink(String locationLink) {
        this.locationLink = locationLink;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getAssignedDoctorId() {
        return assignedDoctorId;
    }

    public void setAssignedDoctorId(Long assignedDoctorId) {
        this.assignedDoctorId = assignedDoctorId;
    }

    public String getEmergencyStatus() {
        return emergencyStatus != null ? emergencyStatus : status;
    }

    public void setEmergencyStatus(String emergencyStatus) {
        this.emergencyStatus = emergencyStatus;
        if (emergencyStatus != null) {
            this.status = emergencyStatus;
        }
    }

    public String getEmergencySeverity() {
        return emergencySeverity;
    }

    public void setEmergencySeverity(String emergencySeverity) {
        this.emergencySeverity = emergencySeverity;
    }

    public LocalDateTime getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public String getAmbulanceStatus() {
        return ambulanceStatus;
    }

    public void setAmbulanceStatus(String ambulanceStatus) {
        this.ambulanceStatus = ambulanceStatus;
    }

    public String getAmbulanceDriver() {
        return ambulanceDriver;
    }

    public void setAmbulanceDriver(String ambulanceDriver) {
        this.ambulanceDriver = ambulanceDriver;
    }

    public String getEta() {
        return eta;
    }

    public void setEta(String eta) {
        this.eta = eta;
    }

    public Double getLiveLatitude() {
        return liveLatitude != null ? liveLatitude : latitude;
    }

    public void setLiveLatitude(Double liveLatitude) {
        this.liveLatitude = liveLatitude;
        this.latitude = liveLatitude;
    }

    public Double getLiveLongitude() {
        return liveLongitude != null ? liveLongitude : longitude;
    }

    public void setLiveLongitude(Double liveLongitude) {
        this.liveLongitude = liveLongitude;
        this.longitude = liveLongitude;
    }

    public Boolean getNotificationsSent() {
        return notificationsSent != null ? notificationsSent : false;
    }

    public void setNotificationsSent(Boolean notificationsSent) {
        this.notificationsSent = notificationsSent;
    }
}
