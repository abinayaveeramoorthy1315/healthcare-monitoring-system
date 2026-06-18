package com.healthcare.healthcare_monitoring_system.controller;

import com.healthcare.healthcare_monitoring_system.entity.Doctor;
import com.healthcare.healthcare_monitoring_system.entity.Patient;
import com.healthcare.healthcare_monitoring_system.entity.Prescription;
import com.healthcare.healthcare_monitoring_system.service.PrescriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class PrescriptionController {

    @Autowired
    private PrescriptionService prescriptionService;

    // ✅ Add prescription
    @PostMapping
    public Prescription addPrescription(@RequestBody Map<String, Object> body) {
        Prescription p = new Prescription();

        Patient patient = new Patient();
        patient.setPatientId(Long.valueOf(body.get("patientId").toString()));
        p.setPatient(patient);

        Doctor doctor = new Doctor();
        doctor.setDoctorId(Long.valueOf(body.get("doctorId").toString()));
        p.setDoctor(doctor);

        p.setMedicineName(body.get("medicineName").toString());
        p.setDosage(body.get("dosage").toString());
        p.setDuration(body.get("duration").toString());
        p.setInstructions(body.getOrDefault("instructions", "").toString());
        p.setPrescribedDate(LocalDate.now());

        return prescriptionService.savePrescription(p);
    }

    // ✅ Patient-ஓட prescriptions
    @GetMapping("/patient/{patientId}")
    public List<Prescription> getByPatient(@PathVariable Long patientId) {
        return prescriptionService.getByPatient(patientId);
    }

    // ✅ Doctor-ஓட prescriptions
    @GetMapping("/doctor/{doctorId}")
    public List<Prescription> getByDoctor(@PathVariable Long doctorId) {
        return prescriptionService.getByDoctor(doctorId);
    }

    // ✅ All prescriptions - ADMIN
    @GetMapping
    public List<Prescription> getAll() {
        return prescriptionService.getAll();
    }

    // ✅ Delete
    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        prescriptionService.deletePrescription(id);
        return "Deleted";
    }
}