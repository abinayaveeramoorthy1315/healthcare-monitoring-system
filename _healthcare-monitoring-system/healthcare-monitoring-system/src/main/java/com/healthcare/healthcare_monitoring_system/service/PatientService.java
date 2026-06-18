package com.healthcare.healthcare_monitoring_system.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.healthcare.healthcare_monitoring_system.entity.Patient;
import com.healthcare.healthcare_monitoring_system.repository.PatientRepository;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    public Patient savePatient(Patient patient) {
        return patientRepository.save(patient);
    }

    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }
    public Patient updatePatient(Long id, Patient patient) {
        Patient existingPatient = patientRepository.findById(id).orElse(null);

        if (existingPatient != null) {
            existingPatient.setName(patient.getName());
            existingPatient.setAge(patient.getAge());
            existingPatient.setGender(patient.getGender());
            existingPatient.setPhone(patient.getPhone());
            existingPatient.setEmail(patient.getEmail());
            existingPatient.setBloodGroup(patient.getBloodGroup());

            return patientRepository.save(existingPatient);
        }

        return null;
    }

    public void deletePatient(Long id) {
        patientRepository.deleteById(id);
    }
}