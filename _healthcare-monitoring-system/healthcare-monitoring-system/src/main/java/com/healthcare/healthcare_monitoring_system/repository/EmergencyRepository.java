package com.healthcare.healthcare_monitoring_system.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.healthcare.healthcare_monitoring_system.entity.EmergencyRequest;

public interface EmergencyRepository extends JpaRepository<EmergencyRequest, Long> {

    List<EmergencyRequest> findByDoctorName(String doctorName);

    List<EmergencyRequest> findByPatientName(String patientName);

}