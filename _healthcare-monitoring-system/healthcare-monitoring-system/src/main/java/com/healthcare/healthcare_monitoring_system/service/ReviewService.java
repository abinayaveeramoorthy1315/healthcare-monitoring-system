package com.healthcare.healthcare_monitoring_system.service;

import com.healthcare.healthcare_monitoring_system.dto.ReviewSummaryDTO;
import com.healthcare.healthcare_monitoring_system.entity.*;
import com.healthcare.healthcare_monitoring_system.repository.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public ReviewService(ReviewRepository reviewRepository,
                          AppointmentRepository appointmentRepository,
                          PatientRepository patientRepository,
                          DoctorRepository doctorRepository) {
        this.reviewRepository = reviewRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    public Review submitReview(Long appointmentId, Long patientId, Long doctorId, Integer rating, String comment) {

        if (reviewRepository.existsByAppointment_AppointmentId(appointmentId)) {
            throw new RuntimeException("This appointment has already been reviewed.");
        }

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Review review = new Review();
        review.setAppointment(appointment);
        review.setPatient(patient);
        review.setDoctor(doctor);
        review.setRating(rating);
        review.setComment(comment);

        return reviewRepository.save(review);
    }

    public List<Review> getReviewsByDoctor(Long doctorId) {
        return reviewRepository.findByDoctor_DoctorId(doctorId);
    }

    public ReviewSummaryDTO getSummary(Long doctorId) {
        List<Review> reviews = reviewRepository.findByDoctor_DoctorId(doctorId);
        if (reviews.isEmpty()) {
            return new ReviewSummaryDTO(0.0, 0L);
        }
        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        return new ReviewSummaryDTO(Math.round(avg * 10.0) / 10.0, (long) reviews.size());
    }

    public boolean alreadyReviewed(Long appointmentId) {
        return reviewRepository.existsByAppointment_AppointmentId(appointmentId);
    }
}
