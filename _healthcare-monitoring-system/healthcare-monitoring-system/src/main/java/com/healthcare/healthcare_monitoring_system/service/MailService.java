package com.healthcare.healthcare_monitoring_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class MailService {

    @Autowired
    private EmailTemplateService emailTemplateService;

    public void sendStatusMail(
            String to,
            String patientName,
            String doctorName,
            String date,
            String time,
            String status
    ) {
        if ("BOOKED".equalsIgnoreCase(status) || "ACCEPTED".equalsIgnoreCase(status)) {
            sendAppointmentConfirmedToPatient(to, patientName, doctorName, "General Medicine", date, time, "Smart Hospital City Center", "N/A");
        } else {
            sendAppointmentRejectedToPatient(to, patientName, doctorName, date, time, "Schedule conflict / Doctor unavailable", "N/A");
        }
    }

    public void sendAppointmentMail(
            String to,
            String patientName,
            String doctorName,
            String date,
            String time
    ) {
        emailTemplateService.sendAppointmentBookedMail(to, patientName, doctorName, "General Medicine", date, time, "Smart Hospital City Center");
    }

    // =========================================================================
    // 1. APPOINTMENT REQUEST -> DOCTOR ONLY
    // =========================================================================
    public boolean sendAppointmentRequestToDoctor(
            String toDoctorEmail,
            String doctorName,
            String patientName,
            String date,
            String time,
            String patientPhone,
            String patientEmail,
            String notes
    ) {
        System.out.println("=== Debug Log: sendAppointmentRequestToDoctor ===");
        System.out.println("Debug Log - Doctor email: " + (toDoctorEmail != null ? toDoctorEmail : "null"));
        System.out.println("Debug Log - Patient email: " + (patientEmail != null ? patientEmail : "null"));
        System.out.println("Debug Log - Appointment status: PENDING");
        
        if (toDoctorEmail == null || toDoctorEmail.trim().isEmpty()) {
            System.err.println("Debug Log - Mail failure reason: Doctor email address is null or empty");
            return false;
        }
        
        boolean sent = emailTemplateService.sendDoctorAppointmentRequestMail(
                toDoctorEmail, doctorName, patientName, date, time, patientPhone, patientEmail, notes
        );
        if (sent) {
            System.out.println("Debug Log - Mail sent successfully");
        } else {
            System.err.println("Debug Log - Mail failure reason: SMTP delivery failed or recipient rejected");
        }
        return sent;
    }

    // =========================================================================
    // 2. APPOINTMENT CONFIRMED -> PATIENT ONLY
    // =========================================================================
    public boolean sendAppointmentConfirmedToPatient(
            String toPatientEmail,
            String patientName,
            String doctorName,
            String specialization,
            String date,
            String time,
            String hospital,
            String doctorEmail
    ) {
        System.out.println("=== Debug Log: sendAppointmentConfirmedToPatient ===");
        System.out.println("Debug Log - Doctor email: " + (doctorEmail != null ? doctorEmail : "null"));
        System.out.println("Debug Log - Patient email: " + (toPatientEmail != null ? toPatientEmail : "null"));
        System.out.println("Debug Log - Appointment status: BOOKED");
        
        if (toPatientEmail == null || toPatientEmail.trim().isEmpty()) {
            System.err.println("Debug Log - Mail failure reason: Patient email address is null or empty");
            return false;
        }
        
        boolean sent = emailTemplateService.sendAppointmentApprovedMail(
                toPatientEmail, patientName, doctorName, specialization, date, time, hospital
        );
        if (sent) {
            System.out.println("Debug Log - Mail sent successfully");
        } else {
            System.err.println("Debug Log - Mail failure reason: SMTP delivery failed or recipient rejected");
        }
        return sent;
    }

    // =========================================================================
    // 3. APPOINTMENT REJECTED -> PATIENT ONLY
    // =========================================================================
    public boolean sendAppointmentRejectedToPatient(
            String toPatientEmail,
            String patientName,
            String doctorName,
            String date,
            String time,
            String reason,
            String doctorEmail
    ) {
        System.out.println("=== Debug Log: sendAppointmentRejectedToPatient ===");
        System.out.println("Debug Log - Doctor email: " + (doctorEmail != null ? doctorEmail : "null"));
        System.out.println("Debug Log - Patient email: " + (toPatientEmail != null ? toPatientEmail : "null"));
        System.out.println("Debug Log - Appointment status: CANCELLED");
        
        if (toPatientEmail == null || toPatientEmail.trim().isEmpty()) {
            System.err.println("Debug Log - Mail failure reason: Patient email address is null or empty");
            return false;
        }
        
        boolean sent = emailTemplateService.sendAppointmentRejectedMail(
                toPatientEmail, patientName, doctorName, date, time, reason
        );
        if (sent) {
            System.out.println("Debug Log - Mail sent successfully");
        } else {
            System.err.println("Debug Log - Mail failure reason: SMTP delivery failed or recipient rejected");
        }
        return sent;
    }

    public boolean sendAppointmentConfirmedToPatient(
            String toPatientEmail,
            String patientName,
            String doctorName,
            String specialization,
            String date,
            String time,
            String hospital
    ) {
        return sendAppointmentConfirmedToPatient(toPatientEmail, patientName, doctorName, specialization, date, time, hospital, "N/A");
    }

    public boolean sendAppointmentRejectedToPatient(
            String toPatientEmail,
            String patientName,
            String doctorName,
            String date,
            String time,
            String reason
    ) {
        return sendAppointmentRejectedToPatient(toPatientEmail, patientName, doctorName, date, time, reason, "N/A");
    }

    public void sendEmergencyMail(
            String to,
            String patientName,
            String doctorName,
            String messageText,
            String locationLink,
            Double latitude,
            Double longitude
    ) {
        sendEmergencyMailRich(
                to,
                "Assigned Doctor",
                patientName,
                doctorName,
                messageText,
                "HIGH",
                "Heart Rate & O2 Level Monitoring Active",
                locationLink,
                latitude,
                longitude,
                1L,
                "DISPATCHED",
                "Assigned Driver",
                "8 mins"
        );
    }

    public void sendEmergencyMailRich(
            String to,
            String recipientRole,
            String patientName,
            String doctorName,
            String emergencyType,
            String severity,
            String vitalSignsSummary,
            String locationLink,
            Double latitude,
            Double longitude,
            Long sosId,
            String ambulanceStatus,
            String ambulanceDriver,
            String eta
    ) {
        String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        if (recipientRole != null && recipientRole.toLowerCase().contains("doctor")) {
            emailTemplateService.sendDoctorEmergencyAssignedMail(to, doctorName, patientName, emergencyType, vitalSignsSummary, latitude, longitude, severity, "http://localhost:5173/dashboard");
        } else {
            emailTemplateService.sendEmergencySosMail(to, patientName, latitude, longitude, locationLink, doctorName, timeStr, ambulanceStatus);
        }
    }
}
