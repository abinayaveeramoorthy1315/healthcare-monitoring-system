package com.healthcare.healthcare_monitoring_system.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.healthcare.healthcare_monitoring_system.entity.Appointment;
import com.healthcare.healthcare_monitoring_system.entity.Doctor;
import com.healthcare.healthcare_monitoring_system.entity.Patient;
import com.healthcare.healthcare_monitoring_system.repository.AppointmentRepository;
import com.healthcare.healthcare_monitoring_system.repository.DoctorRepository;
import com.healthcare.healthcare_monitoring_system.repository.PatientRepository;
import com.healthcare.healthcare_monitoring_system.repository.UserRepository;
import com.healthcare.healthcare_monitoring_system.repository.DoctorSlotRepository;
import com.healthcare.healthcare_monitoring_system.entity.DoctorSlot;
import java.time.LocalDate;
import com.healthcare.healthcare_monitoring_system.service.MailService;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MailService mailService;

    @Autowired
    private EmailTemplateService emailTemplateService;

    @Autowired
    private DoctorSlotRepository doctorSlotRepository;

    // Save Appointment
    public Appointment saveAppointment(Appointment appointment) {

        // 1. Resolve Doctor from doctorId if doctor object is null
        if (appointment.getDoctor() == null && appointment.getDoctorId() != null) {
            doctorRepository.findById(appointment.getDoctorId()).ifPresent(appointment::setDoctor);
        }

        // 2. Resolve Patient from patientId or username if patient object is null
        if (appointment.getPatient() == null) {
            if (appointment.getPatientId() != null) {
                patientRepository.findById(appointment.getPatientId()).ifPresent(appointment::setPatient);
            } else if (appointment.getUsername() != null && !appointment.getUsername().trim().isEmpty()) {
                String unameClean = appointment.getUsername().trim().toLowerCase().replace(" ", "");
                patientRepository.findAll().stream()
                        .filter(p -> p.getName() != null && p.getName().trim().toLowerCase().replace(" ", "").equals(unameClean))
                        .findFirst()
                        .ifPresent(appointment::setPatient);
            }
        }

        // 3. Resolve Date and Time from slotId if present
        if (appointment.getSlotId() != null) {
            doctorSlotRepository.findById(appointment.getSlotId()).ifPresent(slot -> {
                if (appointment.getAppointmentDate() == null || appointment.getAppointmentDate().isEmpty()) {
                    appointment.setAppointmentDate(slot.getSlotDate().toString());
                }
                if (appointment.getAppointmentTime() == null || appointment.getAppointmentTime().isEmpty()) {
                    appointment.setAppointmentTime(slot.getStartTime() + " - " + slot.getEndTime());
                }
                slot.setBooked(true);
                doctorSlotRepository.save(slot);
            });
        }

        if (appointment.getStatus() == null || appointment.getStatus().trim().isEmpty() || !"PENDING".equalsIgnoreCase(appointment.getStatus())) {
            appointment.setStatus("PENDING");
        }

        Appointment saved = appointmentRepository.save(appointment);

        // ==========================
        // Doctor Notification & Email (When appointment is booked/requested by patient)
        // ==========================
        try {
            Doctor doctor = saved.getDoctor();
            Patient patient = saved.getPatient();
            if (doctor != null) {
                String patientName = patient != null ? patient.getName() : "Patient";
                String patientPhone = patient != null ? patient.getPhone() : "N/A";
                String patientEmail = patient != null ? patient.getEmail() : "N/A";
                String doctorEmail = doctor.getEmail();

                if (doctor.getUserId() != null) {
                    userRepository.findById(doctor.getUserId()).ifPresent(user -> {
                        notificationService.createNotification(
                                user.getUsername(),
                                "📅 New appointment request from " + patientName + " on " + saved.getAppointmentDate() + " (" + saved.getAppointmentTime() + ")"
                        );
                    });
                }
                
                System.out.println("\n--- [Appointment Workflow: Patient Booking] ---");
                if (doctorEmail != null && !doctorEmail.trim().isEmpty()) {
                    mailService.sendAppointmentRequestToDoctor(
                            doctorEmail,
                            doctor.getDoctorName(),
                            patientName,
                            saved.getAppointmentDate(),
                            saved.getAppointmentTime(),
                            patientPhone,
                            patientEmail,
                            saved.getReason()
                    );
                } else {
                    System.err.println("Debug Log - Mail failure reason: Doctor email address is missing");
                }
            }
        } catch (Exception e) {
            System.err.println("Notice: Doctor notification/email error during booking: " + e.getMessage());
        }

        // Note: As per workflow requirements, patient notification and confirmation mail are sent once doctor confirms via updateStatus.
        return saved;
    }

    // Get All
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    // Update
    public Appointment updateAppointment(Long id, Appointment appointment) {

        Appointment existing = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        existing.setAppointmentDate(appointment.getAppointmentDate());
        existing.setAppointmentTime(appointment.getAppointmentTime());
        existing.setStatus(appointment.getStatus());
        existing.setPatient(appointment.getPatient());
        existing.setDoctor(appointment.getDoctor());

        return appointmentRepository.save(existing);
    }

    // Update Status
    public ResponseEntity<?> updateStatus(Long id, String status) {

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus(status);
        appointmentRepository.save(appointment);

        boolean isConfirmed = "BOOKED".equalsIgnoreCase(status) || "ACCEPTED".equalsIgnoreCase(status) || "CONFIRMED".equalsIgnoreCase(status);

        if (!isConfirmed && ("CANCELLED".equalsIgnoreCase(status) || "REJECTED".equalsIgnoreCase(status))) {
            try {
                if (appointment.getDoctor() != null && appointment.getAppointmentDate() != null && appointment.getAppointmentTime() != null) {
                    Long doctorId = appointment.getDoctor().getDoctorId();
                    LocalDate slotDate = LocalDate.parse(appointment.getAppointmentDate());
                    String startTime = appointment.getAppointmentTime().split(" - ")[0].trim();

                    doctorSlotRepository.findByDoctor_DoctorIdAndSlotDateAndStartTime(doctorId, slotDate, startTime)
                            .ifPresent(slot -> {
                                slot.setBooked(false);
                                doctorSlotRepository.save(slot);
                            });
                }
            } catch (Exception e) {
                System.err.println("Failed to restore slot availability on cancellation: " + e.getMessage());
            }
        }

        // ===========================
        // Patient In-App & Email Notification on Doctor Confirmation/Rejection
        // ===========================
        try {
            Patient patient = appointment.getPatient();
            Doctor doctor = appointment.getDoctor();

            if (patient != null) {
                String targetUsername = "";
                if (patient.getUserId() != null) {
                    targetUsername = userRepository.findById(patient.getUserId())
                            .map(u -> u.getUsername())
                            .orElse("");
                }
                if (targetUsername.isEmpty() && patient.getName() != null) {
                    targetUsername = patient.getName().toLowerCase().replace(" ", "");
                }

                String docName = doctor != null ? doctor.getDoctorName() : "Doctor";
                String docEmail = doctor != null ? doctor.getEmail() : "N/A";
                String spec = doctor != null ? doctor.getSpecialization() : "General Medicine";
                String patientEmail = patient.getEmail();

                String msg = isConfirmed
                        ? "✅ Your appointment with Dr. " + docName + " on " + appointment.getAppointmentDate() + " (" + appointment.getAppointmentTime() + ") has been confirmed!"
                        : "❌ Your appointment with Dr. " + docName + " on " + appointment.getAppointmentDate() + " has been cancelled/rejected.";

                if (!targetUsername.isEmpty()) {
                    notificationService.createNotification(targetUsername, msg);
                }

                if (isConfirmed) {
                    System.out.println("\n--- [Appointment Workflow: Doctor Acceptance] ---");
                    if (patientEmail != null && !patientEmail.trim().isEmpty()) {
                        mailService.sendAppointmentConfirmedToPatient(
                                patientEmail,
                                patient.getName(),
                                docName,
                                spec,
                                appointment.getAppointmentDate(),
                                appointment.getAppointmentTime(),
                                "Smart Healthcare City Center",
                                docEmail
                        );
                    } else {
                        System.err.println("Debug Log - Mail failure reason: Patient email address is missing");
                    }
                } else {
                    System.out.println("\n--- [Appointment Workflow: Doctor Rejection] ---");
                    if (patientEmail != null && !patientEmail.trim().isEmpty()) {
                        mailService.sendAppointmentRejectedToPatient(
                                patientEmail,
                                patient.getName(),
                                docName,
                                appointment.getAppointmentDate(),
                                appointment.getAppointmentTime(),
                                "Schedule conflict / Cancelled by doctor",
                                docEmail
                        );
                    } else {
                        System.err.println("Debug Log - Mail failure reason: Patient email address is missing");
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error sending status update notification/mail to patient: " + e.getMessage());
        }

        return ResponseEntity.ok(appointment);
    }
  
    // Doctor Appointments
    public List<Appointment> getAppointmentsByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctor_DoctorId(doctorId);
    }

    // Patient Appointments
    public List<Appointment> getAppointmentsByPatient(Long patientId) {
        return appointmentRepository.findByPatient_PatientId(patientId);
    }

    // Delete
    public void deleteAppointment(Long id) {
        appointmentRepository.deleteById(id);
    }
}