package com.healthcare.healthcare_monitoring_system.service;

import org.springframework.stereotype.Service;
import java.util.Random;

@Service
public class EmailService {

    private final EmailTemplateService emailTemplateService;
    private final OtpStore otpStore;

    public EmailService(EmailTemplateService emailTemplateService, OtpStore otpStore) {
        this.emailTemplateService = emailTemplateService;
        this.otpStore = otpStore;
    }

    public String generateOtp() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    public void sendOtp(String email, String otp) {
        emailTemplateService.sendEmailOtpMail(email, otp);
    }

    public void sendPasswordResetOtp(String email, String otp) {
        emailTemplateService.sendPasswordResetOtpMail(email, otp);
    }
}
