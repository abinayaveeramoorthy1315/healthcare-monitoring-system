package com.healthcare.healthcare_monitoring_system.controller;

import com.healthcare.healthcare_monitoring_system.dto.SkinAnalysisResponseDTO;
import com.healthcare.healthcare_monitoring_system.service.SkinAnalysisService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/skin-analysis")
@CrossOrigin(origins = "http://localhost:5173")
public class SkinAnalysisController {

    private final SkinAnalysisService skinAnalysisService;

    public SkinAnalysisController(SkinAnalysisService skinAnalysisService) {
        this.skinAnalysisService = skinAnalysisService;
    }

    @PostMapping(value = "/analyze", consumes = "multipart/form-data")
    public SkinAnalysisResponseDTO analyze(@RequestParam("image") MultipartFile image) {
        return skinAnalysisService.analyzeImage(image);
    }
}