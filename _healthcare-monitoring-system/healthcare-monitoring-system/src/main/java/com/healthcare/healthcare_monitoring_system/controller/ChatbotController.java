package com.healthcare.healthcare_monitoring_system.controller;

import com.healthcare.healthcare_monitoring_system.dto.ChatRequestDTO;
import com.healthcare.healthcare_monitoring_system.dto.ChatResponseDTO;
import com.healthcare.healthcare_monitoring_system.entity.ChatHistory;
import com.healthcare.healthcare_monitoring_system.service.ChatbotService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/query")
    public ChatResponseDTO chat(@RequestBody ChatRequestDTO request) {
        String reply = chatbotService.getChatResponse(request.getPatientId(), request.getMessage());
        return new ChatResponseDTO(reply);
    }

    @GetMapping("/history/{patientId}")
    public List<ChatHistory> getHistory(@PathVariable String patientId) {
        return chatbotService.getChatHistory(patientId);
    }
}
