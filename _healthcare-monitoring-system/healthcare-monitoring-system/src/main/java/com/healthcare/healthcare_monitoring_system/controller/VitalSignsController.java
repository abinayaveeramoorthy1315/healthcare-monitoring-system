package com.healthcare.healthcare_monitoring_system.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.healthcare.healthcare_monitoring_system.entity.VitalSigns;
import com.healthcare.healthcare_monitoring_system.service.VitalSignsService;
import com.healthcare.healthcare_monitoring_system.service.VitalsRiskAnalysisService;

@RestController
@RequestMapping("/api/vitalsigns")
@CrossOrigin(origins = "http://localhost:5173")
public class VitalSignsController {

    @Autowired
    private VitalSignsService vitalSignsService;

    @Autowired
    private VitalsRiskAnalysisService vitalsRiskAnalysisService;

    @PostMapping
    public VitalSigns addVital(@RequestBody VitalSigns vitalSigns) {
        // Existing logic: saves vitals, calculates riskLevel, creates EmergencyAlert if CRITICAL
        VitalSigns savedVital = vitalSignsService.saveVital(vitalSigns);

        // NEW: AI explanation + doctor notification for HIGH/CRITICAL
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String doctorUsername = auth.getName();
        vitalsRiskAnalysisService.notifyDoctorIfNeeded(savedVital, doctorUsername);

        return savedVital;
    }

    @GetMapping
    public List<VitalSigns> getAllVitals() {
        return vitalSignsService.getAllVitals();
    }

    @GetMapping("/latest")
    public List<VitalSigns> getLatestVitals() {
        return vitalSignsService.getLatestVitals();
    }

    @GetMapping("/patient/{patientId}")
    public List<VitalSigns> getVitalsByPatient(@PathVariable Long patientId) {
        return vitalSignsService.getVitalsByPatient(patientId);
    }
}