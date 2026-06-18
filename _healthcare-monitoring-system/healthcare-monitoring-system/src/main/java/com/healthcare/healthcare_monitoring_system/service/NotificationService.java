package com.healthcare.healthcare_monitoring_system.service;

import com.healthcare.healthcare_monitoring_system.entity.Notification;
import com.healthcare.healthcare_monitoring_system.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    // ✅ Notification create
    public Notification createNotification(String recipientUsername, String message) {
        Notification notification = new Notification();
        notification.setRecipientUsername(recipientUsername);
        notification.setMessage(message);
        return notificationRepository.save(notification);
    }

    // ✅ User-ஓட எல்லா notifications
    public List<Notification> getNotifications(String username) {
        return notificationRepository
            .findByRecipientUsernameOrderByCreatedAtDesc(username);
    }

    // ✅ Unread count
    public long getUnreadCount(String username) {
        return notificationRepository
            .findByRecipientUsernameAndIsRead(username, false).size();
    }

    // ✅ Mark as read
    public void markAsRead(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Not found"));
        n.setRead(true);
        notificationRepository.save(n);
    }

    // ✅ Mark all as read
    public void markAllAsRead(String username) {
        List<Notification> unread = notificationRepository
            .findByRecipientUsernameAndIsRead(username, false);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}
