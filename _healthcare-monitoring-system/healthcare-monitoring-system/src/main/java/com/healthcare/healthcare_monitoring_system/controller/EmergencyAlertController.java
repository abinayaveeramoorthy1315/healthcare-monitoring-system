package com.healthcare.healthcare_monitoring_system.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.healthcare.healthcare_monitoring_system.entity.EmergencyAlert;
import com.healthcare.healthcare_monitoring_system.service.EmergencyAlertService;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "http://localhost:5173")
public class EmergencyAlertController {

    @Autowired
    private EmergencyAlertService emergencyAlertService;

    @GetMapping
    public List<EmergencyAlert> getAllAlerts() {
        return emergencyAlertService.getAllAlerts();
    }

    @GetMapping("/count")
    public long getCriticalAlertsCount() {
        return emergencyAlertService.getCriticalAlertsCount();
    }

    // 🔥 NEW API
    @GetMapping("/latest")
    public List<EmergencyAlert> getLatestAlerts() {
        return emergencyAlertService.getLatestAlerts();
    }

    @DeleteMapping("/{id}")
    public void deleteAlert(@PathVariable Long id) {
        emergencyAlertService.deleteAlert(id);
    }

    @DeleteMapping("/clear-all")
    public void clearAllAlerts() {
        emergencyAlertService.clearAllAlerts();
    }
}