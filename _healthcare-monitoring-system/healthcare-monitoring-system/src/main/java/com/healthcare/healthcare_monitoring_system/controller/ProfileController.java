package com.healthcare.healthcare_monitoring_system.controller;

import com.healthcare.healthcare_monitoring_system.dto.ProfileDTO;
import com.healthcare.healthcare_monitoring_system.service.ProfileService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;
    private final PasswordEncoder passwordEncoder;
    private final Path rootUploadDir = Paths.get("uploads", "profile");

    public ProfileController(ProfileService profileService, PasswordEncoder passwordEncoder) {
        this.profileService = profileService;
        this.passwordEncoder = passwordEncoder;
        try {
            Files.createDirectories(rootUploadDir);
        } catch (IOException e) {
            System.err.println("Could not initialize upload folder for profile photos: " + e.getMessage());
        }
    }

    private String getAuthenticatedUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<ProfileDTO> getProfile() {
        String username = getAuthenticatedUsername();
        return ResponseEntity.ok(profileService.getProfile(username));
    }

    @PutMapping
    public ResponseEntity<ProfileDTO> updateProfile(@RequestBody ProfileDTO req) {
        String username = getAuthenticatedUsername();
        return ResponseEntity.ok(profileService.updateProfile(username, req));
    }

    @PostMapping("/upload-photo")
    public ResponseEntity<?> uploadPhoto(@RequestParam(value = "file", required = false) MultipartFile fileParam,
                                         @RequestParam(value = "photo", required = false) MultipartFile photoParam) {
        try {
            MultipartFile file = fileParam != null ? fileParam : photoParam;
            if (file == null || file.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "No photo uploaded"));
            }

            Files.createDirectories(rootUploadDir);
            String ext = "";
            String origName = file.getOriginalFilename();
            if (origName != null && origName.contains(".")) {
                ext = origName.substring(origName.lastIndexOf("."));
            }
            String filename = UUID.randomUUID().toString() + ext;
            Path targetPath = rootUploadDir.resolve(filename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String photoUrl = "/api/profile/uploads/profile/" + filename;
            String username = getAuthenticatedUsername();
            ProfileDTO updated = profileService.uploadPhoto(username, photoUrl);

            return ResponseEntity.ok(Map.of(
                    "message", "Profile photo uploaded successfully",
                    "photoUrl", photoUrl,
                    "profile", updated
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not upload file: " + e.getMessage()));
        }
    }

    @DeleteMapping("/photo")
    public ResponseEntity<?> deletePhoto() {
        try {
            String username = getAuthenticatedUsername();
            profileService.deletePhoto(username);
            return ResponseEntity.ok(Map.of("message", "Profile photo deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        try {
            String currentPassword = body.get("currentPassword");
            if (currentPassword == null) currentPassword = body.get("oldPassword");
            String newPassword = body.get("newPassword");

            if (currentPassword == null || newPassword == null || newPassword.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Current password and new password are required"));
            }

            String username = getAuthenticatedUsername();
            profileService.changePassword(username, currentPassword, newPassword, passwordEncoder);

            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health-passport/{patientId}")
    public ResponseEntity<ProfileDTO> getHealthPassport(@PathVariable Long patientId) {
        try {
            return ResponseEntity.ok(profileService.getHealthPassport(patientId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/uploads/profile/{filename:.+}")
    @ResponseBody
    public ResponseEntity<Resource> serveProfilePhoto(@PathVariable String filename) {
        try {
            Path file = rootUploadDir.resolve(filename);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                String contentType = Files.probeContentType(file);
                if (contentType == null) contentType = "image/jpeg";
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
