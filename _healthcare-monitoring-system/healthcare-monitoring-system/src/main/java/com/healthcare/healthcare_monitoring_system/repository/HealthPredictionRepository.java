package com.healthcare.healthcare_monitoring_system.repository;

import com.healthcare.healthcare_monitoring_system.entity.HealthPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HealthPredictionRepository extends JpaRepository<HealthPrediction, Long> {

    List<HealthPrediction> findByPatient_PatientIdOrderByCreatedAtDesc(Long patientId);

    List<HealthPrediction> findByRiskLevelInOrderByCreatedAtDesc(List<String> riskLevels);
}
