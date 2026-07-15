package com.healthcare.healthcare_monitoring_system.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:5174"
        ));
        config.setAllowedMethods(List.of(
            "GET", "POST", "PUT", "DELETE", "OPTIONS"
        ));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/auth/**").permitAll()
                    .requestMatchers("/api/users/**").hasRole("ADMIN")

                    .requestMatchers(HttpMethod.GET, "/api/doctors/**")
                        .hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                    .requestMatchers("/api/doctors/**")
                        .hasAnyRole("ADMIN", "DOCTOR")

                    .requestMatchers(HttpMethod.GET, "/api/patients/**")
                        .hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                    .requestMatchers("/api/patients/**")
                        .hasAnyRole("ADMIN", "DOCTOR")

                    .requestMatchers("/api/appointments/**")
                        .hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                    .requestMatchers("/api/slots/**")
                        .hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                    .requestMatchers(HttpMethod.GET, "/api/vitalsigns/**")
                        .hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                     .requestMatchers("/api/vitalsigns/**")
                        .hasAnyRole("ADMIN", "DOCTOR")
                    .requestMatchers("/api/alerts/**")
                        .hasAnyRole("ADMIN", "DOCTOR")
                    .requestMatchers("/api/emergency/**")
                         .hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                    .requestMatchers("/api/notifications/**")
                        .hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                    .requestMatchers("/api/prescriptions/**")
                        .hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                    .requestMatchers("/api/chatbot/**")
                        .hasAnyRole("ADMIN", "DOCTOR", "PATIENT") 
                    .requestMatchers("/api/symptom-checker/**")
                        .hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                    .requestMatchers("/api/reviews/**")
                        .hasAnyRole("ADMIN", "DOCTOR", "PATIENT")
                    .requestMatchers("/api/skin-analysis/**")
                        .hasAnyRole("ADMIN", "DOCTOR", "PATIENT")

                    .anyRequest().authenticated()
                )
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .addFilterBefore(jwtFilter,
                UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}    