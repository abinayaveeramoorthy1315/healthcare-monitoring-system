package com.healthcare.healthcare_monitoring_system.controller;

import com.healthcare.healthcare_monitoring_system.dto.AiPredictionRequest;
import com.healthcare.healthcare_monitoring_system.dto.AiPredictionResponse;
import com.healthcare.healthcare_monitoring_system.entity.HealthPrediction;
import com.healthcare.healthcare_monitoring_system.service.HealthPredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*") // Allows requests from React frontend
public class AiPredictionController {

    @Autowired
    private HealthPredictionService healthPredictionService;

    @PostMapping("/predict")
    public ResponseEntity<HealthPrediction> predictRisk(@RequestBody AiPredictionRequest request) {
        HealthPrediction prediction = healthPredictionService.processAndSavePrediction(request);
        return ResponseEntity.ok(prediction);
    }

    @GetMapping("/history/{patientId}")
    public ResponseEntity<List<HealthPrediction>> getHistory(@PathVariable Long patientId) {
        List<HealthPrediction> history = healthPredictionService.getPatientHistory(patientId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/doctor/predictions")
    public ResponseEntity<List<AiPredictionResponse>> getDoctorPredictions(@RequestParam(required = false) Long doctorId) {
        List<HealthPrediction> highRisk = healthPredictionService.getHighCriticalPredictions(doctorId);
        List<AiPredictionResponse> responseList = highRisk.stream().map(p -> {
            AiPredictionResponse res = new AiPredictionResponse(p.getRiskLevel(), p.getConfidence(), p.getReason(), p.getRecommendation());
            res.setPredictionId(p.getPredictionId());
            res.setPatient(p.getPatient());
            return res;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/report/{predictionId}")
    public ResponseEntity<byte[]> getPredictionReport(@PathVariable Long predictionId) {
        try {
            byte[] pdfBytes = healthPredictionService.generatePredictionPdf(predictionId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", "health_risk_report_" + predictionId + ".pdf");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
