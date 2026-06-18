package com.healthcare.healthcare_monitoring_system.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.healthcare.healthcare_monitoring_system.entity.Appointment;
import com.healthcare.healthcare_monitoring_system.service.AppointmentService;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:5173")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    // ✅ Add
    @PostMapping
    public Appointment addAppointment(@RequestBody Appointment appointment) {
        return appointmentService.saveAppointment(appointment);
    }

    // ✅ Get All - ADMIN
    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    // ✅ Doctor own appointments - NEW
    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> getByDoctor(@PathVariable Long doctorId) {
        return appointmentService.getAppointmentsByDoctor(doctorId);
    }

    // ✅ Patient own appointments - NEW
    @GetMapping("/patient/{patientId}")
    public List<Appointment> getByPatient(@PathVariable Long patientId) {
        return appointmentService.getAppointmentsByPatient(patientId);
    }

    // ✅ Update
    @PutMapping("/{id}")
    public Appointment updateAppointment(@PathVariable Long id,
                                          @RequestBody Appointment appointment) {
        return appointmentService.updateAppointment(id, appointment);
    }

    // ✅ Status update
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return appointmentService.updateStatus(id, status);
    }

    // ✅ Delete
    @DeleteMapping("/{id}")
    public String deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return "Appointment deleted successfully";
    }
}