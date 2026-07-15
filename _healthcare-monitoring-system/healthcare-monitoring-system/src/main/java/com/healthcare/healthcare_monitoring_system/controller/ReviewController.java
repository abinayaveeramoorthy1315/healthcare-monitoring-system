package com.healthcare.healthcare_monitoring_system.controller;

import com.healthcare.healthcare_monitoring_system.dto.ReviewSummaryDTO;
import com.healthcare.healthcare_monitoring_system.entity.Review;
import com.healthcare.healthcare_monitoring_system.service.ReviewService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:5173")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public Review submitReview(@RequestBody Map<String, Object> body) {
        Long appointmentId = Long.valueOf(body.get("appointmentId").toString());
        Long patientId = Long.valueOf(body.get("patientId").toString());
        Long doctorId = Long.valueOf(body.get("doctorId").toString());
        Integer rating = Integer.valueOf(body.get("rating").toString());
        String comment = body.get("comment") != null ? body.get("comment").toString() : "";

        return reviewService.submitReview(appointmentId, patientId, doctorId, rating, comment);
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Review> getReviewsByDoctor(@PathVariable Long doctorId) {
        return reviewService.getReviewsByDoctor(doctorId);
    }

    @GetMapping("/doctor/{doctorId}/summary")
    public ReviewSummaryDTO getSummary(@PathVariable Long doctorId) {
        return reviewService.getSummary(doctorId);
    }

    @GetMapping("/exists/{appointmentId}")
    public Map<String, Boolean> exists(@PathVariable Long appointmentId) {
        return Map.of("reviewed", reviewService.alreadyReviewed(appointmentId));
    }
}
