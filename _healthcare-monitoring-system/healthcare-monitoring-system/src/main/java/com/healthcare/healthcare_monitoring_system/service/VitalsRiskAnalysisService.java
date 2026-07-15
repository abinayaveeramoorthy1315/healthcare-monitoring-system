
package com.healthcare.healthcare_monitoring_system.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.healthcare_monitoring_system.entity.Notification;
import com.healthcare.healthcare_monitoring_system.entity.Patient;
import com.healthcare.healthcare_monitoring_system.entity.VitalSigns;
import com.healthcare.healthcare_monitoring_system.repository.NotificationRepository;
import com.healthcare.healthcare_monitoring_system.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class VitalsRiskAnalysisService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final WebClient webClient;
    private final NotificationRepository notificationRepository;
    private final PatientRepository patientRepository;

    public VitalsRiskAnalysisService(NotificationRepository notificationRepository,
                                      PatientRepository patientRepository) {
        this.webClient = WebClient.builder().build();
        this.notificationRepository = notificationRepository;
        this.patientRepository = patientRepository;
    }

    /**
     * Uses the riskLevel ALREADY calculated by VitalSignsService.
     * Only generates an AI explanation + doctor notification for HIGH/CRITICAL.
     */
    public void notifyDoctorIfNeeded(VitalSigns vitals, String doctorUsername) {
        String riskLevel = vitals.getRiskLevel();

        if (riskLevel == null || riskLevel.equalsIgnoreCase("LOW")) {
            return; // Normal vitals, no alert needed
        }

        // Fetch full patient details (input JSON only has patientId)
        Patient patient = null;
        if (vitals.getPatient() != null && vitals.getPatient().getPatientId() != null) {
            patient = patientRepository.findById(vitals.getPatient().getPatientId()).orElse(null);
        }

        String patientName = (patient != null && patient.getName() != null) ? patient.getName() : "Unknown Patient";

        String reason = getAIExplanation(vitals, riskLevel);
        createNotification(patientName, riskLevel, reason, doctorUsername);
    }

    private String getAIExplanation(VitalSigns v, String riskLevel) {
        String prompt = "A patient's vitals were recorded: "
            + "Heart Rate: " + v.getHeartRate() + " bpm, "
            + "Blood Pressure: " + v.getBloodPressure() + ", "
            + "Temperature: " + v.getTemperature() + "°C, "
            + "Oxygen Level: " + v.getOxygenLevel() + "%. "
            + "This has been classified as " + riskLevel + " risk. "
            + "In ONE short sentence (under 20 words), explain why this is concerning for a doctor. "
            + "Be direct and clinical, no greetings.";

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", prompt)
                ))
            )
        );

        try {
            String response = webClient.post()
                .uri(apiUrl + "?key=" + apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);
            return root.path("candidates").get(0)
                .path("content").path("parts").get(0)
                .path("text").asText().trim();

        } catch (Exception e) {
            e.printStackTrace();
            return riskLevel + " risk detected based on vitals thresholds.";
        }
    }

    private void createNotification(String patientName, String riskLevel, String reason, String doctorUsername) {
        String icon = riskLevel.equalsIgnoreCase("CRITICAL") ? "🔴" : "🟡";

        Notification notification = new Notification();
        notification.setRecipientUsername(doctorUsername);
        notification.setMessage(icon + " " + riskLevel + " Risk: " + patientName + " - " + reason);
        notification.setRead(false);
        notificationRepository.save(notification);
    }
}