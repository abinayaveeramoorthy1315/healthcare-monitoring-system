package com.healthcare.healthcare_monitoring_system.service;

import com.healthcare.healthcare_monitoring_system.entity.Ambulance;
import com.healthcare.healthcare_monitoring_system.entity.AmbulanceRequest;
import com.healthcare.healthcare_monitoring_system.entity.EmergencyRequest;
import com.healthcare.healthcare_monitoring_system.repository.AmbulanceRepository;
import com.healthcare.healthcare_monitoring_system.repository.AmbulanceRequestRepository;
import com.healthcare.healthcare_monitoring_system.repository.EmergencyRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AmbulanceService {

    @Autowired
    private AmbulanceRepository ambulanceRepository;

    @Autowired
    private AmbulanceRequestRepository ambulanceRequestRepository;

    @Autowired
    private EmergencyRepository emergencyRepository;

    @PostConstruct
    public void initAmbulances() {
        if (ambulanceRepository.count() == 0) {
            ambulanceRepository.save(new Ambulance("John Doe", "MH-12-AB-1234", "9876543210", 18.5204, 73.8567, "AVAILABLE"));
            ambulanceRepository.save(new Ambulance("Jane Smith", "MH-12-CD-5678", "8765432109", 18.5214, 73.8577, "AVAILABLE"));
            ambulanceRepository.save(new Ambulance("Mike Johnson", "MH-12-EF-9012", "7654321098", 18.5194, 73.8557, "AVAILABLE"));
            ambulanceRepository.save(new Ambulance("Emily Davis", "MH-12-GH-3456", "6543210987", 18.5224, 73.8587, "AVAILABLE"));
            System.out.println("Initialized dummy ambulances.");
        }
    }

    public AmbulanceRequest assignAmbulance(EmergencyRequest emergencyRequest) {
        if (emergencyRequest == null) return null;
        Optional<AmbulanceRequest> existing = ambulanceRequestRepository.findByEmergencyRequest_Id(emergencyRequest.getId());
        if (existing.isPresent()) {
            return existing.get();
        }

        List<Ambulance> availableAmbulances = ambulanceRepository.findByStatus("AVAILABLE");
        Ambulance assignedAmbulance;
        if (availableAmbulances.isEmpty()) {
            List<Ambulance> all = ambulanceRepository.findAll();
            if (!all.isEmpty()) {
                assignedAmbulance = all.get(0);
            } else {
                assignedAmbulance = ambulanceRepository.save(new Ambulance("Emergency Response Team", "MH-12-EM-108", "108", 18.5204, 73.8567, "ASSIGNED"));
            }
        } else {
            assignedAmbulance = availableAmbulances.get(0);
        }
        assignedAmbulance.setStatus("ASSIGNED");
        ambulanceRepository.save(assignedAmbulance);

        AmbulanceRequest request = new AmbulanceRequest();
        request.setEmergencyRequest(emergencyRequest);
        request.setAmbulance(assignedAmbulance);
        request.setEstimatedArrivalMinutes(8); // Default simulation ETA
        request.setCurrentStatus("ASSIGNED");

        return ambulanceRequestRepository.save(request);
    }

    public AmbulanceRequest getRequestForEmergency(Long emergencyId) {
        AmbulanceRequest req = ambulanceRequestRepository.findByEmergencyRequest_Id(emergencyId).orElse(null);
        if (req != null) {
            return req;
        }
        if (emergencyRepository != null) {
            EmergencyRequest emergency = emergencyRepository.findById(emergencyId).orElse(null);
            if (emergency != null) {
                return assignAmbulance(emergency);
            }
        }
        // Fallback response if emergency ID not found in DB
        Ambulance dummyAmb = new Ambulance("Emergency Response Unit", "MH-12-EM-108", "108", 18.5204, 73.8567, "ASSIGNED");
        dummyAmb.setAmbulanceId(999L);
        AmbulanceRequest dummyReq = new AmbulanceRequest();
        dummyReq.setRequestId(emergencyId);
        dummyReq.setAmbulance(dummyAmb);
        dummyReq.setEstimatedArrivalMinutes(8);
        dummyReq.setCurrentStatus("ASSIGNED");
        return dummyReq;
    }

    public AmbulanceRequest updateStatus(Long requestId, String status, Integer eta) {
        Optional<AmbulanceRequest> reqOpt = ambulanceRequestRepository.findById(requestId);
        if (reqOpt.isPresent()) {
            AmbulanceRequest req = reqOpt.get();
            req.setCurrentStatus(status);
            if (eta != null) {
                req.setEstimatedArrivalMinutes(eta);
            }
            if ("COMPLETED".equals(status)) {
                Ambulance amb = req.getAmbulance();
                amb.setStatus("AVAILABLE");
                ambulanceRepository.save(amb);
            }
            return ambulanceRequestRepository.save(req);
        }
        return null;
    }

    @org.springframework.transaction.annotation.Transactional
    public void cleanupForEmergency(Long emergencyId) {
        AmbulanceRequest req = ambulanceRequestRepository.findByEmergencyRequest_Id(emergencyId).orElse(null);
        if (req != null) {
            Ambulance amb = req.getAmbulance();
            if (amb != null) {
                amb.setStatus("AVAILABLE");
                ambulanceRepository.save(amb);
            }
            ambulanceRequestRepository.delete(req);
        }
    }

    public List<Ambulance> getAllAmbulances() {
        return ambulanceRepository.findAll();
    }

    @org.springframework.transaction.annotation.Transactional
    public AmbulanceRequest assignAmbulanceManual(EmergencyRequest emergencyRequest, Long ambulanceId) {
        // Free existing ambulance if one was already assigned to this emergency
        cleanupForEmergency(emergencyRequest.getId());

        Ambulance assignedAmbulance = ambulanceRepository.findById(ambulanceId).orElse(null);
        if (assignedAmbulance == null) {
            return null;
        }
        assignedAmbulance.setStatus("ASSIGNED");
        ambulanceRepository.save(assignedAmbulance);

        AmbulanceRequest request = new AmbulanceRequest();
        request.setEmergencyRequest(emergencyRequest);
        request.setAmbulance(assignedAmbulance);
        request.setEstimatedArrivalMinutes(8);
        request.setCurrentStatus("ASSIGNED");

        return ambulanceRequestRepository.save(request);
    }
}
