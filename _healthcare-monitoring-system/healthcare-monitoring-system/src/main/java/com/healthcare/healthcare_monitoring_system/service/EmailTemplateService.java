package com.healthcare.healthcare_monitoring_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Reusable EmailTemplateService for Smart Healthcare Monitoring System.
 * All mail methods reuse the core HTML template with dynamic values and banking-grade styling.
 * Pure HTML emails only (no plain text).
 */
@Service
public class EmailTemplateService {

    @Autowired
    private JavaMailSender mailSender;

    /**
     * Core master template builder. Wraps body content with premium purple header, dark card container, and standard footer.
     */
    private String buildMasterHtml(String themeColor, String greetingName, String icon, String title, 
                                   String contentHtml, String buttonText, String buttonUrl, String securityNoticeHtml) {
        
        String headerGradient = "#7C3AED, #5b21b6"; // Default purple
        if ("blue".equalsIgnoreCase(themeColor)) headerGradient = "#2563eb, #1d4ed8";
        else if ("green".equalsIgnoreCase(themeColor)) headerGradient = "#16a34a, #15803d";
        else if ("red".equalsIgnoreCase(themeColor)) headerGradient = "#dc2626, #991b1b";
        else if ("gold".equalsIgnoreCase(themeColor)) headerGradient = "#eab308, #ca8a04";
        else if ("red-blue".equalsIgnoreCase(themeColor)) headerGradient = "#ef4444, #3b82f6";
        else if ("ai-purple".equalsIgnoreCase(themeColor)) headerGradient = "#8b5cf6, #6d28d9";

        String buttonBg = themeColor != null && themeColor.startsWith("#") ? themeColor : "#7C3AED";
        if ("blue".equalsIgnoreCase(themeColor)) buttonBg = "#2563eb";
        else if ("green".equalsIgnoreCase(themeColor)) buttonBg = "#16a34a";
        else if ("red".equalsIgnoreCase(themeColor)) buttonBg = "#dc2626";
        else if ("gold".equalsIgnoreCase(themeColor)) buttonBg = "#ca8a04";
        else if ("red-blue".equalsIgnoreCase(themeColor)) buttonBg = "#3b82f6";
        else if ("ai-purple".equalsIgnoreCase(themeColor)) buttonBg = "#8b5cf6";

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>\n")
          .append("<html>\n")
          .append("<head>\n")
          .append("<meta charset='UTF-8'>\n")
          .append("<meta name='viewport' content='width=device-width, initial-scale=1.0'>\n")
          .append("<title>").append(title).append("</title>\n")
          .append("</head>\n")
          .append("<body style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; margin: 0; padding: 25px 10px; color: #f8fafc; -webkit-font-smoothing: antialiased;\">\n")
          .append("  <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color: #0f172a; margin: 0; padding: 0;\">\n")
          .append("    <tr>\n")
          .append("      <td align=\"center\">\n")
          .append("        <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"max-width: 620px; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6); border: 1px solid #334155; margin: 0 auto;\">\n")
          // HEADER
          .append("          <tr>\n")
          .append("            <td style=\"background: linear-gradient(135deg, ").append(headerGradient).append("); padding: 32px 25px; text-align: center; color: #ffffff; border-bottom: 3px solid rgba(255,255,255,0.15);\">\n")
          .append("              <h1 style=\"margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff;\">🩺 Smart Healthcare Monitoring System</h1>\n")
          .append("              <p style=\"margin: 8px 0 0; font-size: 14px; opacity: 0.95; font-weight: 500; color: #e2e8f0;\">AI Powered Patient Care Platform</p>\n")
          .append("            </td>\n")
          .append("          </tr>\n")
          // BODY CARD
          .append("          <tr>\n")
          .append("            <td style=\"padding: 35px 30px;\">\n")
          .append("              <div style=\"font-size: 18px; font-weight: 600; color: #f8fafc; margin-bottom: 22px;\">Hello ").append(greetingName != null ? greetingName : "User").append(",</div>\n")
          .append("              <div style=\"text-align: center; margin-bottom: 25px;\">\n")
          .append("                <div style=\"font-size: 46px; margin-bottom: 10px;\">").append(icon).append("</div>\n")
          .append("                <h2 style=\"margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;\">").append(title).append("</h2>\n")
          .append("              </div>\n")
          .append("              <div style=\"background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 22px; margin-bottom: 25px; color: #e2e8f0; font-size: 15px; line-height: 1.6;\">\n")
          .append(contentHtml)
          .append("              </div>\n");

        if (buttonText != null && !buttonText.trim().isEmpty() && buttonUrl != null && !buttonUrl.trim().isEmpty()) {
            sb.append("              <div style=\"text-align: center; margin: 30px 0 25px;\">\n")
              .append("                <a href=\"").append(buttonUrl).append("\" target=\"_blank\" style=\"background: ").append(buttonBg).append("; color: #ffffff !important; text-decoration: none; padding: 15px 34px; border-radius: 50px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 10px 20px rgba(0,0,0,0.3); text-transform: uppercase; letter-spacing: 0.8px;\">")
              .append(buttonText)
              .append("</a>\n")
              .append("              </div>\n");
        }

        if (securityNoticeHtml != null && !securityNoticeHtml.trim().isEmpty()) {
            sb.append("              <div style=\"background-color: rgba(234, 179, 8, 0.12); border-left: 4px solid #eab308; color: #fde047; padding: 14px 18px; border-radius: 6px; font-size: 13px; line-height: 1.5; margin-top: 20px;\">\n")
              .append("                <strong style=\"color: #fef08a;\">⚠️ Security Notice:</strong> ").append(securityNoticeHtml).append("\n")
              .append("              </div>\n");
        }

        sb.append("            </td>\n")
          .append("          </tr>\n")
          // FOOTER
          .append("          <tr>\n")
          .append("            <td style=\"background-color: #0f172a; padding: 28px 25px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #334155; line-height: 1.6;\">\n")
          .append("              Need help? <a href=\"mailto:support@smarthospital.com\" style=\"color: #a855f7; text-decoration: none; font-weight: 600;\">support@smarthospital.com</a><br><br>\n")
          .append("              <strong style=\"color: #94a3b8;\">Smart Healthcare Monitoring System</strong><br>\n")
          .append("              AI Powered Healthcare Platform<br>\n")
          .append("              © 2026 Smart Healthcare Monitoring System<br><br>\n")
          .append("              <span style=\"font-size: 11px; opacity: 0.7;\">This is an automated email. Please do not reply.</span>\n")
          .append("            </td>\n")
          .append("          </tr>\n")
          .append("        </table>\n")
          .append("      </td>\n")
          .append("    </tr>\n")
          .append("  </table>\n")
          .append("</body>\n")
          .append("</html>");

        return sb.toString();
    }

    public boolean sendHtmlEmail(String to, String subject, String htmlContent) {
        if (to == null || to.trim().isEmpty()) return false;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("abinayav1513@gmail.com", "Smart Healthcare Monitoring System");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("✅ Premium HTML Email sent to: " + to + " | Subject: " + subject);
            return true;
        } catch (Exception e) {
            System.err.println("❌ Failed to send HTML email to: " + to);
            e.printStackTrace();
            return false;
        }
    }

    // =========================================================================
    // 1. REGISTRATION SUCCESSFUL
    // =========================================================================
    public void sendRegistrationSuccessMail(String to, String patientName, String email, String regDate) {
        String title = "Welcome to Smart Healthcare";
        String content = "<p style='margin-top:0;'>Your account has been created successfully. Welcome to our AI-powered medical platform!</p>"
            + "<table width='100%' cellpadding='6' cellspacing='0' style='margin-top:15px; border-top: 1px solid #334155;'>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Patient Name:</td><td style='color:#ffffff; font-weight:700;'>" + patientName + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Registered Email:</td><td style='color:#ffffff; font-weight:700;'>" + email + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Registration Date:</td><td style='color:#ffffff; font-weight:700;'>" + regDate + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Status:</td><td><span style='background:#15803d; color:#ffffff; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:800; letter-spacing:1px;'>SUCCESS</span></td></tr>"
            + "</table>";
        
        String html = buildMasterHtml("purple", patientName, "🎉", title, content, "Login Now", "http://localhost:5173/login", null);
        sendHtmlEmail(to, "Welcome to Smart Healthcare Monitoring System", html);
    }

    // =========================================================================
    // 2. EMAIL OTP VERIFICATION
    // =========================================================================
    public void sendEmailOtpMail(String to, String otp) {
        String title = "Verify Your Email";
        String content = "<div style='text-align: center; padding: 15px 0;'>"
            + "<div style='font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 12px;'>YOUR OTP</div>"
            + "<div style='font-size: 38px; font-weight: 800; letter-spacing: 6px; color: #a855f7; background: #1e293b; border: 2px dashed #7c3aed; padding: 16px; border-radius: 12px; display: inline-block;'>" + otp + "</div>"
            + "<p style='color: #cbd5e1; font-size: 14px; margin-top: 15px; margin-bottom: 0;'>OTP valid for <strong>5 minutes</strong>.</p>"
            + "</div>";
        
        String securityNotice = "Never share this OTP with anyone. Smart Hospital personnel will never ask for your verification code.";
        String html = buildMasterHtml("purple", "User", "🔐", title, content, null, null, securityNotice);
        sendHtmlEmail(to, "HealthCare - Email Verification OTP [" + otp + "]", html);
    }

    // =========================================================================
    // 3. PASSWORD RESET OTP
    // =========================================================================
    public void sendPasswordResetOtpMail(String to, String otp) {
        String title = "Password Reset Request";
        String content = "<div style='text-align: center; padding: 15px 0;'>"
            + "<div style='font-size: 13px; color: #facc15; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 12px;'>RESET CODE</div>"
            + "<div style='font-size: 38px; font-weight: 800; letter-spacing: 6px; color: #facc15; background: #1e293b; border: 2px dashed #eab308; padding: 16px; border-radius: 12px; display: inline-block;'>" + otp + "</div>"
            + "<p style='color: #cbd5e1; font-size: 14px; margin-top: 15px; margin-bottom: 0;'>Expires in <strong>5 minutes</strong>.</p>"
            + "</div>";
        
        String securityNotice = "If you did not initiate a password reset, please change your credentials immediately and contact support. Never share this reset code.";
        String html = buildMasterHtml("gold", "User", "🔑", title, content, null, null, securityNotice);
        sendHtmlEmail(to, "HealthCare - Password Reset Code [" + otp + "]", html);
    }

    // =========================================================================
    // 4. APPOINTMENT BOOKED
    // =========================================================================
    public boolean sendAppointmentBookedMail(String to, String patientName, String doctorName, String spec, String date, String time, String hospital) {
        String title = "Appointment Confirmed";
        String content = "<p style='margin-top:0;'>Your appointment booking request has been registered and is awaiting final doctor confirmation.</p>"
            + "<table width='100%' cellpadding='6' cellspacing='0' style='margin-top:15px; border-top: 1px solid #334155;'>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Doctor Name:</td><td style='color:#ffffff; font-weight:700;'>Dr. " + doctorName + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Specialization:</td><td style='color:#60a5fa; font-weight:600;'>" + (spec != null ? spec : "General Medicine") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Appointment Date:</td><td style='color:#ffffff; font-weight:700;'>" + date + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Appointment Time:</td><td style='color:#ffffff; font-weight:700;'>" + time + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Hospital:</td><td style='color:#cbd5e1;'>" + (hospital != null ? hospital : "Smart Healthcare City Center") + "</td></tr>"
            + "</table>";
        
        String html = buildMasterHtml("blue", patientName, "📅", title, content, "View Appointment", "http://localhost:5173/patient-dashboard", null);
        return sendHtmlEmail(to, "Appointment Booked Successfully - Dr. " + doctorName, html);
    }

    // =========================================================================
    // 4b. APPOINTMENT REQUEST TO DOCTOR
    // =========================================================================
    public boolean sendDoctorAppointmentRequestMail(String toDoctorEmail, String doctorName, String patientName, String date, String time, String reason) {
        return sendDoctorAppointmentRequestMail(toDoctorEmail, doctorName, patientName, date, time, "N/A", "N/A", reason);
    }

    public boolean sendDoctorAppointmentRequestMail(String toDoctorEmail, String doctorName, String patientName, String date, String time, String patientPhone, String patientEmail, String notes) {
        String title = "New Appointment Request";
        String content = "<p style='margin-top:0;'>You have received a new appointment booking request from a patient. Please review and confirm or reschedule.</p>"
            + "<table width='100%' cellpadding='6' cellspacing='0' style='margin-top:15px; border-top: 1px solid #334155;'>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Patient Name:</td><td style='color:#ffffff; font-weight:700;'>" + (patientName != null ? patientName : "Patient") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Appointment Date:</td><td style='color:#ffffff; font-weight:700;'>" + (date != null ? date : "N/A") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Time Slot:</td><td style='color:#ffffff; font-weight:700;'>" + (time != null ? time : "N/A") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Patient Phone:</td><td style='color:#60a5fa; font-weight:600;'>" + (patientPhone != null ? patientPhone : "N/A") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Patient Email:</td><td style='color:#60a5fa; font-weight:600;'>" + (patientEmail != null ? patientEmail : "N/A") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Medical Notes:</td><td style='color:#cbd5e1;'>" + (notes != null && !notes.isEmpty() ? notes : "None") + "</td></tr>"
            + "</table>"
            + "<p style='color: #facc15; font-size: 13px; font-weight: 600; margin-bottom: 0; margin-top: 15px;'>⚠️ Accept / Reject reminder: Please login to your portal to ACCEPT or REJECT this appointment request.</p>";
        
        String html = buildMasterHtml("purple", "Dr. " + doctorName, "📅", title, content, "Review Appointments", "http://localhost:5173/dashboard", null);
        return sendHtmlEmail(toDoctorEmail, "New Appointment Request from " + (patientName != null ? patientName : "Patient"), html);
    }

    // =========================================================================
    // 5. APPOINTMENT APPROVED
    // =========================================================================
    public boolean sendAppointmentApprovedMail(String to, String patientName, String doctorName, String date, String time) {
        return sendAppointmentApprovedMail(to, patientName, doctorName, "General Medicine", date, time, "Smart Healthcare City Center");
    }

    public boolean sendAppointmentApprovedMail(String to, String patientName, String doctorName, String spec, String date, String time, String hospital) {
        String title = "Appointment Approved";
        String content = "<p style='margin-top:0; color: #4ade80; font-weight: 600;'>Your doctor has accepted your appointment.</p>"
            + "<table width='100%' cellpadding='6' cellspacing='0' style='margin-top:15px; border-top: 1px solid #334155;'>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Doctor Name:</td><td style='color:#ffffff; font-weight:700;'>Dr. " + doctorName + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Specialization:</td><td style='color:#60a5fa; font-weight:600;'>" + (spec != null ? spec : "General Medicine") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Appointment Date:</td><td style='color:#ffffff; font-weight:700;'>" + date + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Time:</td><td style='color:#ffffff; font-weight:700;'>" + time + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Hospital/Clinic:</td><td style='color:#cbd5e1;'>" + (hospital != null ? hospital : "Smart Healthcare City Center") + "</td></tr>"
            + "</table>"
            + "<p style='color: #cbd5e1; font-size: 13px; font-weight: 600; margin-bottom: 0; margin-top: 15px;'>⏰ Reminder: Please arrive 15 minutes early before your scheduled consultation time.</p>";
        
        String html = buildMasterHtml("green", patientName, "✅", title, content, "Open Dashboard", "http://localhost:5173/patient-dashboard", null);
        return sendHtmlEmail(to, "Appointment Approved - Dr. " + doctorName, html);
    }

    // =========================================================================
    // 6. APPOINTMENT REJECTED
    // =========================================================================
    public boolean sendAppointmentRejectedMail(String to, String patientName, String doctorName, String date, String time, String reason) {
        String title = "Appointment Cancelled";
        String content = "<p style='margin-top:0; color: #f87171;'>We regret to inform you that your scheduled appointment has been cancelled.</p>"
            + "<table width='100%' cellpadding='6' cellspacing='0' style='margin-top:15px; border-top: 1px solid #334155;'>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Doctor Name:</td><td style='color:#ffffff; font-weight:700;'>Dr. " + doctorName + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Date:</td><td style='color:#ffffff; font-weight:700;'>" + date + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Time:</td><td style='color:#ffffff; font-weight:700;'>" + time + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Reason:</td><td style='color:#fca5a5; font-weight:600;'>" + (reason != null && !reason.trim().isEmpty() ? reason : "Doctor unavailable / Schedule conflict") + "</td></tr>"
            + "</table>"
            + "<p style='color: #cbd5e1; font-size: 13px; margin-bottom: 0; margin-top: 15px;'>We encourage you to book another slot at your earliest convenience.</p>";
        
        String html = buildMasterHtml("red", patientName, "❌", title, content, "Book Another Slot", "http://localhost:5173/patient-dashboard", null);
        return sendHtmlEmail(to, "Appointment Cancelled - Dr. " + doctorName, html);
    }

    // =========================================================================
    // 7. DIGITAL PRESCRIPTION READY
    // =========================================================================
    public void sendPrescriptionReadyMail(String to, String patientName, String doctorName, String visitDate, String medicineSummary) {
        String title = "Prescription Available";
        String content = "<p style='margin-top:0;'>Your digital prescription has been generated and signed by your treating physician.</p>"
            + "<table width='100%' cellpadding='6' cellspacing='0' style='margin-top:15px; border-top: 1px solid #334155;'>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Doctor:</td><td style='color:#ffffff; font-weight:700;'>Dr. " + doctorName + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Visit Date:</td><td style='color:#ffffff; font-weight:700;'>" + visitDate + "</td></tr>"
            + (medicineSummary != null && !medicineSummary.trim().isEmpty() ? 
                "<tr><td style='color:#64748b; font-size:13px;'>Prescribed Details:</td><td style='color:#c084fc; font-weight:600;'>" + medicineSummary + "</td></tr>" : "")
            + "</table>";
        
        String html = buildMasterHtml("purple", patientName, "💊", title, content, "Download Prescription", "http://localhost:5173/patient-dashboard", null);
        sendHtmlEmail(to, "Digital Prescription Ready - Dr. " + doctorName, html);
    }

    // =========================================================================
    // 8. EMERGENCY SOS TRIGGERED
    // =========================================================================
    public void sendEmergencySosMail(String to, String patientName, Double latitude, Double longitude, String locationLink, 
                                     String doctorAssigned, String emergencyTime, String ambulanceStatus) {
        String title = "🚨 EMERGENCY ALERT";
        String content = "<div style='background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 18px; font-weight: 700; color: #fca5a5;'>"
            + "URGENT SOS TRIGGERED — IMMEDIATE ATTENTION REQUIRED"
            + "</div>"
            + "<table width='100%' cellpadding='6' cellspacing='0' style='border-top: 1px solid #334155;'>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Patient:</td><td style='color:#ffffff; font-weight:700; font-size:16px;'>" + patientName + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Current Location:</td><td style='color:#f87171; font-weight:700;'>" + latitude + ", " + longitude + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Doctor Assigned:</td><td style='color:#ffffff; font-weight:700;'>Dr. " + (doctorAssigned != null ? doctorAssigned : "On-Duty Emergency Team") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Emergency Time:</td><td style='color:#ffffff;'>" + (emergencyTime != null ? emergencyTime : LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))) + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Ambulance Status:</td><td style='color:#4ade80; font-weight:700;'>" + (ambulanceStatus != null ? ambulanceStatus : "DISPATCHED") + "</td></tr>"
            + "</table>";
        
        String mapUrl = (locationLink != null && !locationLink.trim().isEmpty()) ? locationLink : "https://www.google.com/maps?q=" + latitude + "," + longitude;
        String html = buildMasterHtml("red", patientName, "🚨", title, content, "📍 Open Clickable Google Maps", mapUrl, null);
        sendHtmlEmail(to, "🚨 URGENT SOS ALERT: Patient " + patientName + " Needs Immediate Help", html);
    }

    // =========================================================================
    // 9. AMBULANCE DISPATCHED
    // =========================================================================
    public void sendAmbulanceDispatchedMail(String to, String patientName, String ambulanceNumber, String driverName, String eta, String distanceRemaining, String trackingUrl) {
        String title = "🚑 Ambulance On The Way";
        String content = "<p style='margin-top:0; color:#60a5fa; font-weight:600;'>An emergency medical transport vehicle has been assigned and dispatched to your GPS coordinates.</p>"
            + "<table width='100%' cellpadding='6' cellspacing='0' style='margin-top:15px; border-top: 1px solid #334155;'>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Ambulance Number:</td><td style='color:#ffffff; font-weight:700; font-size:16px;'>" + ambulanceNumber + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Driver Name:</td><td style='color:#ffffff; font-weight:700;'>" + driverName + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Estimated Arrival Time:</td><td style='color:#4ade80; font-weight:800; font-size:16px;'>" + (eta != null ? eta : "8 mins") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Distance Remaining:</td><td style='color:#e2e8f0; font-weight:600;'>" + (distanceRemaining != null ? distanceRemaining : "3.2 km") + "</td></tr>"
            + "</table>";
        
        String url = (trackingUrl != null && !trackingUrl.trim().isEmpty()) ? trackingUrl : "http://localhost:5173/dashboard";
        String html = buildMasterHtml("red-blue", patientName, "🚑", title, content, "Track Ambulance Live", url, null);
        sendHtmlEmail(to, "🚑 Ambulance Dispatched (" + ambulanceNumber + ") - ETA: " + eta, html);
    }

    // =========================================================================
    // 10. DOCTOR NOTIFICATION (NEW EMERGENCY CASE ASSIGNED)
    // =========================================================================
    public void sendDoctorEmergencyAssignedMail(String toDoctorEmail, String doctorName, String patientName, String symptoms, String vitals, Double lat, Double lng, String emergencyLevel, String detailsUrl) {
        String title = "New Emergency Case Assigned";
        String badgeColor = "CRITICAL".equalsIgnoreCase(emergencyLevel) ? "#ef4444" : "#f59e0b";
        String content = "<div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;'>"
            + "<span style='color:#94a3b8; font-weight:600; font-size:13px;'>TRIAGE PRIORITY:</span>"
            + "<span style='background:" + badgeColor + "; color:#ffffff; padding:4px 12px; border-radius:20px; font-weight:800; font-size:12px; letter-spacing:1px;'>" + (emergencyLevel != null ? emergencyLevel : "HIGH") + " SEVERITY</span>"
            + "</div>"
            + "<table width='100%' cellpadding='6' cellspacing='0' style='border-top: 1px solid #334155;'>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Patient Details:</td><td style='color:#ffffff; font-weight:700; font-size:15px;'>" + patientName + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Symptoms:</td><td style='color:#f87171; font-weight:600;'>" + (symptoms != null ? symptoms : "Acute clinical distress reported via SOS") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Vitals Summary:</td><td style='color:#38bdf8; font-weight:600;'>" + (vitals != null ? vitals : "Continuous telemetry active") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Location:</td><td style='color:#cbd5e1;'>" + lat + ", " + lng + "</td></tr>"
            + "</table>";
        
        String url = (detailsUrl != null && !detailsUrl.trim().isEmpty()) ? detailsUrl : "http://localhost:5173/dashboard";
        String html = buildMasterHtml("red", "Dr. " + doctorName, "🩺", title, content, "Open Patient Details", url, null);
        sendHtmlEmail(toDoctorEmail, "🚨 Urgent Case Assigned: Patient " + patientName + " (" + emergencyLevel + ")", html);
    }

    public void sendDoctorEmergencyImmediateAttentionMail(String toDoctorEmail, String doctorName, String patientName, String phone, String bloodGroup, String lastAppointmentDate, Double lat, Double lng, String emergencyTime, String detailsUrl) {
        String title = "🚨 EMERGENCY ALERT";
        String mapUrl = "https://www.google.com/maps?q=" + lat + "," + lng;
        String content = "<div style='background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 16px; font-weight: 700; color: #fca5a5;'>"
            + "CRITICAL SOS TRIGGERED — PRIMARY ASSIGNED DOCTOR IMMEDIATE ATTENTION REQUIRED"
            + "</div>"
            + "<table width='100%' cellpadding='6' cellspacing='0' style='border-top: 1px solid #334155;'>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Patient Name:</td><td style='color:#ffffff; font-weight:700; font-size:16px;'>" + patientName + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Phone Number:</td><td style='color:#38bdf8; font-weight:600;'>" + (phone != null ? phone : "Not Registered") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Blood Group:</td><td style='color:#ef4444; font-weight:800; font-size:15px;'>" + (bloodGroup != null ? bloodGroup : "Unknown") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Last Appointment Date:</td><td style='color:#e2e8f0;'>" + (lastAppointmentDate != null ? lastAppointmentDate : "N/A") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Current GPS Location:</td><td style='color:#f87171; font-weight:700;'>" + lat + ", " + lng + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Emergency Time:</td><td style='color:#ffffff;'>" + (emergencyTime != null ? emergencyTime : LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))) + "</td></tr>"
            + "</table>"
            + "<div style='text-align:center; margin-top:18px;'>"
            + "<a href='" + mapUrl + "' style='display:inline-block; background:#ef4444; color:#ffffff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:700; font-size:14px; box-shadow: 0 4px 12px rgba(239,68,68,0.4);'>📍 Open Live Location</a>"
            + "</div>";
        
        String url = (detailsUrl != null && !detailsUrl.trim().isEmpty()) ? detailsUrl : "http://localhost:5173/dashboard";
        String html = buildMasterHtml("red", "Dr. " + (doctorName != null ? doctorName : "Assigned Doctor"), "🚨", title, content, "View Patient Details", url, null);
        sendHtmlEmail(toDoctorEmail, "🚨 Emergency Alert - Immediate Attention Required", html);
    }

    public void sendAdminEmergencyDispatchMail(String toAdminEmail, String adminName, String patientDetails, String assignedDoctorName, String emergencyTime, Double lat, Double lng, String dispatchUrl) {
        String title = "🚑 Emergency Dispatch Required";
        String mapUrl = "https://www.google.com/maps?q=" + lat + "," + lng;
        String content = "<div style='background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 16px; font-weight: 700; color: #fca5a5;'>"
            + "EMERGENCY AMBULANCE DISPATCH & ROUTING INITIATED"
            + "</div>"
            + "<table width='100%' cellpadding='6' cellspacing='0' style='border-top: 1px solid #334155;'>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Patient Details:</td><td style='color:#ffffff; font-weight:700; font-size:15px;'>" + patientDetails + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Assigned Doctor:</td><td style='color:#38bdf8; font-weight:700;'>Dr. " + (assignedDoctorName != null ? assignedDoctorName : "Pending Assignment") + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Emergency Time:</td><td style='color:#ffffff;'>" + (emergencyTime != null ? emergencyTime : LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))) + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>GPS Coordinates:</td><td style='color:#f87171; font-weight:700;'>" + lat + ", " + lng + "</td></tr>"
            + "</table>"
            + "<div style='text-align:center; margin-top:18px;'>"
            + "<a href='" + mapUrl + "' style='display:inline-block; background:#ef4444; color:#ffffff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:700; font-size:14px; box-shadow: 0 4px 12px rgba(239,68,68,0.4);'>📍 Open Live Location</a>"
            + "</div>";
        
        String url = (dispatchUrl != null && !dispatchUrl.trim().isEmpty()) ? dispatchUrl : "http://localhost:5173/dashboard";
        String html = buildMasterHtml("red-blue", adminName != null ? adminName : "Hospital Administrator", "🚑", title, content, "Dispatch Ambulance", url, null);
        sendHtmlEmail(toAdminEmail, "🚑 Emergency Dispatch Required", html);
    }

    // =========================================================================
    // 11. REVIEW SUBMITTED
    // =========================================================================
    public void sendReviewSubmittedMail(String toDoctorEmail, String doctorName, String patientName, Integer rating, String comment) {
        String title = "⭐ Review Received";
        StringBuilder stars = new StringBuilder();
        int r = (rating != null && rating >= 1 && rating <= 5) ? rating : 5;
        for (int i = 0; i < r; i++) stars.append("★");
        for (int i = r; i < 5; i++) stars.append("☆");

        String content = "<div style='text-align: center; padding: 10px 0; border-bottom: 1px solid #334155; margin-bottom: 15px;'>"
            + "<div style='font-size: 28px; color: #facc15; letter-spacing: 3px; margin-bottom: 6px;'>" + stars.toString() + "</div>"
            + "<div style='font-size: 14px; color: #e2e8f0; font-weight: 700;'>" + r + " / 5 Stars</div>"
            + "</div>"
            + "<table width='100%' cellpadding='6' cellspacing='0'>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Doctor Name:</td><td style='color:#ffffff; font-weight:700;'>Dr. " + doctorName + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Reviewed By:</td><td style='color:#cbd5e1; font-weight:600;'>" + patientName + "</td></tr>"
            + "<tr><td style='color:#64748b; font-size:13px;'>Patient Comment:</td><td style='color:#fef08a; font-style:italic; line-height:1.5;'>\"" + (comment != null && !comment.trim().isEmpty() ? comment : "Excellent service and consultation.") + "\"</td></tr>"
            + "</table>";
        
        String html = buildMasterHtml("gold", "Dr. " + doctorName, "⭐", title, content, null, null, null);
        sendHtmlEmail(toDoctorEmail, "⭐ New Patient Review Received (" + r + " Stars)", html);
    }

    // =========================================================================
    // 12. AI DOCTOR RECOMMENDATION
    // =========================================================================
    public void sendAiRecommendationMail(String to, String patientName, String symptoms, String recommendedDoctorName, String specialization, Double averageRating, String experience) {
        String title = "🤖 AI Recommendation";
        String content = "<p style='margin-top:0; color:#a78bfa; font-weight:600;'>Based on your reported symptoms (<em>\"" + symptoms + "\"</em>), our clinical AI engine recommends the following specialist:</p>"
            + "<div style='background: #1e1b4b; border: 1px solid #6d28d9; border-radius: 10px; padding: 18px; margin-top: 15px;'>"
            + "<table width='100%' cellpadding='5' cellspacing='0'>"
            + "<tr><td style='color:#94a3b8; font-size:13px;'>Recommended Doctor:</td><td style='color:#ffffff; font-weight:800; font-size:16px;'>Dr. " + recommendedDoctorName + "</td></tr>"
            + "<tr><td style='color:#94a3b8; font-size:13px;'>Specialization:</td><td style='color:#38bdf8; font-weight:700;'>" + specialization + "</td></tr>"
            + "<tr><td style='color:#94a3b8; font-size:13px;'>Average Rating:</td><td style='color:#facc15; font-weight:700;'>★ " + (averageRating != null ? averageRating : 4.9) + " / 5.0</td></tr>"
            + "<tr><td style='color:#94a3b8; font-size:13px;'>Experience:</td><td style='color:#e2e8f0; font-weight:600;'>" + (experience != null ? experience : "12+ Years") + "</td></tr>"
            + "</table>"
            + "</div>";
        
        String html = buildMasterHtml("ai-purple", patientName, "🤖", title, content, "Book Appointment", "http://localhost:5173/patient-dashboard", null);
        sendHtmlEmail(to, "🤖 AI Doctor Recommendation: Dr. " + recommendedDoctorName + " (" + specialization + ")", html);
    }

    // =========================================================================
    // 13. DOCTOR WELCOME ACCOUNT MAIL
    // =========================================================================
    public boolean sendDoctorWelcomeMail(String toEmail, String doctorName, String username, String tempPassword, String loginUrl) {
        String title = "🩺 Welcome to HealthCare Pro Medical Staff";
        String content = "<p style='margin-top:0; color:#cbd5e1; font-weight:600;'>Dear Dr. " + doctorName + ", your professional account has been successfully created by the Hospital Administrator.</p>"
            + "<div style='background: #1e293b; border: 1px solid #38bdf8; border-radius: 10px; padding: 18px; margin-top: 15px; margin-bottom: 15px;'>"
            + "<table width='100%' cellpadding='6' cellspacing='0'>"
            + "<tr><td style='color:#94a3b8; font-size:13px; width:40%;'>Doctor Name:</td><td style='color:#ffffff; font-weight:800; font-size:15px;'>Dr. " + doctorName + "</td></tr>"
            + "<tr><td style='color:#94a3b8; font-size:13px;'>Assigned Role:</td><td style='color:#38bdf8; font-weight:700;'>DOCTOR</td></tr>"
            + "<tr><td style='color:#94a3b8; font-size:13px;'>Username:</td><td style='color:#facc15; font-weight:700; font-family:monospace; font-size:16px;'>" + username + "</td></tr>"
            + "<tr><td style='color:#94a3b8; font-size:13px;'>Temporary Password:</td><td style='color:#f43f5e; font-weight:700; font-family:monospace; font-size:16px;'>" + tempPassword + "</td></tr>"
            + "</table>"
            + "</div>"
            + "<p style='color:#f87171; font-size:13px; font-weight:700; background:#450a0a; border:1px solid #991b1b; padding:12px; border-radius:8px; margin-top:15px;'>"
            + "⚠️ SECURITY REQUIREMENT: For HIPAA compliance and account protection, you will be required to change your temporary password immediately upon your first login."
            + "</p>";

        String url = (loginUrl != null && !loginUrl.trim().isEmpty()) ? loginUrl : "http://localhost:5173/login";
        String html = buildMasterHtml("blue", "Dr. " + doctorName, "🩺", title, content, "Sign In Now", url, "Do not share your temporary credentials with anyone. If you did not expect this email, contact Hospital Administration.");
        return sendHtmlEmail(toEmail, "🩺 Welcome to HealthCare Pro - Your Doctor Credentials", html);
    }

    // =========================================================================
    // 14. FORGOT PASSWORD OTP MAIL
    // =========================================================================
    public boolean sendForgotPasswordOtpMail(String toEmail, String recipientName, String otp) {
        String title = "🔐 Password Recovery Verification";
        String content = "<p style='margin-top:0; color:#cbd5e1; font-weight:600;'>We received a request to reset the password for your HealthCare Pro account. Please use the verification code below to proceed:</p>"
            + "<div style='text-align: center; background: #0f172a; border: 2px dashed #f59e0b; border-radius: 12px; padding: 24px; margin: 20px 0;'>"
            + "<span style='font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #facc15; font-family: monospace; display: block;'>" + otp + "</span>"
            + "<span style='font-size: 12px; color: #94a3b8; margin-top: 8px; display: block;'>Code valid for exactly <strong>5 minutes</strong></span>"
            + "</div>"
            + "<p style='color:#cbd5e1; font-size:13px; line-height:1.6;'>"
            + "If you initiated this request, enter the code above on the verification screen. Once verified, you will be prompted to choose a new secure password."
            + "</p>";

        String html = buildMasterHtml("gold", recipientName != null ? recipientName : "Valued User", "🔐", title, content, null, null, "⚠️ SECURITY ALERT: Never share this verification code with anyone, including hospital staff or technical support. If you did not request a password reset, please change your password or contact support immediately.");
        return sendHtmlEmail(toEmail, "🔐 HealthCare Pro - Password Reset OTP Code", html);
    }

    // =========================================================================
    // 15. PASSWORD CHANGED CONFIRMATION MAIL
    // =========================================================================
    public boolean sendPasswordChangedSuccessMail(String toEmail, String recipientName, String username, String date) {
        String title = "✅ Password Successfully Changed";
        String content = "<p style='margin-top:0; color:#cbd5e1; font-weight:600;'>This email confirms that your HealthCare Pro account password has been successfully updated.</p>"
            + "<div style='background: #064e3b; border: 1px solid #10b981; border-radius: 10px; padding: 16px; margin: 18px 0;'>"
            + "<table width='100%' cellpadding='5' cellspacing='0'>"
            + "<tr><td style='color:#6ee7b7; font-size:13px; width:40%;'>Account Username:</td><td style='color:#ffffff; font-weight:700;'>" + username + "</td></tr>"
            + "<tr><td style='color:#6ee7b7; font-size:13px;'>Updated On:</td><td style='color:#ffffff; font-weight:700;'>" + (date != null ? date : java.time.LocalDateTime.now().toString()) + "</td></tr>"
            + "<tr><td style='color:#6ee7b7; font-size:13px;'>Status:</td><td style='color:#a7f3d0; font-weight:800;'>SECURE & ACTIVE</td></tr>"
            + "</table>"
            + "</div>"
            + "<p style='color:#e2e8f0; font-size:13px; line-height:1.6;'>"
            + "You can now use your new credentials to sign in across all HealthCare Pro portals and mobile applications."
            + "</p>";

        String html = buildMasterHtml("green", recipientName != null ? recipientName : "Valued User", "✅", title, content, "Access Portal", "http://localhost:5173/login", "If you did NOT perform this password update, please contact Hospital Emergency Support immediately as your account may be compromised.");
        return sendHtmlEmail(toEmail, "✅ HealthCare Pro - Security Notification: Password Changed", html);
    }
}
