package com.healthcare.healthcare_monitoring_system.config;

import com.healthcare.healthcare_monitoring_system.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey key =
            Keys.hmacShaKeyFor("secretkey123secretkey123secretkey123"
                .getBytes(StandardCharsets.UTF_8));

    public String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("role", user.getRole().name())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000L * 60 * 60 * 10)) // ✅ 10 hours
                .signWith(key)
                .compact();
    }
}