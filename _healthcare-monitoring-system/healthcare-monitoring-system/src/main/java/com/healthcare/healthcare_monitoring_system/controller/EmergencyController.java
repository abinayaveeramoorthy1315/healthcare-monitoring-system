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
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false, defaultValue = "Emergency SOS Triggered") String message,
            @RequestParam(required = false, defaultValue = "18.5204") Double latitude,
            @RequestParam(required = false, defaultValue = "73.8567") Double longitude) {

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

    @GetMapping("/assigned/{username}")
    public List<EmergencyRequest> getAssignedDoctorRequests(@PathVariable String username) {
        return emergencyService.getAssignedRequestsForDoctorUsername(username);
    }

    @PostMapping("/{id}/accept")
    public EmergencyRequest acceptEmergency(@PathVariable Long id, @RequestParam(required = false) String username) {
        return emergencyService.acceptEmergency(id, username);
    }

    @PostMapping("/{id}/reject")
    public EmergencyRequest rejectEmergency(@PathVariable Long id, @RequestParam(required = false) String username) {
        return emergencyService.rejectEmergency(id, username);
    }

    @PostMapping("/{id}/arrived")
    public EmergencyRequest markArrived(@PathVariable Long id) {
        return emergencyService.markArrived(id);
    }

    @PutMapping("/{id}")
    public EmergencyRequest update(@PathVariable Long id,
                                   @RequestParam String status) {

        return emergencyService.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public void deleteRequest(@PathVariable Long id) {
        emergencyService.deleteRequest(id);
    }

    @DeleteMapping("/doctor/{doctorName}/clear")
    public void clearDoctorRequests(@PathVariable String doctorName) {
        emergencyService.clearDoctorRequests(doctorName);
    }

    @DeleteMapping("/clear-all")
    public void clearAllRequests() {
        emergencyService.clearAllRequests();
    }
}
