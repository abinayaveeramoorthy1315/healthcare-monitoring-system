package com.healthcare.healthcare_monitoring_system.dto;

import java.time.LocalDateTime;

public class ProfileDTO {

    // Common fields across roles
    private Long userId;
    private String username;
    private String email;
    private String role; // "PATIENT", "DOCTOR", "ADMIN"
    private String profilePhoto;
    private String phone;
    private LocalDateTime lastLoginTime;
    private LocalDateTime createdAt;

    // Patient specific fields
    private Long patientId;
    private String fullName;
    private Integer age;
    private String gender;
    private String bloodGroup;
    private Double height;
    private Double weight;
    private Double bmi;
    private String address;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String allergies;
    private String chronicDiseases;
    private String currentMedications;
    private Integer aiHealthScore;
    private String riskLevel;
    private String primaryDoctor;
    private String lastAppointment;
    private String nextAppointment;
    private PrescriptionSummary lastPrescription;

    // Doctor specific fields
    private Long doctorId;
    private String doctorName;
    private String qualification;
    private String specialization;
    private String experience;
    private String hospitalName;
    private Double consultationFee;
    private String availableDays;
    private String availableTime;
    private String availability;
    private Integer totalPatients;
    private Integer completedAppointments;
    private Double averageRating;
    private String aboutDoctor;

    // Admin specific fields
    private String adminName;

    public ProfileDTO() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(String profilePhoto) { this.profilePhoto = profilePhoto; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public LocalDateTime getLastLoginTime() { return lastLoginTime; }
    public void setLastLoginTime(LocalDateTime lastLoginTime) { this.lastLoginTime = lastLoginTime; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public Double getHeight() { return height; }
    public void setHeight(Double height) { this.height = height; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public Double getBmi() { return bmi; }
    public void setBmi(Double bmi) { this.bmi = bmi; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }

    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getChronicDiseases() { return chronicDiseases; }
    public void setChronicDiseases(String chronicDiseases) { this.chronicDiseases = chronicDiseases; }

    public String getCurrentMedications() { return currentMedications; }
    public void setCurrentMedications(String currentMedications) { this.currentMedications = currentMedications; }

    public Integer getAiHealthScore() { return aiHealthScore; }
    public void setAiHealthScore(Integer aiHealthScore) { this.aiHealthScore = aiHealthScore; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getPrimaryDoctor() { return primaryDoctor; }
    public void setPrimaryDoctor(String primaryDoctor) { this.primaryDoctor = primaryDoctor; }

    public String getLastAppointment() { return lastAppointment; }
    public void setLastAppointment(String lastAppointment) { this.lastAppointment = lastAppointment; }

    public String getNextAppointment() { return nextAppointment; }
    public void setNextAppointment(String nextAppointment) { this.nextAppointment = nextAppointment; }

    public PrescriptionSummary getLastPrescription() { return lastPrescription; }
    public void setLastPrescription(PrescriptionSummary lastPrescription) { this.lastPrescription = lastPrescription; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }

    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

    public Double getConsultationFee() { return consultationFee; }
    public void setConsultationFee(Double consultationFee) { this.consultationFee = consultationFee; }

    public String getAvailableDays() { return availableDays; }
    public void setAvailableDays(String availableDays) { this.availableDays = availableDays; }

    public String getAvailableTime() { return availableTime; }
    public void setAvailableTime(String availableTime) { this.availableTime = availableTime; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public Integer getTotalPatients() { return totalPatients; }
    public void setTotalPatients(Integer totalPatients) { this.totalPatients = totalPatients; }

    public Integer getCompletedAppointments() { return completedAppointments; }
    public void setCompletedAppointments(Integer completedAppointments) { this.completedAppointments = completedAppointments; }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public String getAboutDoctor() { return aboutDoctor; }
    public void setAboutDoctor(String aboutDoctor) { this.aboutDoctor = aboutDoctor; }

    public String getAdminName() { return adminName; }
    public void setAdminName(String adminName) { this.adminName = adminName; }

    public static class PrescriptionSummary {
        private String medicineName;
        private String dosage;
        private String duration;
        private String instructions;
        private String prescribedDate;

        public PrescriptionSummary() {}

        public PrescriptionSummary(String medicineName, String dosage, String duration, String instructions, String prescribedDate) {
            this.medicineName = medicineName;
            this.dosage = dosage;
            this.duration = duration;
            this.instructions = instructions;
            this.prescribedDate = prescribedDate;
        }

        public String getMedicineName() { return medicineName; }
        public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

        public String getDosage() { return dosage; }
        public void setDosage(String dosage) { this.dosage = dosage; }

        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }

        public String getInstructions() { return instructions; }
        public void setInstructions(String instructions) { this.instructions = instructions; }

        public String getPrescribedDate() { return prescribedDate; }
        public void setPrescribedDate(String prescribedDate) { this.prescribedDate = prescribedDate; }
    }
}
