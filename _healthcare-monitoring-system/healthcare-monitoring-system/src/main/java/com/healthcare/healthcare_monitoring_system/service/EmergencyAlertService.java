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

    public EmergencyAlert saveAlert(EmergencyAlert alert) {
        return emergencyAlertRepository.save(alert);
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
}