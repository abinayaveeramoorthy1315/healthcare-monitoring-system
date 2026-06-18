package com.healthcare.healthcare_monitoring_system.repository;

import com.healthcare.healthcare_monitoring_system.entity.VitalSigns;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VitalSignsRepository extends JpaRepository<VitalSigns, Long> {

    // ✅ Already இருக்கு
    List<VitalSigns> findTop10ByOrderByRecordedAtDesc();

    // ✅ New - Patient vitals by time order
    List<VitalSigns> findByPatient_PatientIdOrderByRecordedAtAsc(Long patientId);
}