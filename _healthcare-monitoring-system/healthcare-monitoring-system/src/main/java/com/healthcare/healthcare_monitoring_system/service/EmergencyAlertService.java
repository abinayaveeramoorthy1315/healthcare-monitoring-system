package com.healthcare.healthcare_monitoring_system.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.healthcare.healthcare_monitoring_system.entity.EmergencyAlert;
import com.healthcare.healthcare_monitoring_system.repository.EmergencyAlertRepository;

@Service
public class EmergencyAlertService {

    @Autowired
    private EmergencyAlertRepository emergencyAlertRepository;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private EmergencyService emergencyService;

    public EmergencyAlert saveAlert(EmergencyAlert alert) {
        EmergencyAlert saved = emergencyAlertRepository.save(alert);
        try {
            if ("CRITICAL".equalsIgnoreCase(saved.getSeverity()) && saved.getPatient() != null && saved.getPatient().getPatientId() != null) {
                emergencyService.raiseEmergency(
                        saved.getPatient().getPatientId(),
                        null,
                        saved.getMessage() != null ? saved.getMessage() : "AI Critical Vitals Alert",
                        18.5204,
                        73.8567
                );
            }
        } catch (Exception ex) {
            System.err.println("Notice: Smart routing from EmergencyAlert note: " + ex.getMessage());
        }
        return saved;
    }

    public List<EmergencyAlert> getAllAlerts() {
        return emergencyAlertRepository.findAll();
    }

    public long getCriticalAlertsCount() {
        return emergencyAlertRepository.countBySeverity("CRITICAL");
    }
    public List<EmergencyAlert> getLatestAlerts() {
        return emergencyAlertRepository.findTop10ByOrderByCreatedAtDesc();
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteAlert(Long id) {
        if (emergencyAlertRepository.existsById(id)) {
            emergencyAlertRepository.deleteById(id);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void clearAllAlerts() {
        emergencyAlertRepository.deleteAll();
    }
}