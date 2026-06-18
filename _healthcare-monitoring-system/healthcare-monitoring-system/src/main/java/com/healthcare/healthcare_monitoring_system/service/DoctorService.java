package com.healthcare.healthcare_monitoring_system.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.healthcare.healthcare_monitoring_system.entity.Doctor;
import com.healthcare.healthcare_monitoring_system.entity.Role;
import com.healthcare.healthcare_monitoring_system.entity.User;
import com.healthcare.healthcare_monitoring_system.repository.DoctorRepository;
import com.healthcare.healthcare_monitoring_system.repository.UserRepository;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private UserRepository userRepository;

    // ✅ Doctor save + Auto user create
    public Doctor saveDoctor(Doctor doctor) {
        Doctor saved = doctorRepository.save(doctor);

        // Username = doctorname lowercase, spaces remove
        String username = doctor.getDoctorName()
            .toLowerCase()
            .replace(" ", "")
            .replace("dr.", "")
            .replace("dr", "")
            .trim();

        // Already exists check
        if (userRepository.findByUsername(username).isEmpty()) {
            User user = new User();
            user.setUsername(username);
            user.setPassword(username + "123"); // default password
            user.setRole(Role.DOCTOR);
            User savedUser = userRepository.save(user);

            // ✅ Doctor-ல userId save பண்ணு
            saved.setUserId(savedUser.getId());
            doctorRepository.save(saved);
        }

        return saved;
    }

    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    public Doctor updateDoctor(Long id, Doctor doctor) {
        Doctor existing = doctorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Doctor not found"));
        existing.setDoctorName(doctor.getDoctorName());
        existing.setSpecialization(doctor.getSpecialization());
        existing.setPhone(doctor.getPhone());
        existing.setEmail(doctor.getEmail());
        existing.setAvailability(doctor.getAvailability());
        return doctorRepository.save(existing);
    }

    public void deleteDoctor(Long id) {
        doctorRepository.deleteById(id);
    }
}