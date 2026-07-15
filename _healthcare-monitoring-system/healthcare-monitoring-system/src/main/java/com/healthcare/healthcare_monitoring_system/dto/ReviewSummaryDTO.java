package com.healthcare.healthcare_monitoring_system.dto;

public class ReviewSummaryDTO {
    private Double averageRating;
    private Long totalReviews;

    public ReviewSummaryDTO(Double averageRating, Long totalReviews) {
        this.averageRating = averageRating;
        this.totalReviews = totalReviews;
    }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Long getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Long totalReviews) { this.totalReviews = totalReviews; }
}