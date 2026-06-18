package com.healthcare.healthcare_monitoring_system.repository;

import com.healthcare.healthcare_monitoring_system.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientUsernameOrderByCreatedAtDesc(String username);
    List<Notification> findByRecipientUsernameAndIsRead(String username, boolean isRead);
}