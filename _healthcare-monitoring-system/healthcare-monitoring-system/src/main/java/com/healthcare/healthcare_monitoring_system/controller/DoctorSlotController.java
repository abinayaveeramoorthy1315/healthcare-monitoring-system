package com.healthcare.healthcare_monitoring_system.controller;

import com.healthcare.healthcare_monitoring_system.entity.Doctor;
import com.healthcare.healthcare_monitoring_system.entity.DoctorSlot;
import com.healthcare.healthcare_monitoring_system.service.DoctorSlotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/slots")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class DoctorSlotController {

    @Autowired
    private DoctorSlotService slotService;

    // ✅ Slot add - DOCTOR/ADMIN மட்டும்
    @PostMapping
    public DoctorSlot addSlot(@RequestBody Map<String, Object> body) {
        DoctorSlot slot = new DoctorSlot();

        Doctor doctor = new Doctor();
        doctor.setDoctorId(Long.valueOf(body.get("doctorId").toString()));
        slot.setDoctor(doctor);

        slot.setSlotDate(java.time.LocalDate.parse(body.get("slotDate").toString()));
        slot.setStartTime(body.get("startTime").toString());
        slot.setEndTime(body.get("endTime").toString());
        slot.setBooked(false);

        return slotService.addSlot(slot);
    }

    // ✅ Available slots - PATIENT பாக்க
    @GetMapping("/available/{doctorId}")
    public List<DoctorSlot> getAvailableSlots(@PathVariable Long doctorId) {
        return slotService.getAvailableSlots(doctorId);
    }

    // ✅ All slots - DOCTOR/ADMIN பாக்க
    @GetMapping("/doctor/{doctorId}")
    public List<DoctorSlot> getAllSlots(@PathVariable Long doctorId) {
        return slotService.getAllSlots(doctorId);
    }

    // ✅ Slot book பண்ணு
    @PutMapping("/book/{slotId}")
    public DoctorSlot bookSlot(@PathVariable Long slotId) {
        return slotService.bookSlot(slotId);
    }

    // ✅ Slot delete
    @DeleteMapping("/{slotId}")
    public String deleteSlot(@PathVariable Long slotId) {
        slotService.deleteSlot(slotId);
        return "Slot deleted";
    }
}