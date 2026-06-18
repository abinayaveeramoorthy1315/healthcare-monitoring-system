package com.healthcare.healthcare_monitoring_system.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.healthcare.healthcare_monitoring_system.entity.EmergencyAlert;
import com.healthcare.healthcare_monitoring_system.entity.Patient;
import com.healthcare.healthcare_monitoring_system.entity.VitalSigns;
import com.healthcare.healthcare_monitoring_system.repository.PatientRepository;
import com.healthcare.healthcare_monitoring_system.repository.VitalSignsRepository;

@Service
public class VitalSignsService {

    @Autowired
    private VitalSignsRepository vitalSignsRepository;

    @Autowired
    private EmergencyAlertService emergencyAlertService;

    @Autowired
    private PatientRepository patientRepository;

    // ✅ Save + Risk + Alert
    public VitalSigns saveVital(VitalSigns vitalSigns) {
        String riskLevel;
        if (vitalSigns.getHeartRate() > 120
                || vitalSigns.getOxygenLevel() < 90
                || vitalSigns.getTemperature() > 39) {
            riskLevel = "CRITICAL";
        } else if (vitalSigns.getHeartRate() > 100
                || vitalSigns.getOxygenLevel() < 95
                || vitalSigns.getTemperature() > 37.5) {
            riskLevel = "HIGH";
        } else {
            riskLevel = "LOW";
        }
        vitalSigns.setRiskLevel(riskLevel);

        if ("CRITICAL".equals(riskLevel)) {
            Patient patient = patientRepository.findById(
                vitalSigns.getPatient().getPatientId()
            ).orElseThrow(() -> new RuntimeException("Patient not found"));

            EmergencyAlert alert = new EmergencyAlert();
            alert.setPatient(patient);
            alert.setSeverity("CRITICAL");
            alert.setMessage(
                "Critical condition detected. HR: "
                + vitalSigns.getHeartRate()
                + ", O2: " + vitalSigns.getOxygenLevel()
                + ", Temp: " + vitalSigns.getTemperature()
            );
            emergencyAlertService.saveAlert(alert);
        }

        return vitalSignsRepository.save(vitalSigns);
    }

    // ✅ Get All
    public List<VitalSigns> getAllVitals() {
        return vitalSignsRepository.findAll();
    }

    // ✅ Latest 10
    public List<VitalSigns> getLatestVitals() {
        return vitalSignsRepository.findTop10ByOrderByRecordedAtDesc();
    }

    // ✅ Patient-ஓட vitals - NEW
    public List<VitalSigns> getVitalsByPatient(Long patientId) {
        return vitalSignsRepository
            .findByPatient_PatientIdOrderByRecordedAtAsc(patientId);
    }
}