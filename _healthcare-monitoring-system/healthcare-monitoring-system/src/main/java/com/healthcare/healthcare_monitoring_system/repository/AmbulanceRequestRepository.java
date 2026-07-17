package com.healthcare.healthcare_monitoring_system.repository;

import com.healthcare.healthcare_monitoring_system.entity.AmbulanceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AmbulanceRequestRepository extends JpaRepository<AmbulanceRequest, Long> {
    Optional<AmbulanceRequest> findByEmergencyRequest_Id(Long emergencyRequestId);
}
