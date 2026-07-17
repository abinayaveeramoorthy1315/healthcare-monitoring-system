package com.healthcare.healthcare_monitoring_system.repository;

import com.healthcare.healthcare_monitoring_system.entity.*;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ProfileRepository {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final ReviewRepository reviewRepository;

    public ProfileRepository(UserRepository userRepository,
                             PatientRepository patientRepository,
                             DoctorRepository doctorRepository,
                             AppointmentRepository appointmentRepository,
                             PrescriptionRepository prescriptionRepository,
                             ReviewRepository reviewRepository) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.reviewRepository = reviewRepository;
    }

    public Optional<User> findUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findUserById(Long userId) {
        return userRepository.findById(userId);
    }

    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public Optional<Patient> findPatientByUserId(Long userId) {
        return patientRepository.findByUserId(userId);
    }

    public Optional<Patient> findPatientById(Long patientId) {
        return patientRepository.findById(patientId);
    }

    public Optional<Patient> findPatientByEmail(String email) {
        return patientRepository.findByEmail(email);
    }

    public Patient savePatient(Patient patient) {
        return patientRepository.save(patient);
    }

    public Optional<Doctor> findDoctorByUserId(Long userId) {
        return doctorRepository.findByUserId(userId);
    }

    public Optional<Doctor> findDoctorById(Long doctorId) {
        return doctorRepository.findById(doctorId);
    }

    public Optional<Doctor> findDoctorByEmail(String email) {
        return doctorRepository.findByEmail(email);
    }

    public Doctor saveDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    public List<Appointment> findAppointmentsByPatientId(Long patientId) {
        return appointmentRepository.findByPatient_PatientId(patientId);
    }

    public List<Appointment> findAppointmentsByDoctorId(Long doctorId) {
        return appointmentRepository.findByDoctor_DoctorId(doctorId);
    }

    public List<Prescription> findPrescriptionsByPatientId(Long patientId) {
        return prescriptionRepository.findByPatient_PatientId(patientId);
    }

    public List<Review> findReviewsByDoctorId(Long doctorId) {
        return reviewRepository.findByDoctor_DoctorId(doctorId);
    }
}
