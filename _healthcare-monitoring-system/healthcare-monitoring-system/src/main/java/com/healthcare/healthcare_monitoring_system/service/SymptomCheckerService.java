package com.healthcare.healthcare_monitoring_system.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.healthcare_monitoring_system.dto.SymptomResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class SymptomCheckerService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final WebClient webClient;

    public SymptomCheckerService() {
        this.webClient = WebClient.builder().build();
    }

    public SymptomResponseDTO analyzeSymptoms(String symptoms) {

        String prompt = "You are a non-diagnostic AI health assistant. "
            + "A patient reports these symptoms: \"" + symptoms + "\". "
            + "Respond ONLY in strict JSON format (no markdown, no extra text) with these exact keys:\n"
            + "{"
            + "\"severity\": \"Mild or Moderate or Severe\", "
            + "\"possibleCauses\": \"short general explanation, 1-2 sentences, non-diagnostic\", "
            + "\"recommendation\": \"short advice, always suggest consulting a doctor if moderate or severe\", "
            + "\"suggestedSpecialization\": \"e.g. General Physician, Cardiologist, ENT, Dermatologist, etc.\""
            + "}\n"
            + "Never diagnose a disease. Keep each field under 30 words.";

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

            return parseResponse(response);

        } catch (Exception e) {
            e.printStackTrace();
            return new SymptomResponseDTO(
                "Unknown",
                "Unable to analyze symptoms right now.",
                "Please try again later or consult a doctor directly.",
                "General Physician"
            );
        }
    }

    private SymptomResponseDTO parseResponse(String response) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(response);

        String rawText = root.path("candidates").get(0)
            .path("content").path("parts").get(0)
            .path("text").asText();

        // Clean possible markdown code fences (```json ... ```)
        rawText = rawText.replace("```json", "").replace("```", "").trim();

        JsonNode result = mapper.readTree(rawText);

        return new SymptomResponseDTO(
            result.path("severity").asText("Unknown"),
            result.path("possibleCauses").asText("N/A"),
            result.path("recommendation").asText("Please consult a doctor."),
            result.path("suggestedSpecialization").asText("General Physician")
        );
    }
}