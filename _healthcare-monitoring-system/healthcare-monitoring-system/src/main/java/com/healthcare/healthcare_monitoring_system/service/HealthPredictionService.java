package com.healthcare.healthcare_monitoring_system.service;

import com.healthcare.healthcare_monitoring_system.dto.AiPredictionRequest;
import com.healthcare.healthcare_monitoring_system.dto.AiPredictionResponse;
import com.healthcare.healthcare_monitoring_system.entity.HealthPrediction;
import com.healthcare.healthcare_monitoring_system.entity.Patient;
import com.healthcare.healthcare_monitoring_system.repository.HealthPredictionRepository;
import com.healthcare.healthcare_monitoring_system.repository.PatientRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class HealthPredictionService {

    @Autowired
    private AiModelService aiModelService;

    @Autowired
    private HealthPredictionRepository healthPredictionRepository;

    @Autowired
    private PatientRepository patientRepository;

    public HealthPrediction processAndSavePrediction(AiPredictionRequest request) {
        AiPredictionResponse response = aiModelService.predict(request);

        HealthPrediction prediction = new HealthPrediction();
        prediction.setHeartRate(request.getHeartRate());
        prediction.setBloodPressure(request.getBloodPressure());
        prediction.setSpo2(request.getSpo2());
        prediction.setTemperature(request.getTemperature());
        prediction.setAge(request.getAge());
        
        prediction.setRiskLevel(response.getRisk());
        prediction.setConfidence(response.getConfidence());
        prediction.setReason(response.getReason());
        prediction.setRecommendation(response.getRecommendation());

        if (request.getPatientId() != null) {
            Optional<Patient> patientOpt = patientRepository.findById(request.getPatientId());
            patientOpt.ifPresent(prediction::setPatient);
        }

        return healthPredictionRepository.save(prediction);
    }

    public List<HealthPrediction> getPatientHistory(Long patientId) {
        return healthPredictionRepository.findByPatient_PatientIdOrderByCreatedAtDesc(patientId);
    }

    @Autowired
    private com.healthcare.healthcare_monitoring_system.repository.AppointmentRepository appointmentRepository;

    public List<HealthPrediction> getHighCriticalPredictions(Long doctorId) {
        List<HealthPrediction> allCritical = healthPredictionRepository.findByRiskLevelInOrderByCreatedAtDesc(Arrays.asList("HIGH", "CRITICAL"));
        
        if (doctorId == null) {
            return allCritical;
        }

        // Fetch appointments for this doctor to find their assigned patients
        List<com.healthcare.healthcare_monitoring_system.entity.Appointment> docAppts = appointmentRepository.findByDoctor_DoctorId(doctorId);
        java.util.Set<Long> patientIds = docAppts.stream()
            .filter(a -> a.getPatient() != null)
            .map(a -> a.getPatient().getPatientId())
            .collect(java.util.stream.Collectors.toSet());

        return allCritical.stream()
                .filter(p -> p.getPatient() != null && patientIds.contains(p.getPatient().getPatientId()))
                .collect(java.util.stream.Collectors.toList());
    }

    public byte[] generatePredictionPdf(Long predictionId) throws Exception {
        HealthPrediction prediction = healthPredictionRepository.findById(predictionId)
                .orElseThrow(() -> new RuntimeException("Prediction not found"));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, out);

        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
        Paragraph title = new Paragraph("AI Health Risk Prediction Report", titleFont);
        title.setAlignment(Paragraph.ALIGN_CENTER);
        document.add(title);
        
        document.add(new Paragraph("\n"));

        if (prediction.getPatient() != null) {
            document.add(new Paragraph("Patient Name: " + prediction.getPatient().getName()));
            document.add(new Paragraph("Patient Age: " + prediction.getPatient().getAge()));
            document.add(new Paragraph("Patient ID: " + prediction.getPatient().getPatientId()));
        } else {
            document.add(new Paragraph("Patient Age: " + prediction.getAge()));
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        document.add(new Paragraph("Date: " + prediction.getCreatedAt().format(formatter)));
        document.add(new Paragraph("\n"));

        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
        document.add(new Paragraph("Vital Signs Provided:", sectionFont));
        document.add(new Paragraph("Heart Rate: " + prediction.getHeartRate() + " bpm"));
        document.add(new Paragraph("Blood Pressure: " + prediction.getBloodPressure() + " mmHg"));
        document.add(new Paragraph("Oxygen Saturation (SpO2): " + prediction.getSpo2() + "%"));
        document.add(new Paragraph("Body Temperature: " + prediction.getTemperature() + " °C"));
        document.add(new Paragraph("\n"));

        document.add(new Paragraph("AI Prediction Results:", sectionFont));
        document.add(new Paragraph("Risk Level: " + prediction.getRiskLevel()));
        document.add(new Paragraph("Confidence: " + prediction.getConfidence() + "%"));
        document.add(new Paragraph("Reason: " + prediction.getReason()));
        document.add(new Paragraph("Recommendation: " + prediction.getRecommendation()));

        document.close();

        return out.toByteArray();
    }
}
