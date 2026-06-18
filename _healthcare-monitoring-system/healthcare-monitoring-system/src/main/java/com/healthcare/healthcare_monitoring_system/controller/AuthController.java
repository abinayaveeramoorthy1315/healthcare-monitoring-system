package com.healthcare.healthcare_monitoring_system.controller;

import com.healthcare.healthcare_monitoring_system.dto.RegisterRequest;
import com.healthcare.healthcare_monitoring_system.entity.Patient;
import com.healthcare.healthcare_monitoring_system.entity.User;
import com.healthcare.healthcare_monitoring_system.entity.Role;
import com.healthcare.healthcare_monitoring_system.repository.PatientRepository;
import com.healthcare.healthcare_monitoring_system.repository.UserRepository;
import com.healthcare.healthcare_monitoring_system.config.JwtUtil;
import com.healthcare.healthcare_monitoring_system.service.EmailService;
import com.healthcare.healthcare_monitoring_system.service.OtpStore;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin
public class AuthController {

    private final UserRepository repo;
    private final PatientRepository patientRepo;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final OtpStore otpStore;

    public AuthController(UserRepository repo, PatientRepository patientRepo,
                          JwtUtil jwtUtil, EmailService emailService, OtpStore otpStore) {
        this.repo = repo;
        this.patientRepo = patientRepo;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
        this.otpStore = otpStore;
    }

    // ✅ Step 1 — OTP அனுப்பு
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");

            if (email == null || email.isBlank()) {
                return ResponseEntity.status(400)
                    .body(Map.of("error", "Email is required"));
            }

            // Already registered email check
            if (patientRepo.existsByEmail(email)) {
                return ResponseEntity.status(400)
                    .body(Map.of("error", "Email already registered"));
            }

            String otp = emailService.generateOtp();
            otpStore.saveOtp(email, otp);
            emailService.sendOtp(email, otp);

            return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Step 2 — OTP verify பண்ணி register
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req,
                                       BindingResult bindingResult) {
        try {
            // Validation check
            if (bindingResult.hasErrors()) {
                String errorMsg = bindingResult.getFieldError().getDefaultMessage();
                return ResponseEntity.status(400)
                    .body(Map.of("error", errorMsg));
            }

            // OTP verify
            if (!otpStore.verifyOtp(req.getEmail(), req.getOtp())) {
                return ResponseEntity.status(400)
                    .body(Map.of("error", "Invalid or expired OTP"));
            }

            // Username duplicate check
            if (repo.findByUsername(req.getUsername()).isPresent()) {
                return ResponseEntity.status(400)
                    .body(Map.of("error", "Username already exists"));
            }

            // Email duplicate check
            if (patientRepo.existsByEmail(req.getEmail())) {
                return ResponseEntity.status(400)
                    .body(Map.of("error", "Email already registered"));
            }

            // User save
            User newUser = new User();
            newUser.setUsername(req.getUsername());
            newUser.setPassword(req.getPassword());
            newUser.setRole(Role.PATIENT);
            User savedUser = repo.save(newUser);

            // Patient save
            Patient patient = new Patient();
            patient.setName(req.getFullName());
            patient.setAge(req.getAge());
            patient.setGender(req.getGender());
            patient.setPhone(req.getPhone());
            patient.setEmail(req.getEmail());
            patient.setBloodGroup(req.getBloodGroup());
            patient.setUserId(savedUser.getId());
            Patient savedPatient = patientRepo.save(patient);

            // OTP clear பண்ணு
            otpStore.clearOtp(req.getEmail());

            return ResponseEntity.ok(Map.of(
                "message", "Registration successful",
                "patientId", savedPatient.getPatientId(),
                "fullName", savedPatient.getName()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Login — மாத்தவே இல்ல
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User req) {
        try {
            User user = repo.findByUsername(req.getUsername()).orElse(null);

            if (user == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("error", "User not found"));
            }
            if (!user.getPassword().equals(req.getPassword())) {
                return ResponseEntity.status(401)
                    .body(Map.of("error", "Invalid password"));
            }

            String token = jwtUtil.generateToken(user);

            return ResponseEntity.ok(Map.of(
                "token", token,
                "role", user.getRole(),
                "userId", user.getId()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", e.getMessage()));
        }
    }
}