package com.healthcare.healthcare_monitoring_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendStatusMail(
            String to,
            String patientName,
            String doctorName,
            String date,
            String time,
            String status
    ) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);

        message.setSubject("Appointment " + status);

        String body = "";

        if(status.equalsIgnoreCase("BOOKED")) {

            body =
                    "Dear " + patientName + ",\n\n"
                  + "Good News!\n\n"
                  + "Your appointment has been ACCEPTED.\n\n"
                  + "Doctor : Dr. " + doctorName + "\n"
                  + "Date : " + date + "\n"
                  + "Time : " + time + "\n\n"
                  + "Please arrive 15 minutes before your appointment.\n\n"
                  + "Thank you,\n"
                  + "Smart Healthcare Monitoring System";

        } else {

            body =
                    "Dear " + patientName + ",\n\n"
                  + "We are sorry.\n\n"
                  + "Your appointment has been CANCELLED.\n\n"
                  + "Doctor : Dr. " + doctorName + "\n"
                  + "Date : " + date + "\n"
                  + "Time : " + time + "\n\n"
                  + "Please book another appointment.\n\n"
                  + "Thank you,\n"
                  + "Smart Healthcare Monitoring System";

        }

        message.setText(body);

        mailSender.send(message);
    }
    public void sendAppointmentMail(
            String to,
            String patientName,
            String doctorName,
            String date,
            String time
    ) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);

        message.setSubject("Appointment Booked Successfully");

        message.setText(
                "Dear " + patientName + ",\n\n"
                + "Your appointment has been booked successfully.\n\n"
                + "Doctor : Dr. " + doctorName + "\n"
                + "Date : " + date + "\n"
                + "Time : " + time + "\n\n"
                + "Status : PENDING\n\n"
                + "Please wait for doctor's approval.\n\n"
                + "Thank you,\n"
                + "Smart Healthcare Monitoring System"
        );

        mailSender.send(message);
    }
    public void sendEmergencyMail(
            String to,
            String patientName,
            String doctorName,
            String messageText,
            String locationLink
    ) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);

        message.setSubject("🚨 Emergency Alert");
        message.setText(
                "Dear Dr. " + doctorName + ",\n\n"
                + "An emergency request has been raised.\n\n"
                + "Patient : " + patientName + "\n"
                + "Problem : " + messageText + "\n\n"
                + "📍 Patient Location:\n"
                + locationLink + "\n\n"
                + "Please attend immediately.\n\n"
                + "Smart Healthcare Monitoring System"
        );
     

        mailSender.send(message);
    }

}
