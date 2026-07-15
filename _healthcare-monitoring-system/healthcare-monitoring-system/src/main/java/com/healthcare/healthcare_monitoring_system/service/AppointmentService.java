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

    // Save Appointment
    public Appointment saveAppointment(Appointment appointment) {

        Appointment saved = appointmentRepository.save(appointment);

        // ==========================
        // Doctor Notification
        // ==========================

        try {

            Doctor doctor = doctorRepository
                    .findById(saved.getDoctor().getDoctorId())
                    .orElse(null);

            if (doctor != null && doctor.getUserId() != null) {

                userRepository.findById(doctor.getUserId()).ifPresent(user -> {

                    notificationService.createNotification(
                            user.getUsername(),
                            "📅 New appointment booked on "
                                    + saved.getAppointmentDate()
                    );

                });

            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        // ==========================
        // Send Email
        // ==========================

        try {

            Patient patient = patientRepository
                    .findById(saved.getPatient().getPatientId())
                    .orElse(null);

            Doctor doctor = doctorRepository
                    .findById(saved.getDoctor().getDoctorId())
                    .orElse(null);

            if (patient != null && doctor != null) {

                System.out.println("Patient Name : " + patient.getName());
                System.out.println("Patient Email : " + patient.getEmail());
                System.out.println("===== MAIL DEBUG =====");

                if(saved.getPatient() == null){
                    System.out.println("Patient is NULL");
                }else{
                    System.out.println("Patient ID : " + saved.getPatient().getPatientId());
                    System.out.println("Patient Name : " + saved.getPatient().getName());
                    System.out.println("Patient Email : " + saved.getPatient().getEmail());
                }

                mailService.sendAppointmentMail(
                        patient.getEmail(),
                        patient.getName(),
                        doctor.getDoctorName(),
                        saved.getAppointmentDate(),
                        saved.getAppointmentTime()
                );

                System.out.println("Mail Sent Successfully");

            } else {

                System.out.println("Patient or Doctor not found");

            }

        } catch (Exception e) {

            System.out.println("Mail Error");
            e.printStackTrace();

        }

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

        // Notification
        try {

            if (appointment.getPatient() != null) {

                String patientName = appointment.getPatient().getName();

                if (patientName != null) {

                    String username = patientName
                            .toLowerCase()
                            .replace(" ", "");

                    String msg = status.equalsIgnoreCase("BOOKED")
                            ? "✅ Your appointment has been accepted!"
                            : "❌ Your appointment has been cancelled.";

                    notificationService.createNotification(username, msg);

                }

            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        // ===========================
        // SEND STATUS EMAIL
        // ===========================

        try {

            Patient patient = patientRepository
                    .findById(appointment.getPatient().getPatientId())
                    .orElse(null);

            Doctor doctor = doctorRepository
                    .findById(appointment.getDoctor().getDoctorId())
                    .orElse(null);

            if (patient != null && doctor != null) {

                mailService.sendStatusMail(
                        patient.getEmail(),
                        patient.getName(),
                        doctor.getDoctorName(),
                        appointment.getAppointmentDate(),
                        appointment.getAppointmentTime(),
                        status
                );

                System.out.println("Status Mail Sent Successfully");

            }

        } catch (Exception e) {

            System.out.println("Status Mail Error");
            e.printStackTrace();

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