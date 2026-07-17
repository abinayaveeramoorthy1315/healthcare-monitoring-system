package com.healthcare.healthcare_monitoring_system.controller;

import com.healthcare.healthcare_monitoring_system.entity.Ambulance;
import com.healthcare.healthcare_monitoring_system.entity.AmbulanceRequest;
import com.healthcare.healthcare_monitoring_system.entity.EmergencyRequest;
import com.healthcare.healthcare_monitoring_system.repository.EmergencyRepository;
import com.healthcare.healthcare_monitoring_system.service.AmbulanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ambulance")
@CrossOrigin(origins = "*")
public class AmbulanceController {

    @Autowired
    private AmbulanceService ambulanceService;

    @Autowired
    private EmergencyRepository emergencyRepository;

    @GetMapping("/list")
    public List<Ambulance> getAllAmbulances() {
        return ambulanceService.getAllAmbulances();
    }

    @GetMapping("/request/{emergencyId}")
    public ResponseEntity<AmbulanceRequest> getRequestForEmergency(@PathVariable Long emergencyId) {
        AmbulanceRequest req = ambulanceService.getRequestForEmergency(emergencyId);
        if (req != null) {
            return ResponseEntity.ok(req);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/update/{requestId}")
    public ResponseEntity<AmbulanceRequest> updateStatus(
            @PathVariable Long requestId,
            @RequestParam String status,
            @RequestParam(required = false) Integer eta
    ) {
        AmbulanceRequest updated = ambulanceService.updateStatus(requestId, status, eta);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/assign-manual")
    public ResponseEntity<AmbulanceRequest> assignAmbulanceManual(
            @RequestParam Long emergencyId,
            @RequestParam Long ambulanceId
    ) {
        EmergencyRequest emergency = emergencyRepository.findById(emergencyId).orElse(null);
        if (emergency == null) {
            return ResponseEntity.notFound().build();
        }
        AmbulanceRequest assigned = ambulanceService.assignAmbulanceManual(emergency, ambulanceId);
        if (assigned != null) {
            return ResponseEntity.ok(assigned);
        }
        return ResponseEntity.badRequest().build();
    }
}
