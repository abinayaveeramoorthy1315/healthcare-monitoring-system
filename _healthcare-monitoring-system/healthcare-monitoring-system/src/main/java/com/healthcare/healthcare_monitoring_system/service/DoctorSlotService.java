package com.healthcare.healthcare_monitoring_system.service;

import com.healthcare.healthcare_monitoring_system.entity.Doctor;
import com.healthcare.healthcare_monitoring_system.entity.DoctorSlot;
import com.healthcare.healthcare_monitoring_system.repository.DoctorSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DoctorSlotService {

    @Autowired
    private DoctorSlotRepository slotRepository;

    // ✅ Slot add
    public DoctorSlot addSlot(DoctorSlot slot) {
        return slotRepository.save(slot);
    }

    // ✅ Doctor-ஓட available slots
    public List<DoctorSlot> getAvailableSlots(Long doctorId) {
        return slotRepository.findByDoctor_DoctorIdAndIsBooked(doctorId, false);
    }

    // ✅ Doctor-ஓட எல்லா slots
    public List<DoctorSlot> getAllSlots(Long doctorId) {
        return slotRepository.findByDoctor_DoctorId(doctorId);
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
