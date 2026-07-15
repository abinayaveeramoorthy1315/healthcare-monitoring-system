package com.healthcare.healthcare_monitoring_system.repository;

import com.healthcare.healthcare_monitoring_system.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDoctor_DoctorId(Long doctorId);
    List<Appointment> findByPatient_PatientId(Long patientId);
    Optional<Appointment> findTopByPatient_PatientIdOrderByAppointmentDateDesc(Long patientId);
 
}