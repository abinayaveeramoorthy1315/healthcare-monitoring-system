package com.healthcare.healthcare_monitoring_system.controller;

import com.healthcare.healthcare_monitoring_system.dto.SymptomRequestDTO;
import com.healthcare.healthcare_monitoring_system.dto.SymptomResponseDTO;
import com.healthcare.healthcare_monitoring_system.service.SymptomCheckerService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/symptom-checker")
@CrossOrigin(origins = "*")
public class SymptomCheckerController {

    private final SymptomCheckerService symptomCheckerService;

    public SymptomCheckerController(SymptomCheckerService symptomCheckerService) {
        this.symptomCheckerService = symptomCheckerService;
    }

    @PostMapping("/analyze")
    public SymptomResponseDTO analyze(@RequestBody SymptomRequestDTO request) {
        return symptomCheckerService.analyzeSymptoms(request.getSymptoms());
    }
}
