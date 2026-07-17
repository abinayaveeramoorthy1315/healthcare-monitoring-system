package com.healthcare.healthcare_monitoring_system.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.security.SecureRandom;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
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

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailTemplateService emailTemplateService;

    // ✅ Doctor save + Auto user create with secure credentials & Welcome email
    public Doctor saveDoctor(Doctor doctor) {
        Doctor saved = doctorRepository.save(doctor);

        String baseName = doctor.getDoctorName()
            .toLowerCase()
            .replace(" ", "")
            .replace("dr.", "")
            .replace("dr", "")
            .trim();
        if (baseName.isEmpty()) baseName = "doctor";
        String username = "dr" + baseName;
        int suffix = 1;
        while (userRepository.findByUsername(username).isPresent()) {
            username = "dr" + baseName + String.format("%02d", suffix++);
        }

        String rawPassword = generateSecurePassword();

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(Role.DOCTOR);
        user.setPasswordChanged(false);
        user.setEmail(doctor.getEmail());
        User savedUser = userRepository.save(user);

        // ✅ Doctor-ல userId save பண்ணு
        saved.setUserId(savedUser.getId());
        saved = doctorRepository.save(saved);

        if (doctor.getEmail() != null && !doctor.getEmail().trim().isEmpty()) {
            try {
                emailTemplateService.sendDoctorWelcomeMail(
                    doctor.getEmail(),
                    doctor.getDoctorName(),
                    username,
                    rawPassword,
                    "http://localhost:5173/login"
                );
            } catch (Exception ex) {
                System.err.println("Notice: Failed to send doctor welcome email: " + ex.getMessage());
            }
        }

        return saved;
    }

    private String generateSecurePassword() {
        String uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lowers = "abcdefghijklmnopqrstuvwxyz";
        String digits = "0123456789";
        String specials = "@#$!%*?&";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        sb.append(uppers.charAt(random.nextInt(uppers.length())));
        sb.append(lowers.charAt(random.nextInt(lowers.length())));
        sb.append(digits.charAt(random.nextInt(digits.length())));
        sb.append(specials.charAt(random.nextInt(specials.length())));
        String all = uppers + lowers + digits + specials;
        for (int i = 4; i < 10; i++) {
            sb.append(all.charAt(random.nextInt(all.length())));
        }
        List<Character> chars = new ArrayList<>();
        for (char c : sb.toString().toCharArray()) chars.add(c);
        Collections.shuffle(chars, random);
        StringBuilder finalPwd = new StringBuilder();
        for (char c : chars) finalPwd.append(c);
        return finalPwd.toString();
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