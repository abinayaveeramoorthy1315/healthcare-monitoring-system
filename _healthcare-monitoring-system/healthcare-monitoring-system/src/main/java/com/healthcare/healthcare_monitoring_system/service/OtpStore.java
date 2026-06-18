package com.healthcare.healthcare_monitoring_system.service;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OtpStore {

    // email → OTP store பண்ணும்
    private final Map<String, String> otpMap = new ConcurrentHashMap<>();

    public void saveOtp(String email, String otp) {
        otpMap.put(email, otp);
    }

    public String getOtp(String email) {
        return otpMap.get(email);
    }

    public boolean verifyOtp(String email, String otp) {
        String stored = otpMap.get(email);
        return stored != null && stored.equals(otp);
    }

    public void clearOtp(String email) {
        otpMap.remove(email);
    }
}
