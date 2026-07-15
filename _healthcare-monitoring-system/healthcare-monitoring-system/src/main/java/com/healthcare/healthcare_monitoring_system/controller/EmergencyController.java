package com.healthcare.healthcare_monitoring_system.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.healthcare.healthcare_monitoring_system.entity.EmergencyRequest;
import com.healthcare.healthcare_monitoring_system.service.EmergencyService;

@RestController
@RequestMapping("/api/emergency")
@CrossOrigin(origins = "http://localhost:5173")
public class EmergencyController {

    @Autowired
    private EmergencyService emergencyService;

    @PostMapping
    public EmergencyRequest raiseEmergency(
            @RequestParam Long patientId,
            @RequestParam Long doctorId,
            @RequestParam String message,
            @RequestParam Double latitude,
            @RequestParam Double longitude) {

        return emergencyService.raiseEmergency(
                patientId,
                doctorId,
                message,
                latitude,
                longitude
        );
    }
   

    @GetMapping
    public List<EmergencyRequest> getAll() {
        return emergencyService.getAllRequests();
    }

    @GetMapping("/doctor/{doctorName}")
    public List<EmergencyRequest> doctor(@PathVariable String doctorName) {
        return emergencyService.getDoctorRequests(doctorName);
    }

    @GetMapping("/patient/{patientName}")
    public List<EmergencyRequest> patient(@PathVariable String patientName) {
        return emergencyService.getPatientRequests(patientName);
    }

    @PutMapping("/{id}")
    public EmergencyRequest update(@PathVariable Long id,
                                   @RequestParam String status) {

        return emergencyService.updateStatus(id, status);
    }
}
