package com.healthcare.healthcare_monitoring_system.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import java.util.Random;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final OtpStore otpStore;

    public EmailService(JavaMailSender mailSender, OtpStore otpStore) {
        this.mailSender = mailSender;
        this.otpStore = otpStore;
    }

    public String generateOtp() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    public void sendOtp(String email, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("HealthCare - Email Verification OTP");
        message.setText(
            "Dear User,\n\n" +
            "Your OTP for email verification is: " + otp + "\n\n" +
            "This OTP is valid for 10 minutes.\n\n" +
            "HealthCare Team"
        );
        mailSender.send(message);
    }
}
