package com.healthcare.healthcare_monitoring_system.service;

import com.healthcare.healthcare_monitoring_system.entity.Prescription;
import com.healthcare.healthcare_monitoring_system.repository.PrescriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PrescriptionService {

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    public Prescription savePrescription(Prescription prescription) {
        return prescriptionRepository.save(prescription);
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