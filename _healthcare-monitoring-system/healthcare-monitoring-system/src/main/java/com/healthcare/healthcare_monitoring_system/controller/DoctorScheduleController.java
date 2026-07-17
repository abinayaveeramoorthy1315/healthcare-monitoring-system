package com.healthcare.healthcare_monitoring_system.controller;

import com.healthcare.healthcare_monitoring_system.entity.DoctorSchedule;
import com.healthcare.healthcare_monitoring_system.service.DoctorScheduleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "*"})
public class DoctorScheduleController {

    private final DoctorScheduleService scheduleService;

    public DoctorScheduleController(DoctorScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping("/doctor/{doctorId}")
    public List<DoctorSchedule> getDoctorSchedules(@PathVariable Long doctorId) {
        return scheduleService.getDoctorSchedules(doctorId);
    }

    @PostMapping("/doctor/{doctorId}")
    public List<DoctorSchedule> saveWeeklySchedules(@PathVariable Long doctorId, @RequestBody List<DoctorSchedule> schedules) {
        return scheduleService.saveWeeklySchedules(doctorId, schedules);
    }

    @PostMapping("/generate/{doctorId}")
    public String generateSlots(@PathVariable Long doctorId) {
        scheduleService.generateSlotsForNext30Days(doctorId);
        return "Slots generated successfully for next 30 days";
    }
}
