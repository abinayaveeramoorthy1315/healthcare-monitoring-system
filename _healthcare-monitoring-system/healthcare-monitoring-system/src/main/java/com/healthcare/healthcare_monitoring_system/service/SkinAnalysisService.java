package com.healthcare.healthcare_monitoring_system.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.healthcare_monitoring_system.dto.SkinAnalysisResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class SkinAnalysisService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final WebClient webClient;

    public SkinAnalysisService() {
        this.webClient = WebClient.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
    }

    public SkinAnalysisResponseDTO analyzeImage(MultipartFile file) {
        try {
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
            String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";

            String prompt = "You are a non-diagnostic AI health assistant analyzing a skin/wound photo. "
                + "Respond ONLY in strict JSON format (no markdown, no extra text) with these exact keys:\n"
                + "{"
                + "\"severity\": \"Mild or Moderate or Severe\", "
                + "\"observation\": \"short general visual description of what you see, 1-2 sentences, non-diagnostic\", "
                + "\"recommendation\": \"short advice, always suggest consulting a doctor for proper diagnosis\", "
                + "\"suggestedSpecialization\": \"Dermatologist\""
                + "}\n"
                + "Never diagnose a specific disease. If the image is not skin/wound related, "
                + "set severity to \"Unknown\" and explain in observation. Keep each field under 30 words.";

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("text", prompt),
                        Map.of("inline_data", Map.of(
                            "mime_type", mimeType,
                            "data", base64Image
                        ))
                    ))
                )
            );

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
            return new SkinAnalysisResponseDTO(
                "Unknown",
                "Unable to analyze the image right now.",
                "Please try again later or consult a doctor directly.",
                "Dermatologist"
            );
        }
    }

    private SkinAnalysisResponseDTO parseResponse(String response) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(response);

        String rawText = root.path("candidates").get(0)
            .path("content").path("parts").get(0)
            .path("text").asText();

        rawText = rawText.replace("```json", "").replace("```", "").trim();

        int startIndex = rawText.indexOf("{");
        int endIndex = rawText.lastIndexOf("}");
        if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
            rawText = rawText.substring(startIndex, endIndex + 1);
        }

        JsonNode result = mapper.readTree(rawText);

        return new SkinAnalysisResponseDTO(
            result.path("severity").asText("Unknown"),
            result.path("observation").asText("N/A"),
            result.path("recommendation").asText("Please consult a doctor."),
            result.path("suggestedSpecialization").asText("Dermatologist")
        );
    }
}