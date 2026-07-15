package com.healthcare.healthcare_monitoring_system.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.healthcare.healthcare_monitoring_system.entity.Doctor;
import com.healthcare.healthcare_monitoring_system.entity.EmergencyRequest;
import com.healthcare.healthcare_monitoring_system.entity.Patient;
import com.healthcare.healthcare_monitoring_system.repository.DoctorRepository;
import com.healthcare.healthcare_monitoring_system.repository.EmergencyRepository;
import com.healthcare.healthcare_monitoring_system.repository.PatientRepository;
import com.healthcare.healthcare_monitoring_system.repository.UserRepository;
import com.healthcare.healthcare_monitoring_system.entity.Appointment;
import com.healthcare.healthcare_monitoring_system.repository.AppointmentRepository;


@Service
public class EmergencyService {

    @Autowired
    private EmergencyRepository emergencyRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private MailService mailService;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AppointmentRepository appointmentRepository;

    public EmergencyRequest raiseEmergency(Long patientId,
            Long doctorId,
            String emergencyMessage,
            Double latitude,
            Double longitude) {
    	Patient patient = patientRepository.findById(patientId).orElseThrow();

    	Appointment appointment = appointmentRepository
    	        .findTopByPatient_PatientIdOrderByAppointmentDateDesc(patientId)
    	        .orElseThrow(() -> new RuntimeException("No appointment found"));

    	Doctor doctor = appointment.getDoctor();
    	
    	System.out.println("Patient ID : " + patientId);

    	System.out.println("Appointment Doctor : " + doctor.getDoctorName());
    	System.out.println("Appointment Doctor Email : " + doctor.getEmail());

    	System.out.println("Appointment Date : " + appointment.getAppointmentDate());
    	System.out.println("Appointment Status : " + appointment.getStatus());
        EmergencyRequest request = new EmergencyRequest();

        request.setPatientName(patient.getName());
        request.setDoctorName(doctor.getDoctorName());
        request.setEmergencyMessage(emergencyMessage);
        request.setLatitude(latitude);
        request.setLongitude(longitude);

        String locationLink =
                "https://www.google.com/maps?q=" + latitude + "," + longitude;

        request.setLocationLink(locationLink);
        System.out.println("Latitude received : " + latitude);
        System.out.println("Longitude received : " + longitude);
        System.out.println("Location Link : " + locationLink);

        EmergencyRequest saved = emergencyRepository.save(request);

        // Doctor notification
        if (doctor.getUserId() != null) {
            userRepository.findById(doctor.getUserId()).ifPresent(user -> {
            	System.out.println("Doctor Username : " + user.getUsername());
            	System.out.println("Notification Creating...");
                notificationService.createNotification(
                        user.getUsername(),
                        "🚨 Emergency from " + patient.getName()
                );
            });
        }
        System.out.println("Doctor Name : " + doctor.getDoctorName());
        System.out.println("Doctor Email : " + doctor.getEmail());

        // Email
        mailService.sendEmergencyMail(
        		
                doctor.getEmail(),
                patient.getName(),
                doctor.getDoctorName(),
                emergencyMessage,
                locationLink
        );

        return saved;
    }

    public List<EmergencyRequest> getAllRequests() {
        return emergencyRepository.findAll();
    }

    public List<EmergencyRequest> getDoctorRequests(String doctorName) {
        return emergencyRepository.findByDoctorName(doctorName);
    }

    public List<EmergencyRequest> getPatientRequests(String patientName) {
        return emergencyRepository.findByPatientName(patientName);
    }

    public EmergencyRequest updateStatus(Long id, String status) {

        EmergencyRequest request =
                emergencyRepository.findById(id).orElseThrow();

        request.setStatus(status);
        

        return emergencyRepository.save(request);
    }
}