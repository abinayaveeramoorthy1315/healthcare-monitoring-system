package com.healthcare.healthcare_monitoring_system.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import com.healthcare.healthcare_monitoring_system.entity.Appointment;
import com.healthcare.healthcare_monitoring_system.entity.Doctor;
import com.healthcare.healthcare_monitoring_system.repository.AppointmentRepository;
import com.healthcare.healthcare_monitoring_system.repository.DoctorRepository;
import com.healthcare.healthcare_monitoring_system.repository.UserRepository;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private UserRepository userRepository;

    // ✅ Save + Doctor-க்கு notification
    public Appointment saveAppointment(Appointment appointment) {
        Appointment saved = appointmentRepository.save(appointment);

        try {
            // Doctor username find பண்ணு
            Long doctorId = appointment.getDoctor().getDoctorId();
            Doctor doctor = doctorRepository.findById(doctorId).orElse(null);

            if (doctor != null && doctor.getUserId() != null) {
                userRepository.findById(doctor.getUserId()).ifPresent(user -> {
                    String patientName = appointment.getPatient() != null
                        ? "A patient" : "A patient";
                    notificationService.createNotification(
                        user.getUsername(),
                        "📅 New appointment booked on " +
                        appointment.getAppointmentDate()
                    );
                });
            }
        } catch (Exception e) {
            System.out.println("Notification error: " + e.getMessage());
        }

        return saved;
    }

    // ✅ Get All
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    // ✅ Update
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

    // ✅ Status Update + Patient-க்கு notification
    public ResponseEntity<?> updateStatus(Long id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus(status);
        appointmentRepository.save(appointment);

        try {
            // Patient username find பண்ணு
            if (appointment.getPatient() != null) {
                String patientName = appointment.getPatient().getName();
                if (patientName != null) {
                    String username = patientName.toLowerCase().replace(" ", "");
                    String msg = status.equals("BOOKED")
                        ? "✅ Your appointment has been accepted!"
                        : "❌ Your appointment has been cancelled.";
                    notificationService.createNotification(username, msg);
                }
            }
        } catch (Exception e) {
            System.out.println("Notification error: " + e.getMessage());
        }

        return ResponseEntity.ok(appointment);
    }

    // ✅ Doctor own appointments
    public List<Appointment> getAppointmentsByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctor_DoctorId(doctorId);
    }

    // ✅ Patient own appointments
    public List<Appointment> getAppointmentsByPatient(Long patientId) {
        return appointmentRepository.findByPatient_PatientId(patientId);
    }

    // ✅ Delete
    public void deleteAppointment(Long id) {
        appointmentRepository.deleteById(id);
    }
}