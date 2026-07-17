package com.healthcare.healthcare_monitoring_system.service;

import com.healthcare.healthcare_monitoring_system.entity.Doctor;
import com.healthcare.healthcare_monitoring_system.entity.DoctorSchedule;
import com.healthcare.healthcare_monitoring_system.entity.DoctorSlot;
import com.healthcare.healthcare_monitoring_system.repository.DoctorRepository;
import com.healthcare.healthcare_monitoring_system.repository.DoctorScheduleRepository;
import com.healthcare.healthcare_monitoring_system.repository.DoctorSlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class DoctorScheduleService {

    private final DoctorScheduleRepository scheduleRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorSlotRepository slotRepository;

    public DoctorScheduleService(DoctorScheduleRepository scheduleRepository,
                                 DoctorRepository doctorRepository,
                                 DoctorSlotRepository slotRepository) {
        this.scheduleRepository = scheduleRepository;
        this.doctorRepository = doctorRepository;
        this.slotRepository = slotRepository;
    }

    public List<DoctorSchedule> getDoctorSchedules(Long doctorId) {
        return scheduleRepository.findByDoctor_DoctorId(doctorId);
    }

    @Transactional
    public List<DoctorSchedule> saveWeeklySchedules(Long doctorId, List<DoctorSchedule> newSchedules) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found with ID: " + doctorId));

        for (DoctorSchedule ns : newSchedules) {
            Optional<DoctorSchedule> existingOpt = scheduleRepository.findByDoctor_DoctorIdAndDayOfWeek(doctorId, ns.getDayOfWeek());
            if (existingOpt.isPresent()) {
                DoctorSchedule existing = existingOpt.get();
                existing.setStartTime(ns.getStartTime());
                existing.setEndTime(ns.getEndTime());
                existing.setSlotDurationMinutes(ns.getSlotDurationMinutes());
                existing.setActive(ns.isActive());
                scheduleRepository.save(existing);
            } else {
                ns.setDoctor(doctor);
                scheduleRepository.save(ns);
            }
        }

        // Generate slots immediately after updating schedule
        generateSlotsForNext30Days(doctorId);

        return scheduleRepository.findByDoctor_DoctorId(doctorId);
    }

    @Transactional
    public void generateSlotsForNext30Days(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
        if (doctor == null) return;

        List<DoctorSchedule> schedules = scheduleRepository.findByDoctor_DoctorId(doctorId);
        if (schedules.isEmpty()) return;

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        LocalDate today = LocalDate.now();

        for (int i = 0; i <= 30; i++) {
            LocalDate date = today.plusDays(i);
            String dayName = date.getDayOfWeek().name();

            for (DoctorSchedule schedule : schedules) {
                if (schedule.getDayOfWeek().equalsIgnoreCase(dayName) && schedule.isActive()) {
                    try {
                        LocalTime current = LocalTime.parse(schedule.getStartTime());
                        LocalTime end = LocalTime.parse(schedule.getEndTime());
                        int duration = schedule.getSlotDurationMinutes() > 0 ? schedule.getSlotDurationMinutes() : 30;

                        while (!current.plusMinutes(duration).isAfter(end)) {
                            String startTimeStr = current.format(timeFormatter);
                            String endTimeStr = current.plusMinutes(duration).format(timeFormatter);

                            Optional<DoctorSlot> existingSlot = slotRepository
                                    .findByDoctor_DoctorIdAndSlotDateAndStartTime(doctorId, date, startTimeStr);

                            if (existingSlot.isEmpty()) {
                                DoctorSlot newSlot = new DoctorSlot();
                                newSlot.setDoctor(doctor);
                                newSlot.setSlotDate(date);
                                newSlot.setStartTime(startTimeStr);
                                newSlot.setEndTime(endTimeStr);
                                newSlot.setBooked(false);
                                slotRepository.save(newSlot);
                            }

                            current = current.plusMinutes(duration);
                        }
                    } catch (Exception e) {
                        System.err.println("Error generating slots for schedule: " + schedule.getScheduleId() + " - " + e.getMessage());
                    }
                }
            }
        }
    }
}
