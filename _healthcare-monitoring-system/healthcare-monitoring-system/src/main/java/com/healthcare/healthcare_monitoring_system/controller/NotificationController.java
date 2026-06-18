package com.healthcare.healthcare_monitoring_system.controller;

import com.healthcare.healthcare_monitoring_system.entity.Notification;
import com.healthcare.healthcare_monitoring_system.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    // ✅ User notifications
    @GetMapping("/{username}")
    public List<Notification> getNotifications(@PathVariable String username) {
        return notificationService.getNotifications(username);
    }

    // ✅ Unread count
    @GetMapping("/unread/{username}")
    public Map<String, Long> getUnreadCount(@PathVariable String username) {
        return Map.of("count", notificationService.getUnreadCount(username));
    }

    // ✅ Mark as read
    @PutMapping("/read/{id}")
    public String markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return "Marked as read";
    }

    // ✅ Mark all as read
    @PutMapping("/read-all/{username}")
    public String markAllAsRead(@PathVariable String username) {
        notificationService.markAllAsRead(username);
        return "All marked as read";
    }
}