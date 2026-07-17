package com.healthcare.healthcare_monitoring_system.service;

import com.healthcare.healthcare_monitoring_system.entity.Doctor;
import com.healthcare.healthcare_monitoring_system.entity.Patient;
import com.healthcare.healthcare_monitoring_system.entity.Prescription;
import com.healthcare.healthcare_monitoring_system.repository.DoctorRepository;
import com.healthcare.healthcare_monitoring_system.repository.PatientRepository;
import com.healthcare.healthcare_monitoring_system.repository.PrescriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PrescriptionService {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private EmailTemplateService emailTemplateService;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    public Prescription savePrescription(Prescription prescription) {
        Prescription saved = prescriptionRepository.save(prescription);
        try {
            if (saved.getPatient() != null && saved.getDoctor() != null) {
                Patient pat = patientRepository.findById(saved.getPatient().getPatientId()).orElse(null);
                Doctor doc = doctorRepository.findById(saved.getDoctor().getDoctorId()).orElse(null);
                if (pat != null && doc != null && pat.getEmail() != null) {
                    String summary = saved.getMedicineName() + " (" + saved.getDosage() + ") - " + saved.getDuration();
                    emailTemplateService.sendPrescriptionReadyMail(
                        pat.getEmail(),
                        pat.getName(),
                        doc.getDoctorName(),
                        saved.getPrescribedDate() != null ? saved.getPrescribedDate().toString() : java.time.LocalDate.now().toString(),
                        summary
                    );
                }
            }
        } catch (Exception e) {
            System.err.println("Notice: Failed to send prescription email: " + e.getMessage());
        }
        return saved;
    }

    public List<Prescription> getByPatient(Long patientId) {
        return prescriptionRepository.findByPatient_PatientId(patientId);
    }

    public List<Prescription> getByDoctor(Long doctorId) {
        return prescriptionRepository.findByDoctor_DoctorId(doctorId);
    }

    public List<Prescription> getAll() {
        return prescriptionRepository.findAll();
    }

    public void deletePrescription(Long id) {
        prescriptionRepository.deleteById(id);
    }
}