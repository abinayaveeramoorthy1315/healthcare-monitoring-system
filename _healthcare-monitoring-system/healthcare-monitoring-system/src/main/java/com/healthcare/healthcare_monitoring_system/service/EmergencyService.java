package com.healthcare.healthcare_monitoring_system.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.healthcare.healthcare_monitoring_system.dto.ReviewSummaryDTO;
import com.healthcare.healthcare_monitoring_system.entity.*;
import com.healthcare.healthcare_monitoring_system.repository.*;

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
    private EmailTemplateService emailTemplateService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AmbulanceService ambulanceService;

    @Autowired
    private ReviewService reviewService;

    // Track processed emergency IDs to strictly prevent duplicate notifications
    private final Set<Long> processedEmergencyNotificationIds = Collections.synchronizedSet(new HashSet<>());

    @Transactional
    public EmergencyRequest raiseEmergency(Long patientId,
                                           Long doctorId,
                                           String emergencyMessage,
                                           Double latitude,
                                           Double longitude) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + patientId));

        // Smart Doctor Routing & Selection (most recently booked doctor -> specialization -> fallback)
        Doctor selectedDoctor = selectSmartDoctor(patient, emergencyMessage);

        if (selectedDoctor == null) {
            throw new RuntimeException("No doctors available across hospital network right now.");
        }

        EmergencyRequest request = new EmergencyRequest();
        request.setPatientId(patient.getPatientId());
        request.setPatientName(patient.getName());
        request.setAssignedDoctorId(selectedDoctor.getDoctorId());
        request.setDoctorName(selectedDoctor.getDoctorName());
        request.setEmergencyMessage(emergencyMessage != null ? emergencyMessage : "Emergency help needed");
        request.setLatitude(latitude);
        request.setLongitude(longitude);
        request.setLiveLatitude(latitude);
        request.setLiveLongitude(longitude);
        request.setEmergencySeverity(determineSeverity(emergencyMessage));
        request.setStatus("PENDING");
        request.setEmergencyStatus("PENDING");
        request.setCreatedAt(LocalDateTime.now());

        String locationLink = "https://www.google.com/maps?q=" + latitude + "," + longitude;
        request.setLocationLink(locationLink);

        EmergencyRequest saved = emergencyRepository.save(request);

        // Assign Ambulance Fleet
        try {
            ambulanceService.assignAmbulance(saved);
            saved.setAmbulanceStatus("DISPATCHED");
            saved.setAmbulanceDriver("EMRG Team Unit");
            saved.setEta("8 mins");
            emergencyRepository.save(saved);
        } catch (Exception e) {
            System.err.println("Notice: Ambulance assignment note: " + e.getMessage());
            saved.setAmbulanceStatus("DISPATCHED");
            saved.setAmbulanceDriver("On-Duty Fleet");
            saved.setEta("10 mins");
            emergencyRepository.save(saved);
        }

        // Targeted Notifications & Emails
        dispatchTargetedAlerts(saved, patient, selectedDoctor);

        return saved;
    }

    private String determineSeverity(String message) {
        if (message == null) return "HIGH";
        String lower = message.toLowerCase();
        if (lower.contains("heart") || lower.contains("cardiac") || lower.contains("breath") || lower.contains("critical") || lower.contains("stroke")) {
            return "CRITICAL";
        }
        return "HIGH";
    }

    private Optional<Appointment> getLatestActiveAppointment(Long patientId) {
        if (patientId == null) return Optional.empty();
        List<Appointment> allAppts = appointmentRepository.findByPatient_PatientId(patientId);
        return allAppts.stream()
                .filter(a -> a.getStatus() != null && !a.getStatus().equalsIgnoreCase("CANCELLED") && !a.getStatus().equalsIgnoreCase("REJECTED") && !a.getStatus().equalsIgnoreCase("CLOSED"))
                .sorted(Comparator.comparing((Appointment a) -> a.getAppointmentDate() != null ? a.getAppointmentDate() : "").reversed()
                        .thenComparing((Appointment a) -> a.getAppointmentId() != null ? a.getAppointmentId() : 0L).reversed())
                .findFirst();
    }

    public Doctor selectSmartDoctor(Patient patient, String emergencyMessage) {
        // Step 1: Identify the patient's most recently booked doctor (ignore cancelled appointments)
        Optional<Appointment> recentAppt = getLatestActiveAppointment(patient != null ? patient.getPatientId() : null);
        if (recentAppt.isPresent()) {
            Doctor apptDoc = recentAppt.get().getDoctor();
            if (apptDoc != null && isDoctorActive(apptDoc)) {
                System.out.println("✅ Primary Emergency Doctor: Assigned to patient's recently booked doctor: Dr. " + apptDoc.getDoctorName());
                return apptDoc;
            }
        }

        // Step 2: Determine required specialization using AI / emergency keywords
        String requiredSpecialization = determineSpecialization(emergencyMessage);
        System.out.println("🔍 Smart Doctor Selection: Target Specialization -> " + requiredSpecialization);

        List<Doctor> allDoctors = doctorRepository.findAll();
        List<Doctor> candidateSpecialists = allDoctors.stream()
                .filter(this::isDoctorActive)
                .filter(d -> d.getSpecialization() != null && d.getSpecialization().equalsIgnoreCase(requiredSpecialization))
                .collect(Collectors.toList());

        if (!candidateSpecialists.isEmpty()) {
            Doctor bestSpecialist = rankDoctors(candidateSpecialists);
            System.out.println("✅ Smart Routing: Selected best specialist: Dr. " + bestSpecialist.getDoctorName() + " (" + requiredSpecialization + ")");
            return bestSpecialist;
        }

        // Step 3: Fallback to General Physician or Emergency specialist
        List<Doctor> generalCandidates = allDoctors.stream()
                .filter(this::isDoctorActive)
                .filter(d -> d.getSpecialization() != null && (d.getSpecialization().equalsIgnoreCase("General Physician") || d.getSpecialization().equalsIgnoreCase("Emergency")))
                .collect(Collectors.toList());

        if (!generalCandidates.isEmpty()) {
            return rankDoctors(generalCandidates);
        }

        // Step 4: Fallback to highest-rated available doctor
        List<Doctor> anyAvailable = allDoctors.stream()
                .filter(this::isDoctorActive)
                .collect(Collectors.toList());

        if (!anyAvailable.isEmpty()) {
            return rankDoctors(anyAvailable);
        }

        // Last resort: any doctor
        return allDoctors.stream()
                .findFirst()
                .orElse(allDoctors.isEmpty() ? null : allDoctors.get(0));
    }

    private boolean isDoctorActive(Doctor doc) {
        if (doc == null) return false;
        String avail = doc.getAvailability();
        return avail == null || avail.trim().isEmpty() || avail.equalsIgnoreCase("ACTIVE") || avail.equalsIgnoreCase("Available") || avail.equalsIgnoreCase("YES");
    }

    private String determineSpecialization(String message) {
        if (message == null) return "General Physician";
        String lower = message.toLowerCase();
        if (lower.contains("cardiac") || lower.contains("heart") || lower.contains("chest") || lower.contains("pulse") || lower.contains("tachycardia")) {
            return "Cardiologist";
        }
        if (lower.contains("skin") || lower.contains("rash") || lower.contains("dermatology") || lower.contains("wound") || lower.contains("burn")) {
            return "Dermatologist";
        }
        if (lower.contains("neurological") || lower.contains("brain") || lower.contains("stroke") || lower.contains("seizure") || lower.contains("paralysis") || lower.contains("headache")) {
            return "Neurologist";
        }
        if (lower.contains("respiratory") || lower.contains("breath") || lower.contains("lung") || lower.contains("oxygen") || lower.contains("spo2") || lower.contains("asthma")) {
            return "Pulmonologist";
        }
        return "General Physician";
    }

    private Doctor rankDoctors(List<Doctor> doctors) {
        return doctors.stream().min((d1, d2) -> {
            // Compare Rating (descending)
            double r1 = reviewService.getSummary(d1.getDoctorId()).getAverageRating();
            double r2 = reviewService.getSummary(d2.getDoctorId()).getAverageRating();
            if (r1 != r2) {
                return Double.compare(r2, r1); // higher rating comes first
            }
            // Compare Workload (ascending)
            long w1 = getDoctorWorkload(d1);
            long w2 = getDoctorWorkload(d2);
            return Long.compare(w1, w2); // lower workload comes first
        }).orElse(doctors.get(0));
    }

    private long getDoctorWorkload(Doctor doctor) {
        long activeAppts = appointmentRepository.countByDoctor_DoctorIdAndStatus(doctor.getDoctorId(), "BOOKED");
        long activeEmergencies = emergencyRepository.findByAssignedDoctorId(doctor.getDoctorId()).stream()
                .filter(e -> "PENDING".equalsIgnoreCase(e.getEmergencyStatus()) || "ACCEPTED".equalsIgnoreCase(e.getEmergencyStatus()))
                .count();
        return activeAppts + (activeEmergencies * 3); // emergencies weighted heavier
    }

    private void dispatchTargetedAlerts(EmergencyRequest req, Patient patient, Doctor doctor) {
        if (req != null && Boolean.TRUE.equals(req.getNotificationsSent())) {
            System.out.println("Notice: Notifications already dispatched for emergency #" + req.getId() + ". Skipping duplicate cycle.");
            return;
        }
        if (req != null && req.getId() != null && !processedEmergencyNotificationIds.add(req.getId())) {
            System.out.println("Notice: In-memory notification lock prevented duplicate dispatch for emergency #" + req.getId());
            return;
        }

        // 1. Notify Assigned Doctor only (most recently booked doctor / assigned doctor)
        if (doctor != null && doctor.getUserId() != null) {
            userRepository.findById(doctor.getUserId()).ifPresent(user -> {
                String doctorNotifMsg = "🚨 EMERGENCY ALERT\n"
                        + "Patient: " + (patient != null ? patient.getName() : "Unknown Patient") + "\n"
                        + "Emergency has been triggered.\n"
                        + "Current Location: " + (req != null ? req.getLatitude() : 18.5204) + ", " + (req != null ? req.getLongitude() : 73.8567) + "\n"
                        + "View Location\n"
                        + "Open Patient History";
                notificationService.createNotification(user.getUsername(), doctorNotifMsg);
            });
        }
        if (doctor != null && doctor.getEmail() != null) {
            String lastApptDate = getLatestActiveAppointment(patient != null ? patient.getPatientId() : null)
                    .map(Appointment::getAppointmentDate)
                    .orElse("N/A");
            String timeStr = (req != null && req.getCreatedAt() != null) ? req.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            emailTemplateService.sendDoctorEmergencyImmediateAttentionMail(
                    doctor.getEmail(),
                    doctor.getDoctorName(),
                    patient != null ? patient.getName() : "Unknown Patient",
                    patient != null ? patient.getPhone() : "N/A",
                    patient != null ? patient.getBloodGroup() : "N/A",
                    lastApptDate,
                    (req != null && req.getLatitude() != null) ? req.getLatitude() : 18.5204,
                    (req != null && req.getLongitude() != null) ? req.getLongitude() : 73.8567,
                    timeStr,
                    "http://localhost:5173/dashboard"
            );
        }

        // 2. Notify Hospital Admin (`Role.ADMIN` users) - Send ONE email to Admin
        notifyHospitalAdmins(req, patient, doctor);

        // 3. Notify Patient via Emergency SOS & Ambulance Dispatched templates (#8 & #9)
        try {
            if (patient != null && patient.getEmail() != null && !patient.getEmail().trim().isEmpty()) {
                String timeStr = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                emailTemplateService.sendEmergencySosMail(
                        patient.getEmail(),
                        patient.getName(),
                        (req != null && req.getLatitude() != null) ? req.getLatitude() : 18.5204,
                        (req != null && req.getLongitude() != null) ? req.getLongitude() : 73.8567,
                        req != null ? req.getLocationLink() : "https://maps.google.com",
                        doctor != null ? doctor.getDoctorName() : "On-Duty Emergency Team",
                        timeStr,
                        req != null ? req.getAmbulanceStatus() : "DISPATCHED"
                );
                emailTemplateService.sendAmbulanceDispatchedMail(
                        patient.getEmail(),
                        patient.getName(),
                        "MH-12-EM-108",
                        (req != null && req.getAmbulanceDriver() != null) ? req.getAmbulanceDriver() : "EMRG Unit Driver",
                        (req != null && req.getEta() != null) ? req.getEta() : "8 mins",
                        "3.2 km",
                        "http://localhost:5173/dashboard"
                );
            }
        } catch (Exception ex) {
            System.err.println("Notice: Patient SOS email note: " + ex.getMessage());
        }

        if (req != null) {
            req.setNotificationsSent(true);
            emergencyRepository.save(req);
        }
    }

    private String getUserEmail(User u) {
        if (u == null) return null;
        if (u.getUsername() != null && u.getUsername().contains("@")) return u.getUsername();
        Doctor doc = doctorRepository.findByUserId(u.getId()).orElse(null);
        if (doc != null && doc.getEmail() != null) return doc.getEmail();
        Patient pat = patientRepository.findByUserId(u.getId()).orElse(null);
        if (pat != null && pat.getEmail() != null) return pat.getEmail();
        return null;
    }

    private void notifyHospitalAdmins(EmergencyRequest req, Patient patient, Doctor doctor) {
        List<User> admins = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && (u.getRole() == Role.ADMIN || u.getRole().name().equalsIgnoreCase("ADMIN") || "admin".equalsIgnoreCase(u.getUsername())))
                .collect(Collectors.toList());

        String timeStr = (req != null && req.getCreatedAt() != null) ? req.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String patientDetails = (patient != null ? patient.getName() : "Unknown") + " (Phone: " + (patient != null && patient.getPhone() != null ? patient.getPhone() : "N/A") + ", Blood Group: " + (patient != null && patient.getBloodGroup() != null ? patient.getBloodGroup() : "Unknown") + ")";
        Set<String> notifiedEmails = new HashSet<>();

        for (User admin : admins) {
            String adminNotifMsg = "🚨 Critical Emergency\n"
                    + "Patient: " + (patient != null ? patient.getName() : "Unknown") + "\n"
                    + "Assigned Doctor: Dr. " + (doctor != null ? doctor.getDoctorName() : "N/A") + "\n"
                    + "Time: " + timeStr + "\n"
                    + "GPS Location: " + (req != null ? req.getLatitude() : 18.5204) + ", " + (req != null ? req.getLongitude() : 73.8567) + "\n"
                    + "Ambulance Dispatch Required";
            notificationService.createNotification(admin.getUsername(), adminNotifMsg);

            String adminEmail = getUserEmail(admin);
            if (adminEmail != null && !adminEmail.trim().isEmpty() && notifiedEmails.add(adminEmail.toLowerCase())) {
                emailTemplateService.sendAdminEmergencyDispatchMail(
                        adminEmail,
                        admin.getUsername(),
                        patientDetails,
                        doctor != null ? doctor.getDoctorName() : "N/A",
                        timeStr,
                        (req != null && req.getLatitude() != null) ? req.getLatitude() : 18.5204,
                        (req != null && req.getLongitude() != null) ? req.getLongitude() : 73.8567,
                        "http://localhost:5173/dashboard"
                );
            }
        }
    }

    // Action Endpoints
    @Transactional
    public EmergencyRequest acceptEmergency(Long id, String username) {
        EmergencyRequest req = emergencyRepository.findById(id).orElseThrow(() -> new RuntimeException("Emergency not found"));
        req.setEmergencyStatus("ACCEPTED");
        req.setStatus("ACCEPTED");
        req.setAcceptedAt(LocalDateTime.now());
        req.setAcknowledgedAt(LocalDateTime.now());
        EmergencyRequest saved = emergencyRepository.save(req);

        // Notify Patient & Admin
        if (req.getPatientId() != null) {
            patientRepository.findById(req.getPatientId()).ifPresent(p -> {
                String contactOrUsername = p.getEmail() != null ? p.getEmail() : p.getPhone();
                if (contactOrUsername != null) {
                    userRepository.findByUsername(contactOrUsername).ifPresent(u -> {
                        notificationService.createNotification(u.getUsername(), "✅ Your emergency SOS #" + id + " has been ACCEPTED by Dr. " + req.getDoctorName() + ". Help is on the way!");
                    });
                }
            });
        }
        return saved;
    }

    @Transactional
    public EmergencyRequest rejectEmergency(Long id, String username) {
        EmergencyRequest req = emergencyRepository.findById(id).orElseThrow(() -> new RuntimeException("Emergency not found"));
        req.setEmergencyStatus("REJECTED");
        req.setStatus("REJECTED");
        return emergencyRepository.save(req);
    }

    @Transactional
    public EmergencyRequest markArrived(Long id) {
        EmergencyRequest req = emergencyRepository.findById(id).orElseThrow(() -> new RuntimeException("Emergency not found"));
        req.setEmergencyStatus("ARRIVED");
        req.setStatus("ARRIVED");
        req.setAmbulanceStatus("ARRIVED");
        return emergencyRepository.save(req);
    }

    public List<EmergencyRequest> getAllRequests() {
        return emergencyRepository.findAll();
    }

    public List<EmergencyRequest> getDoctorRequests(String doctorName) {
        // Return matching by doctorName OR by assignedDoctorId
        Doctor doc = doctorRepository.findByDoctorName(doctorName).orElse(null);
        if (doc != null) {
            List<EmergencyRequest> byId = emergencyRepository.findByAssignedDoctorId(doc.getDoctorId());
            if (!byId.isEmpty()) return byId;
        }
        return emergencyRepository.findByDoctorName(doctorName);
    }

    public List<EmergencyRequest> getAssignedRequestsForDoctorUsername(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return new ArrayList<>();
        String userEmail = getUserEmail(user);
        Doctor doc = doctorRepository.findAll().stream()
                .filter(d -> d.getUserId() != null && d.getUserId().equals(user.getId()))
                .findFirst()
                .orElseGet(() -> userEmail != null ? doctorRepository.findByEmail(userEmail).orElse(null) : null);

        if (doc != null) {
            List<EmergencyRequest> list = emergencyRepository.findByAssignedDoctorId(doc.getDoctorId());
            if (list.isEmpty()) {
                list = emergencyRepository.findByDoctorName(doc.getDoctorName());
            }
            return list;
        }
        return new ArrayList<>();
    }

    public List<EmergencyRequest> getPatientRequests(String patientUsernameOrName) {
        User user = userRepository.findByUsername(patientUsernameOrName).orElse(null);
        if (user != null) {
            String userEmail = getUserEmail(user);
            Patient patient = patientRepository.findByUserId(user.getId())
                    .orElseGet(() -> userEmail != null ? patientRepository.findByEmail(userEmail).orElse(null) : null);
            if (patient == null) {
                patient = patientRepository.findByPhone(user.getUsername()).orElse(null);
            }
            if (patient != null) {
                List<EmergencyRequest> byId = emergencyRepository.findByPatientId(patient.getPatientId());
                if (!byId.isEmpty()) return byId;
            }
        }
        return emergencyRepository.findByPatientName(patientUsernameOrName);
    }

    public EmergencyRequest updateStatus(Long id, String status) {
        EmergencyRequest request = emergencyRepository.findById(id).orElseThrow();
        request.setStatus(status);
        request.setEmergencyStatus(status);
        return emergencyRepository.save(request);
    }

    @Transactional
    public void deleteRequest(Long id) {
        if (emergencyRepository.existsById(id)) {
            ambulanceService.cleanupForEmergency(id);
            emergencyRepository.deleteById(id);
        }
    }

    @Transactional
    public void clearDoctorRequests(String doctorName) {
        List<EmergencyRequest> requests = getDoctorRequests(doctorName);
        for (EmergencyRequest req : requests) {
            deleteRequest(req.getId());
        }
    }

    @Transactional
    public void clearAllRequests() {
        List<EmergencyRequest> requests = emergencyRepository.findAll();
        for (EmergencyRequest req : requests) {
            deleteRequest(req.getId());
        }
    }
}