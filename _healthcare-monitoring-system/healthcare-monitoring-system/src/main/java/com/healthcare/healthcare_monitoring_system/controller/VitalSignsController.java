package com.healthcare.healthcare_monitoring_system.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.healthcare.healthcare_monitoring_system.entity.VitalSigns;
import com.healthcare.healthcare_monitoring_system.service.VitalSignsService;

@RestController
@RequestMapping("/api/vitalsigns")
@CrossOrigin(origins = "http://localhost:5173")
public class VitalSignsController {

    @Autowired
    private VitalSignsService vitalSignsService;

    @PostMapping
    public VitalSigns addVital(@RequestBody VitalSigns vitalSigns) {
        return vitalSignsService.saveVital(vitalSigns);
    }

    @GetMapping
    public List<VitalSigns> getAllVitals() {
        return vitalSignsService.getAllVitals();
    }
    @GetMapping("/latest")
    public List<VitalSigns> getLatestVitals() {
        return vitalSignsService.getLatestVitals();
    }
 // ✅ Patient-ஓட vitals
    @GetMapping("/patient/{patientId}")
    public List<VitalSigns> getVitalsByPatient(
            @PathVariable Long patientId) {
        return vitalSignsService.getVitalsByPatient(patientId);
    }
 // ✅ Patient-ஓட vitals
   
}