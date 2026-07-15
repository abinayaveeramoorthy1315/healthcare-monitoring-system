package com.healthcare.healthcare_monitoring_system.repository;



import com.healthcare.healthcare_monitoring_system.entity.ChatHistory;


import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatHistoryRepository extends JpaRepository<ChatHistory, Long> {
    List<ChatHistory> findByPatientIdOrderByCreatedAtAsc(String patientId);
}
