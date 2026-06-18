package com.healthcare.healthcare_monitoring_system.repository;

import com.healthcare.healthcare_monitoring_system.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatient_PatientId(Long patientId);
    List<Prescription> findByDoctor_DoctorId(Long doctorId);
}