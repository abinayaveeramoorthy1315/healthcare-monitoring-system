package com.healthcare.healthcare_monitoring_system.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.healthcare_monitoring_system.entity.ChatHistory;
import com.healthcare.healthcare_monitoring_system.repository.ChatHistoryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ChatbotService {

	@Value("${gemini.api.key}")
	private String apiKey;

	@Value("${gemini.api.url}")
	private String apiUrl;

	private final ChatHistoryRepository chatHistoryRepository;
	private final WebClient webClient;

	public ChatbotService(ChatHistoryRepository chatHistoryRepository) {
		this.chatHistoryRepository = chatHistoryRepository;
		this.webClient = WebClient.builder().build();
	}

	public String getChatResponse(String patientId, String userMessage) {

		String systemPrompt = "You are a helpful, non-diagnostic AI Health Assistant for a hospital app. "
		        + "Give general health guidance, diet/nutrition suggestions, and appointment-related help. "
		        + "Never diagnose diseases. Always recommend consulting a doctor for serious symptoms. "
		        + "Keep responses short, clear, and friendly. "
		        + "IMPORTANT LANGUAGE RULE: Detect the language the patient is writing in (Tamil, English, or Tanglish/mixed). "
		        + "Always reply in the SAME language and style the patient used. "
		        + "If patient writes in Tamil script, reply in Tamil script. "
		        + "If patient writes in Tanglish (Tamil words in English letters), reply in Tanglish. "
		        + "If patient writes in English, reply in English.";


	    Map<String, Object> requestBody = Map.of(
	            "contents", List.of(
	                    Map.of("parts", List.of(
	                            Map.of("text", systemPrompt + "\n\nPatient: " + userMessage)
	                    ))
	            )
	    );

		try {
			String response = webClient.post().uri(apiUrl + "?key=" + apiKey).header("Content-Type", "application/json")
					.bodyValue(requestBody).retrieve().bodyToMono(String.class).block();

			String reply = extractReply(response);

			// Save chat history
			ChatHistory history = new ChatHistory();
			history.setPatientId(patientId);
			history.setUserMessage(userMessage);
			history.setBotReply(reply);
			chatHistoryRepository.save(history);

			return reply;

		} catch (Exception e) {
			e.printStackTrace();
			return "Sorry, I'm unable to respond right now. Please try again later.";
		}
	}

	private String extractReply(String response) throws Exception {
		ObjectMapper mapper = new ObjectMapper();
		JsonNode root = mapper.readTree(response);
		return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
	}

	public List<ChatHistory> getChatHistory(String patientId) {
		return chatHistoryRepository.findByPatientIdOrderByCreatedAtAsc(patientId);
	}
}