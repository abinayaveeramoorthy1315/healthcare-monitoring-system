package com.healthcare.healthcare_monitoring_system.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.healthcare.healthcare_monitoring_system.entity.EmergencyAlert;

import java.util.List;

public interface EmergencyAlertRepository
        extends JpaRepository<EmergencyAlert, Long> {

    long countBySeverity(String severity);

    List<EmergencyAlert> findTop10ByOrderByCreatedAtDesc();
}