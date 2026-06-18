package com.healthcare.healthcare_monitoring_system.repository;

import com.healthcare.healthcare_monitoring_system.entity.DoctorSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoctorSlotRepository extends JpaRepository<DoctorSlot, Long> {
    List<DoctorSlot> findByDoctor_DoctorIdAndIsBooked(Long doctorId, boolean isBooked);
    List<DoctorSlot> findByDoctor_DoctorId(Long doctorId);
}