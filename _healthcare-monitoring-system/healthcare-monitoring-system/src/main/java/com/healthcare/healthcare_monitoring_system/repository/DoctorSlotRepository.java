package com.healthcare.healthcare_monitoring_system.repository;

import com.healthcare.healthcare_monitoring_system.entity.DoctorSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DoctorSlotRepository extends JpaRepository<DoctorSlot, Long> {
    List<DoctorSlot> findByDoctor_DoctorIdAndIsBooked(Long doctorId, boolean isBooked);
    List<DoctorSlot> findByDoctor_DoctorId(Long doctorId);
    Optional<DoctorSlot> findByDoctor_DoctorIdAndSlotDateAndStartTime(Long doctorId, LocalDate slotDate, String startTime);
}