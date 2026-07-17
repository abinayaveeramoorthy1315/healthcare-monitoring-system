package com.healthcare.healthcare_monitoring_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.healthcare.healthcare_monitoring_system.entity.EmergencyRequest;

public interface EmergencyRepository extends JpaRepository<EmergencyRequest, Long> {

    List<EmergencyRequest> findByDoctorName(String doctorName);

    List<EmergencyRequest> findByPatientName(String patientName);

    List<EmergencyRequest> findByAssignedDoctorId(Long assignedDoctorId);

    List<EmergencyRequest> findByPatientId(Long patientId);

    List<EmergencyRequest> findByStatusAndCreatedAtBefore(String status, java.time.LocalDateTime timeThreshold);

    List<EmergencyRequest> findByEmergencyStatusAndCreatedAtBefore(String emergencyStatus, java.time.LocalDateTime timeThreshold);

}