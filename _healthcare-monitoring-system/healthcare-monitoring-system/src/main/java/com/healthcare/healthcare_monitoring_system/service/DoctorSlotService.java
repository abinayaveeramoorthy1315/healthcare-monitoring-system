package com.healthcare.healthcare_monitoring_system.service;

import com.healthcare.healthcare_monitoring_system.entity.Doctor;
import com.healthcare.healthcare_monitoring_system.entity.DoctorSlot;
import com.healthcare.healthcare_monitoring_system.repository.DoctorSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorSlotService {

    @Autowired
    private DoctorSlotRepository slotRepository;

    @Autowired
    private DoctorScheduleService scheduleService;

    // ✅ Slot add
    public DoctorSlot addSlot(DoctorSlot slot) {
        return slotRepository.save(slot);
    }

    // ✅ Doctor-ஓட available slots with strict past filtering and auto-generation
    public List<DoctorSlot> getAvailableSlots(Long doctorId) {
        try {
            scheduleService.generateSlotsForNext30Days(doctorId);
        } catch (Exception e) {
            System.err.println("Auto slot generation failed: " + e.getMessage());
        }

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        List<DoctorSlot> slots = slotRepository.findByDoctor_DoctorIdAndIsBooked(doctorId, false);

        return slots.stream()
                .filter(slot -> {
                    if (slot.getSlotDate() == null) return false;
                    if (slot.getSlotDate().isBefore(today)) return false;
                    if (slot.getSlotDate().isEqual(today)) {
                        try {
                            LocalTime start = LocalTime.parse(slot.getStartTime());
                            if (start.isBefore(now)) return false;
                        } catch (Exception ignored) {}
                    }
                    return true;
                })
                .sorted(Comparator.comparing(DoctorSlot::getSlotDate).thenComparing(DoctorSlot::getStartTime))
                .collect(Collectors.toList());
    }

    // ✅ Doctor-ஓட எல்லா slots with auto-generation
    public List<DoctorSlot> getAllSlots(Long doctorId) {
        try {
            scheduleService.generateSlotsForNext30Days(doctorId);
        } catch (Exception e) {
            System.err.println("Auto slot generation failed: " + e.getMessage());
        }

        return slotRepository.findByDoctor_DoctorId(doctorId).stream()
                .sorted(Comparator.comparing(DoctorSlot::getSlotDate).thenComparing(DoctorSlot::getStartTime))
                .collect(Collectors.toList());
    }

    // ✅ Slot book பண்ணு
    public DoctorSlot bookSlot(Long slotId) {
        DoctorSlot slot = slotRepository.findById(slotId)
            .orElseThrow(() -> new RuntimeException("Slot not found"));
        slot.setBooked(true);
        return slotRepository.save(slot);
    }

    // ✅ Slot delete
    public void deleteSlot(Long slotId) {
        slotRepository.deleteById(slotId);
    }
}
