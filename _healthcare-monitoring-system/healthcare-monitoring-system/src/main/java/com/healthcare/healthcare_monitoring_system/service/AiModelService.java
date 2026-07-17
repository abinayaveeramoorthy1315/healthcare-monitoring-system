package com.healthcare.healthcare_monitoring_system.service;

import com.healthcare.healthcare_monitoring_system.dto.AiPredictionRequest;
import com.healthcare.healthcare_monitoring_system.dto.AiPredictionResponse;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import weka.classifiers.trees.RandomForest;
import weka.core.Attribute;
import weka.core.DenseInstance;
import weka.core.Instances;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Service
public class AiModelService {

    private RandomForest randomForest;
    private Instances datasetStructure;
    private final List<String> classes = Arrays.asList("LOW", "MEDIUM", "HIGH", "CRITICAL");

    @PostConstruct
    public void init() {
        try {
            System.out.println("Initializing AI Health Risk Prediction Model...");
            createDatasetStructure();
            Instances trainingData = generateSyntheticData(2000);
            
            randomForest = new RandomForest();
            randomForest.buildClassifier(trainingData);
            System.out.println("AI Model training completed.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void createDatasetStructure() {
        ArrayList<Attribute> attributes = new ArrayList<>();
        attributes.add(new Attribute("heartRate"));
        attributes.add(new Attribute("systolicBP"));
        attributes.add(new Attribute("diastolicBP"));
        attributes.add(new Attribute("spo2"));
        attributes.add(new Attribute("temperature"));
        attributes.add(new Attribute("age"));
        
        attributes.add(new Attribute("risk", classes));

        datasetStructure = new Instances("HealthData", attributes, 0);
        datasetStructure.setClassIndex(datasetStructure.numAttributes() - 1);
    }

    private Instances generateSyntheticData(int size) {
        Instances data = new Instances(datasetStructure, size);
        Random rand = new Random(42);

        for (int i = 0; i < size; i++) {
            double[] values = new double[data.numAttributes()];
            
            // Randomly pick a class to generate realistic data around
            int classIndex = rand.nextInt(4);
            
            int hr = 75;
            int sysBP = 120;
            int diaBP = 80;
            int spo2 = 98;
            double temp = 37.0;
            int age = 20 + rand.nextInt(60);

            if (classIndex == 0) { // LOW
                hr = 60 + rand.nextInt(40); // 60-100
                sysBP = 100 + rand.nextInt(30); // 100-130
                diaBP = 70 + rand.nextInt(15); // 70-85
                spo2 = 95 + rand.nextInt(6); // 95-100
                temp = 36.5 + (rand.nextDouble() * 0.8); // 36.5-37.3
            } else if (classIndex == 1) { // MEDIUM
                hr = 100 + rand.nextInt(10); // 100-110 or 50-60
                if (rand.nextBoolean()) hr = 50 + rand.nextInt(10);
                sysBP = 130 + rand.nextInt(10); // 130-140
                diaBP = 85 + rand.nextInt(5); // 85-90
                spo2 = 92 + rand.nextInt(3); // 92-94
                temp = 37.4 + (rand.nextDouble() * 0.6); // 37.4-38.0
            } else if (classIndex == 2) { // HIGH
                hr = 110 + rand.nextInt(20); // 110-130
                sysBP = 140 + rand.nextInt(20); // 140-160
                diaBP = 90 + rand.nextInt(10); // 90-100
                spo2 = 88 + rand.nextInt(4); // 88-91
                temp = 38.0 + (rand.nextDouble() * 1.5); // 38.0-39.5
            } else if (classIndex == 3) { // CRITICAL
                hr = 130 + rand.nextInt(40); // 130+ or < 40
                if (rand.nextBoolean()) hr = 30 + rand.nextInt(20);
                sysBP = 160 + rand.nextInt(40); // 160+ or < 90
                if (rand.nextBoolean()) sysBP = 70 + rand.nextInt(20);
                diaBP = 100 + rand.nextInt(20);
                if (sysBP < 90) diaBP = 40 + rand.nextInt(20);
                spo2 = 70 + rand.nextInt(18); // < 88
                temp = 39.5 + (rand.nextDouble() * 1.5); // > 39.5 or < 35
                if (rand.nextBoolean()) temp = 33.0 + (rand.nextDouble() * 2.0);
            }

            // Introduce some noise
            if (rand.nextDouble() < 0.1) {
                hr += (rand.nextInt(20) - 10);
            }

            values[0] = hr;
            values[1] = sysBP;
            values[2] = diaBP;
            values[3] = spo2;
            values[4] = temp;
            values[5] = age;
            values[6] = classIndex;

            DenseInstance instance = new DenseInstance(1.0, values);
            instance.setDataset(data);
            data.add(instance);
        }
        return data;
    }

    public AiPredictionResponse predict(AiPredictionRequest request) {
        try {
            int sysBP = 120, diaBP = 80;
            if (request.getBloodPressure() != null && request.getBloodPressure().contains("/")) {
                String[] bpParts = request.getBloodPressure().split("/");
                sysBP = Integer.parseInt(bpParts[0].trim());
                diaBP = Integer.parseInt(bpParts[1].trim());
            }

            double[] values = new double[datasetStructure.numAttributes()];
            values[0] = request.getHeartRate();
            values[1] = sysBP;
            values[2] = diaBP;
            values[3] = request.getSpo2();
            values[4] = request.getTemperature();
            values[5] = request.getAge();
            // Class is unknown (missing)
            
            DenseInstance instance = new DenseInstance(1.0, values);
            instance.setDataset(datasetStructure);

            double[] distribution = randomForest.distributionForInstance(instance);
            
            int maxIndex = 0;
            for (int i = 1; i < distribution.length; i++) {
                if (distribution[i] > distribution[maxIndex]) {
                    maxIndex = i;
                }
            }

            String riskLevel = classes.get(maxIndex);
            Double confidence = Math.round(distribution[maxIndex] * 100.0 * 100.0) / 100.0; // percentage

            String reason = generateReason(request.getHeartRate(), sysBP, diaBP, request.getSpo2(), request.getTemperature());
            String recommendation = generateRecommendation(riskLevel);

            if (riskLevel.equals("LOW") && reason.trim().isEmpty()) {
                reason = "All vital signs are within normal healthy ranges.";
            }

            return new AiPredictionResponse(riskLevel, confidence, reason, recommendation);

        } catch (Exception e) {
            e.printStackTrace();
            return new AiPredictionResponse("UNKNOWN", 0.0, "Error generating prediction", "Consult doctor");
        }
    }

    private String generateReason(int hr, int sysBP, int diaBP, int spo2, double temp) {
        List<String> reasons = new ArrayList<>();
        if (hr < 50) reasons.add("Low heart rate");
        else if (hr > 100) reasons.add("High heart rate");

        if (sysBP < 90 || diaBP < 60) reasons.add("Low blood pressure");
        else if (sysBP > 140 || diaBP > 90) reasons.add("High blood pressure");

        if (spo2 < 95) reasons.add("Low oxygen level");
        
        if (temp < 36.0) reasons.add("Low body temperature");
        else if (temp > 37.5) reasons.add("High body temperature");

        if (reasons.isEmpty()) return "";
        return String.join(", ", reasons);
    }

    private String generateRecommendation(String riskLevel) {
        switch (riskLevel) {
            case "LOW":
                return "Maintain a healthy lifestyle. No immediate action needed.";
            case "MEDIUM":
                return "Monitor your vital signs and consult a doctor if symptoms persist or worsen.";
            case "HIGH":
                return "Consult a doctor as soon as possible. Continuous monitoring is recommended.";
            case "CRITICAL":
                return "Seek immediate emergency medical attention. Call for help.";
            default:
                return "Consult a medical professional.";
        }
    }
}
