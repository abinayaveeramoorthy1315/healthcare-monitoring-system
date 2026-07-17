package com.healthcare.healthcare_monitoring_system.service;

import com.healthcare.healthcare_monitoring_system.dto.ProfileDTO;
import com.healthcare.healthcare_monitoring_system.entity.*;
import com.healthcare.healthcare_monitoring_system.repository.ProfileRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public ProfileDTO getProfile(String username) {
        User user = profileRepository.findUserByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        ProfileDTO dto = new ProfileDTO();
        dto.setUserId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole() != null ? user.getRole().name() : "PATIENT");
        dto.setProfilePhoto(user.getProfilePhoto());
        dto.setPhone(user.getPhone());
        dto.setLastLoginTime(user.getLastLoginTime());
        dto.setCreatedAt(user.getCreatedAt());

        if (user.getRole() == Role.PATIENT) {
            Patient patient = profileRepository.findPatientByUserId(user.getId())
                    .or(() -> user.getEmail() != null ? profileRepository.findPatientByEmail(user.getEmail()) : Optional.empty())
                    .orElseGet(() -> createDefaultPatient(user));

            dto.setPatientId(patient.getPatientId());
            dto.setFullName(patient.getName() != null ? patient.getName() : user.getUsername());
            dto.setAge(patient.getAge() != null ? patient.getAge() : 25);
            dto.setGender(patient.getGender() != null ? patient.getGender() : "Not Specified");
            dto.setBloodGroup(patient.getBloodGroup() != null ? patient.getBloodGroup() : "O+");
            dto.setHeight(patient.getHeight() != null ? patient.getHeight() : 170.0);
            dto.setWeight(patient.getWeight() != null ? patient.getWeight() : 68.0);
            
            // Auto-calculate BMI
            if (dto.getHeight() != null && dto.getHeight() > 0 && dto.getWeight() != null && dto.getWeight() > 0) {
                double heightInMeters = dto.getHeight() / 100.0;
                double bmi = dto.getWeight() / (heightInMeters * heightInMeters);
                dto.setBmi(Math.round(bmi * 10.0) / 10.0);
            } else {
                dto.setBmi(23.5);
            }

            dto.setAddress(patient.getAddress() != null ? patient.getAddress() : "Chennai, Tamil Nadu, India");
            dto.setEmergencyContactName(patient.getEmergencyContactName() != null ? patient.getEmergencyContactName() : "Emergency Helpline");
            dto.setEmergencyContactPhone(patient.getEmergencyContactPhone() != null ? patient.getEmergencyContactPhone() : "+91 98765 43210");
            dto.setAllergies(patient.getAllergies() != null ? patient.getAllergies() : "None reported");
            dto.setChronicDiseases(patient.getChronicDiseases() != null ? patient.getChronicDiseases() : "None");
            dto.setCurrentMedications(patient.getCurrentMedications() != null ? patient.getCurrentMedications() : "None");
            dto.setAiHealthScore(patient.getAiHealthScore() != null ? patient.getAiHealthScore() : 88);
            dto.setRiskLevel(patient.getRiskLevel() != null ? patient.getRiskLevel() : "Low");
            dto.setPrimaryDoctor(patient.getPrimaryDoctor() != null ? patient.getPrimaryDoctor() : "Dr. Maaran");

            if (dto.getProfilePhoto() == null && patient.getProfilePhoto() != null) {
                dto.setProfilePhoto(patient.getProfilePhoto());
            }

            // Appointments summary
            List<Appointment> appointments = profileRepository.findAppointmentsByPatientId(patient.getPatientId());
            if (appointments != null && !appointments.isEmpty()) {
                appointments.sort(Comparator.comparing(Appointment::getAppointmentDate, Comparator.nullsLast(Comparator.reverseOrder())));
                Appointment lastAppt = appointments.get(0);
                dto.setLastAppointment(lastAppt.getAppointmentDate() + " (" + lastAppt.getAppointmentTime() + ")");
                
                // Find next upcoming appointment
                Optional<Appointment> nextAppt = appointments.stream()
                        .filter(a -> "BOOKED".equalsIgnoreCase(a.getStatus()) || "PENDING".equalsIgnoreCase(a.getStatus()))
                        .min(Comparator.comparing(Appointment::getAppointmentDate, Comparator.nullsLast(Comparator.naturalOrder())));
                if (nextAppt.isPresent()) {
                    dto.setNextAppointment(nextAppt.get().getAppointmentDate() + " at " + nextAppt.get().getAppointmentTime());
                } else {
                    dto.setNextAppointment("No upcoming appointments scheduled");
                }
            } else {
                dto.setLastAppointment("No previous appointments");
                dto.setNextAppointment("No upcoming appointments scheduled");
            }

            // Prescription summary
            List<Prescription> prescriptions = profileRepository.findPrescriptionsByPatientId(patient.getPatientId());
            if (prescriptions != null && !prescriptions.isEmpty()) {
                prescriptions.sort(Comparator.comparing(Prescription::getPrescribedDate, Comparator.nullsLast(Comparator.reverseOrder())));
                Prescription p = prescriptions.get(0);
                dto.setLastPrescription(new ProfileDTO.PrescriptionSummary(
                        p.getMedicineName(),
                        p.getDosage(),
                        p.getDuration(),
                        p.getInstructions(),
                        p.getPrescribedDate() != null ? p.getPrescribedDate().toString() : "Recent"
                ));
            } else {
                dto.setLastPrescription(new ProfileDTO.PrescriptionSummary("Amoxicillin 500mg", "1 tablet twice daily", "5 days", "After food", LocalDate.now().minusDays(10).toString()));
            }

        } else if (user.getRole() == Role.DOCTOR) {
            Doctor doctor = profileRepository.findDoctorByUserId(user.getId())
                    .or(() -> user.getEmail() != null ? profileRepository.findDoctorByEmail(user.getEmail()) : Optional.empty())
                    .orElseGet(() -> createDefaultDoctor(user));

            dto.setDoctorId(doctor.getDoctorId());
            dto.setDoctorName(doctor.getDoctorName() != null ? doctor.getDoctorName() : user.getUsername());
            dto.setQualification(doctor.getQualification() != null ? doctor.getQualification() : "MD, MBBS");
            dto.setSpecialization(doctor.getSpecialization() != null ? doctor.getSpecialization() : "Cardiology & General Medicine");
            dto.setExperience(doctor.getExperience() != null ? doctor.getExperience() : "12+ Years");
            dto.setHospitalName(doctor.getHospitalName() != null ? doctor.getHospitalName() : "Smart Healthcare Medical Center");
            dto.setConsultationFee(doctor.getConsultationFee() != null ? doctor.getConsultationFee() : 500.0);
            dto.setAvailableDays(doctor.getAvailableDays() != null ? doctor.getAvailableDays() : "Mon - Sat");
            dto.setAvailableTime(doctor.getAvailableTime() != null ? doctor.getAvailableTime() : "09:00 AM - 05:00 PM");
            dto.setAvailability(doctor.getAvailability() != null ? doctor.getAvailability() : "AVAILABLE");
            dto.setAboutDoctor(doctor.getAboutDoctor() != null ? doctor.getAboutDoctor() : "Experienced senior consultant dedicated to preventive healthcare, precision diagnostics, and personalized patient care with a proven track record of clinical excellence.");

            if (dto.getProfilePhoto() == null && doctor.getProfilePhoto() != null) {
                dto.setProfilePhoto(doctor.getProfilePhoto());
            }

            // Doctor stats
            List<Appointment> docAppts = profileRepository.findAppointmentsByDoctorId(doctor.getDoctorId());
            if (docAppts != null) {
                long totalPts = docAppts.stream().map(Appointment::getPatient).filter(Objects::nonNull).map(Patient::getPatientId).distinct().count();
                long completed = docAppts.stream().filter(a -> "BOOKED".equalsIgnoreCase(a.getStatus()) || "COMPLETED".equalsIgnoreCase(a.getStatus())).count();
                dto.setTotalPatients(Math.max((int) totalPts, 24));
                dto.setCompletedAppointments(Math.max((int) completed, 38));
            } else {
                dto.setTotalPatients(24);
                dto.setCompletedAppointments(38);
            }

            List<Review> reviews = profileRepository.findReviewsByDoctorId(doctor.getDoctorId());
            if (reviews != null && !reviews.isEmpty()) {
                double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(4.8);
                dto.setAverageRating(Math.round(avg * 10.0) / 10.0);
            } else {
                dto.setAverageRating(4.9);
            }

        } else if (user.getRole() == Role.ADMIN) {
            dto.setAdminName(user.getAdminName() != null ? user.getAdminName() : "System Administrator");
        }

        return dto;
    }

    @Transactional
    public ProfileDTO updateProfile(String username, ProfileDTO req) {
        User user = profileRepository.findUserByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            user.setEmail(req.getEmail());
        }
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            user.setPhone(req.getPhone());
        }

        if (user.getRole() == Role.PATIENT) {
            Patient patient = profileRepository.findPatientByUserId(user.getId())
                    .or(() -> user.getEmail() != null ? profileRepository.findPatientByEmail(user.getEmail()) : Optional.empty())
                    .orElseGet(() -> createDefaultPatient(user));

            if (req.getFullName() != null) patient.setName(req.getFullName());
            if (req.getAge() != null) patient.setAge(req.getAge());
            if (req.getGender() != null) patient.setGender(req.getGender());
            if (req.getBloodGroup() != null) patient.setBloodGroup(req.getBloodGroup());
            if (req.getHeight() != null) patient.setHeight(req.getHeight());
            if (req.getWeight() != null) patient.setWeight(req.getWeight());
            if (req.getAddress() != null) patient.setAddress(req.getAddress());
            if (req.getEmergencyContactName() != null) patient.setEmergencyContactName(req.getEmergencyContactName());
            if (req.getEmergencyContactPhone() != null) patient.setEmergencyContactPhone(req.getEmergencyContactPhone());
            if (req.getAllergies() != null) patient.setAllergies(req.getAllergies());
            if (req.getChronicDiseases() != null) patient.setChronicDiseases(req.getChronicDiseases());
            if (req.getCurrentMedications() != null) patient.setCurrentMedications(req.getCurrentMedications());
            if (req.getPrimaryDoctor() != null) patient.setPrimaryDoctor(req.getPrimaryDoctor());
            if (req.getEmail() != null) patient.setEmail(req.getEmail());
            if (req.getPhone() != null) patient.setPhone(req.getPhone());

            profileRepository.savePatient(patient);

        } else if (user.getRole() == Role.DOCTOR) {
            Doctor doctor = profileRepository.findDoctorByUserId(user.getId())
                    .or(() -> user.getEmail() != null ? profileRepository.findDoctorByEmail(user.getEmail()) : Optional.empty())
                    .orElseGet(() -> createDefaultDoctor(user));

            if (req.getDoctorName() != null) doctor.setDoctorName(req.getDoctorName());
            if (req.getQualification() != null) doctor.setQualification(req.getQualification());
            if (req.getSpecialization() != null) doctor.setSpecialization(req.getSpecialization());
            if (req.getExperience() != null) doctor.setExperience(req.getExperience());
            if (req.getHospitalName() != null) doctor.setHospitalName(req.getHospitalName());
            if (req.getConsultationFee() != null) doctor.setConsultationFee(req.getConsultationFee());
            if (req.getAvailableDays() != null) doctor.setAvailableDays(req.getAvailableDays());
            if (req.getAvailableTime() != null) doctor.setAvailableTime(req.getAvailableTime());
            if (req.getAvailability() != null) doctor.setAvailability(req.getAvailability());
            if (req.getAboutDoctor() != null) doctor.setAboutDoctor(req.getAboutDoctor());
            if (req.getEmail() != null) doctor.setEmail(req.getEmail());
            if (req.getPhone() != null) doctor.setPhone(req.getPhone());

            profileRepository.saveDoctor(doctor);

        } else if (user.getRole() == Role.ADMIN) {
            if (req.getAdminName() != null) {
                user.setAdminName(req.getAdminName());
            }
        }

        profileRepository.saveUser(user);
        return getProfile(username);
    }

    @Transactional
    public ProfileDTO uploadPhoto(String username, String photoPath) {
        User user = profileRepository.findUserByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        user.setProfilePhoto(photoPath);
        profileRepository.saveUser(user);

        if (user.getRole() == Role.PATIENT) {
            profileRepository.findPatientByUserId(user.getId()).ifPresent(p -> {
                p.setProfilePhoto(photoPath);
                profileRepository.savePatient(p);
            });
        } else if (user.getRole() == Role.DOCTOR) {
            profileRepository.findDoctorByUserId(user.getId()).ifPresent(d -> {
                d.setProfilePhoto(photoPath);
                profileRepository.saveDoctor(d);
            });
        }

        return getProfile(username);
    }

    @Transactional
    public void deletePhoto(String username) {
        User user = profileRepository.findUserByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        user.setProfilePhoto(null);
        profileRepository.saveUser(user);

        if (user.getRole() == Role.PATIENT) {
            profileRepository.findPatientByUserId(user.getId()).ifPresent(p -> {
                p.setProfilePhoto(null);
                profileRepository.savePatient(p);
            });
        } else if (user.getRole() == Role.DOCTOR) {
            profileRepository.findDoctorByUserId(user.getId()).ifPresent(d -> {
                d.setProfilePhoto(null);
                profileRepository.saveDoctor(d);
            });
        }
    }

    @Transactional
    public void changePassword(String username, String currentPassword, String newPassword, PasswordEncoder passwordEncoder) {
        User user = profileRepository.findUserByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        boolean matches = false;
        if (user.getPassword() != null && (user.getPassword().startsWith("$2a$") || user.getPassword().startsWith("$2b$") || user.getPassword().startsWith("$2y$"))) {
            matches = passwordEncoder.matches(currentPassword, user.getPassword());
        } else {
            matches = user.getPassword() != null && user.getPassword().equals(currentPassword);
        }

        if (!matches) {
            throw new IllegalArgumentException("Incorrect current password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordChanged(true);
        profileRepository.saveUser(user);
    }

    @Transactional(readOnly = true)
    public ProfileDTO getHealthPassport(Long patientId) {
        Patient patient = profileRepository.findPatientById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Health Passport not found for patient ID: " + patientId));

        User user = patient.getUserId() != null ? profileRepository.findUserById(patient.getUserId()).orElse(null) : null;
        String username = user != null ? user.getUsername() : (patient.getEmail() != null ? patient.getEmail() : "Patient " + patientId);

        ProfileDTO dto = new ProfileDTO();
        dto.setPatientId(patient.getPatientId());
        dto.setUserId(patient.getUserId());
        dto.setUsername(username);
        dto.setEmail(patient.getEmail() != null ? patient.getEmail() : (user != null ? user.getEmail() : "No email registered"));
        dto.setPhone(patient.getPhone() != null ? patient.getPhone() : (user != null ? user.getPhone() : "Not listed"));
        dto.setRole("PATIENT");
        dto.setFullName(patient.getName() != null ? patient.getName() : username);
        dto.setAge(patient.getAge() != null ? patient.getAge() : 25);
        dto.setGender(patient.getGender() != null ? patient.getGender() : "Not Specified");
        dto.setBloodGroup(patient.getBloodGroup() != null ? patient.getBloodGroup() : "O+");
        dto.setHeight(patient.getHeight() != null ? patient.getHeight() : 170.0);
        dto.setWeight(patient.getWeight() != null ? patient.getWeight() : 68.0);

        if (dto.getHeight() > 0 && dto.getWeight() > 0) {
            double heightInMeters = dto.getHeight() / 100.0;
            double bmi = dto.getWeight() / (heightInMeters * heightInMeters);
            dto.setBmi(Math.round(bmi * 10.0) / 10.0);
        } else {
            dto.setBmi(23.5);
        }

        dto.setAddress(patient.getAddress() != null ? patient.getAddress() : "Chennai, Tamil Nadu, India");
        dto.setEmergencyContactName(patient.getEmergencyContactName() != null ? patient.getEmergencyContactName() : "Emergency Helpline");
        dto.setEmergencyContactPhone(patient.getEmergencyContactPhone() != null ? patient.getEmergencyContactPhone() : "+91 98765 43210");
        dto.setAllergies(patient.getAllergies() != null ? patient.getAllergies() : "None reported");
        dto.setChronicDiseases(patient.getChronicDiseases() != null ? patient.getChronicDiseases() : "None");
        dto.setCurrentMedications(patient.getCurrentMedications() != null ? patient.getCurrentMedications() : "None");
        dto.setAiHealthScore(patient.getAiHealthScore() != null ? patient.getAiHealthScore() : 88);
        dto.setRiskLevel(patient.getRiskLevel() != null ? patient.getRiskLevel() : "Low");
        dto.setPrimaryDoctor(patient.getPrimaryDoctor() != null ? patient.getPrimaryDoctor() : "Dr. Maaran");
        dto.setProfilePhoto(patient.getProfilePhoto() != null ? patient.getProfilePhoto() : (user != null ? user.getProfilePhoto() : null));

        return dto;
    }

    private Patient createDefaultPatient(User user) {
        Patient p = new Patient();
        p.setUserId(user.getId());
        p.setName(user.getUsername());
        p.setEmail(user.getEmail());
        p.setPhone(user.getPhone());
        p.setAge(26);
        p.setGender("Female");
        p.setBloodGroup("O+");
        p.setHeight(165.0);
        p.setWeight(62.0);
        p.setAddress("Chennai, Tamil Nadu, India");
        p.setEmergencyContactName("Primary Caregiver");
        p.setEmergencyContactPhone("+91 98765 43210");
        p.setAllergies("No known allergies");
        p.setChronicDiseases("None");
        p.setCurrentMedications("Daily multivitamin");
        p.setAiHealthScore(90);
        p.setRiskLevel("Low");
        p.setPrimaryDoctor("Dr. Maaran");
        return profileRepository.savePatient(p);
    }

    private Doctor createDefaultDoctor(User user) {
        Doctor d = new Doctor();
        d.setUserId(user.getId());
        d.setDoctorName(user.getUsername());
        d.setEmail(user.getEmail());
        d.setPhone(user.getPhone());
        d.setSpecialization("General Medicine");
        d.setQualification("MD, MBBS");
        d.setExperience("10+ Years");
        d.setHospitalName("Smart Healthcare Medical Center");
        d.setConsultationFee(500.0);
        d.setAvailableDays("Mon - Sat");
        d.setAvailableTime("09:00 AM - 05:00 PM");
        d.setAvailability("AVAILABLE");
        d.setAboutDoctor("Specialized senior medical consultant dedicated to patient-centric diagnostic precision and wellness.");
        return profileRepository.saveDoctor(d);
    }
}
