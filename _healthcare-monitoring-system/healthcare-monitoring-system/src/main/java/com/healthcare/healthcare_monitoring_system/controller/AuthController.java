package com.healthcare.healthcare_monitoring_system.controller;

import com.healthcare.healthcare_monitoring_system.dto.RegisterRequest;
import com.healthcare.healthcare_monitoring_system.entity.Doctor;
import com.healthcare.healthcare_monitoring_system.entity.Patient;
import com.healthcare.healthcare_monitoring_system.entity.User;
import com.healthcare.healthcare_monitoring_system.entity.Role;
import com.healthcare.healthcare_monitoring_system.repository.DoctorRepository;
import com.healthcare.healthcare_monitoring_system.repository.PatientRepository;
import com.healthcare.healthcare_monitoring_system.repository.UserRepository;
import com.healthcare.healthcare_monitoring_system.config.JwtUtil;
import com.healthcare.healthcare_monitoring_system.service.EmailService;
import com.healthcare.healthcare_monitoring_system.service.EmailTemplateService;
import com.healthcare.healthcare_monitoring_system.service.OtpStore;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin
public class AuthController {

    private final UserRepository repo;
    private final PatientRepository patientRepo;
    private final DoctorRepository doctorRepository;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;
    private final OtpStore otpStore;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository repo, PatientRepository patientRepo,
                          DoctorRepository doctorRepository, JwtUtil jwtUtil,
                          EmailService emailService, EmailTemplateService emailTemplateService,
                          OtpStore otpStore, PasswordEncoder passwordEncoder) {
        this.repo = repo;
        this.patientRepo = patientRepo;
        this.doctorRepository = doctorRepository;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
        this.emailTemplateService = emailTemplateService;
        this.otpStore = otpStore;
        this.passwordEncoder = passwordEncoder;
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

            // User save with BCrypt
            User newUser = new User();
            newUser.setUsername(req.getUsername());
            newUser.setPassword(passwordEncoder.encode(req.getPassword()));
            newUser.setRole(Role.PATIENT);
            newUser.setPasswordChanged(true);
            newUser.setEmail(req.getEmail());
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

            // ✅ Step 3 — Send Registration Successful Email (#1)
            try {
                emailTemplateService.sendRegistrationSuccessMail(
                    savedPatient.getEmail(),
                    savedPatient.getName(),
                    savedPatient.getEmail(),
                    java.time.LocalDate.now().toString()
                );
            } catch (Exception ex) {
                System.err.println("Notice: Welcome email error: " + ex.getMessage());
            }

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

    // ✅ Login with Backwards-Compatible BCrypt Verification
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User req) {
        try {
            User user = repo.findByUsername(req.getUsername()).orElse(null);

            if (user == null) {
                return ResponseEntity.status(401)
                    .body(Map.of("error", "User not found"));
            }

            boolean matches = false;
            if (user.getPassword() != null && (user.getPassword().startsWith("$2a$") || user.getPassword().startsWith("$2b$") || user.getPassword().startsWith("$2y$"))) {
                matches = passwordEncoder.matches(req.getPassword(), user.getPassword());
            } else {
                matches = user.getPassword() != null && user.getPassword().equals(req.getPassword());
            }

            if (!matches) {
                return ResponseEntity.status(401)
                    .body(Map.of("error", "Invalid password"));
            }

            user.setLastLoginTime(LocalDateTime.now());
            repo.save(user);

            String token = jwtUtil.generateToken(user);
            boolean isPasswordChanged = user.getPasswordChanged() != null ? user.getPasswordChanged() : true;
            String userEmail = getRecipientEmail(user, "");

            return ResponseEntity.ok(Map.of(
                "token", token,
                "role", user.getRole(),
                "userId", user.getId(),
                "passwordChanged", isPasswordChanged,
                "username", user.getUsername(),
                "email", userEmail
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Password Reset OTP Request (Works across ADMIN, DOCTOR, PATIENT)
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null || email.isBlank()) {
                return ResponseEntity.status(400).body(Map.of("error", "Valid email address is required"));
            }

            User foundUser = findUserByEmailOrUsername(email);
            if (foundUser == null) {
                return ResponseEntity.status(404).body(Map.of("error", "No account registered with this email address"));
            }

            String recipientName = getRecipientName(foundUser, email);
            String targetEmail = getRecipientEmail(foundUser, email);

            String otp = String.format("%06d", new SecureRandom().nextInt(1000000));
            foundUser.setResetOtp(otp);
            foundUser.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
            repo.save(foundUser);

            emailTemplateService.sendForgotPasswordOtpMail(targetEmail, recipientName, otp);

            return ResponseEntity.ok(Map.of("message", "Password recovery OTP sent to your registered email address"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Verify OTP endpoint
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String otp = body.get("otp");
            if (email == null || otp == null || email.isBlank() || otp.isBlank()) {
                return ResponseEntity.status(400).body(Map.of("error", "Email and OTP are required"));
            }
            User foundUser = findUserByEmailOrUsername(email);
            if (foundUser == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            if (foundUser.getResetOtp() == null || !foundUser.getResetOtp().equals(otp)) {
                return ResponseEntity.status(400).body(Map.of("error", "Invalid verification code"));
            }
            if (foundUser.getOtpExpiry() == null || LocalDateTime.now().isAfter(foundUser.getOtpExpiry())) {
                return ResponseEntity.status(400).body(Map.of("error", "Verification code has expired (5 minutes validity)"));
            }
            return ResponseEntity.ok(Map.of("message", "OTP verified successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Verify & Reset Password with BCrypt & Complexity Rules
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String otp = body.get("otp");
            String newPassword = body.get("newPassword");
            if (email == null || otp == null || newPassword == null || email.isBlank() || otp.isBlank() || newPassword.isBlank()) {
                return ResponseEntity.status(400).body(Map.of("error", "Email, OTP, and new password are required"));
            }
            User foundUser = findUserByEmailOrUsername(email);
            if (foundUser == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            if (foundUser.getResetOtp() == null || !foundUser.getResetOtp().equals(otp)) {
                return ResponseEntity.status(400).body(Map.of("error", "Invalid verification code"));
            }
            if (foundUser.getOtpExpiry() == null || LocalDateTime.now().isAfter(foundUser.getOtpExpiry())) {
                return ResponseEntity.status(400).body(Map.of("error", "Verification code has expired"));
            }
            if (!isValidPassword(newPassword)) {
                return ResponseEntity.status(400).body(Map.of("error", "Password must be 8-12 characters and include uppercase, lowercase, number, and special character"));
            }
            boolean isSameOld = false;
            if (foundUser.getPassword() != null && (foundUser.getPassword().startsWith("$2a$") || foundUser.getPassword().startsWith("$2b$") || foundUser.getPassword().startsWith("$2y$"))) {
                isSameOld = passwordEncoder.matches(newPassword, foundUser.getPassword());
            } else {
                isSameOld = foundUser.getPassword() != null && foundUser.getPassword().equals(newPassword);
            }
            if (isSameOld) {
                return ResponseEntity.status(400).body(Map.of("error", "New password must not be identical to your previous password"));
            }

            foundUser.setPassword(passwordEncoder.encode(newPassword));
            foundUser.setPasswordChanged(true);
            foundUser.setResetOtp(null);
            foundUser.setOtpExpiry(null);
            repo.save(foundUser);

            String recipientName = getRecipientName(foundUser, email);
            String targetEmail = getRecipientEmail(foundUser, email);
            emailTemplateService.sendPasswordChangedSuccessMail(targetEmail, recipientName, foundUser.getUsername(), LocalDateTime.now().toString());

            return ResponseEntity.ok(Map.of("message", "Password reset successful. You can now sign in with your new credentials."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Change Password endpoint (First Login Enforcement / User Initiated)
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        try {
            String username = body.get("username");
            String currentPassword = body.get("currentPassword");
            String newPassword = body.get("newPassword");

            if (username == null || currentPassword == null || newPassword == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Username, current password, and new password are required"));
            }

            User user = repo.findByUsername(username).orElse(null);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            boolean matches = false;
            if (user.getPassword() != null && (user.getPassword().startsWith("$2a$") || user.getPassword().startsWith("$2b$") || user.getPassword().startsWith("$2y$"))) {
                matches = passwordEncoder.matches(currentPassword, user.getPassword());
            } else {
                matches = user.getPassword() != null && user.getPassword().equals(currentPassword);
            }
            if (!matches) {
                return ResponseEntity.status(400).body(Map.of("error", "Incorrect current password"));
            }

            if (!isValidPassword(newPassword)) {
                return ResponseEntity.status(400).body(Map.of("error", "New password must be 8-12 characters and include uppercase, lowercase, number, and special character"));
            }

            if (passwordEncoder.matches(newPassword, user.getPassword()) || currentPassword.equals(newPassword)) {
                return ResponseEntity.status(400).body(Map.of("error", "New password cannot be identical to your current password"));
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            user.setPasswordChanged(true);
            repo.save(user);

            String recipientName = getRecipientName(user, username);
            String targetEmail = getRecipientEmail(user, username);
            emailTemplateService.sendPasswordChangedSuccessMail(targetEmail, recipientName, user.getUsername(), LocalDateTime.now().toString());

            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private User findUserByEmailOrUsername(String emailOrUser) {
        if (emailOrUser == null || emailOrUser.isBlank()) return null;
        Patient p = patientRepo.findByEmail(emailOrUser).orElse(null);
        if (p != null && p.getUserId() != null) {
            User u = repo.findById(p.getUserId()).orElse(null);
            if (u != null) return u;
        }
        Doctor d = doctorRepository.findByEmail(emailOrUser).orElse(null);
        if (d != null && d.getUserId() != null) {
            User u = repo.findById(d.getUserId()).orElse(null);
            if (u != null) return u;
        }
        User u = repo.findByEmail(emailOrUser).orElse(null);
        if (u != null) return u;
        return repo.findByUsername(emailOrUser).orElse(null);
    }

    private String getRecipientName(User user, String fallback) {
        if (user == null) return "User";
        if (user.getRole() == Role.PATIENT) {
            Patient p = patientRepo.findAll().stream().filter(pt -> user.getId().equals(pt.getUserId())).findFirst().orElse(null);
            if (p != null && p.getName() != null) return p.getName();
        } else if (user.getRole() == Role.DOCTOR) {
            Doctor d = doctorRepository.findAll().stream().filter(dt -> user.getId().equals(dt.getUserId())).findFirst().orElse(null);
            if (d != null && d.getDoctorName() != null) return "Dr. " + d.getDoctorName();
        }
        return user.getUsername();
    }

    private String getRecipientEmail(User user, String fallback) {
        if (user == null) return fallback;
        if (user.getEmail() != null && !user.getEmail().isBlank()) return user.getEmail();
        if (user.getRole() == Role.PATIENT) {
            Patient p = patientRepo.findAll().stream().filter(pt -> user.getId().equals(pt.getUserId())).findFirst().orElse(null);
            if (p != null && p.getEmail() != null) return p.getEmail();
        } else if (user.getRole() == Role.DOCTOR) {
            Doctor d = doctorRepository.findAll().stream().filter(dt -> user.getId().equals(dt.getUserId())).findFirst().orElse(null);
            if (d != null && d.getEmail() != null) return d.getEmail();
        }
        return fallback;
    }

    private boolean isValidPassword(String pwd) {
        if (pwd == null || pwd.length() < 8 || pwd.length() > 20) return false;
        boolean hasUpper = false, hasLower = false, hasDigit = false, hasSpecial = false;
        for (char c : pwd.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
            else hasSpecial = true;
        }
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
}