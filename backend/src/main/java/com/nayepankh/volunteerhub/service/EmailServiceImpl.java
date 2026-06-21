package com.nayepankh.volunteerhub.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.dev-mode:false}")
    private boolean devMode;

    @Value("${spring.mail.username:noreply@nayepankh.org}")
    private String fromAddress;

    @Async
    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        log.info("Preparing OTP email async transmission to {} (Thread: {})", toEmail, Thread.currentThread().getName());
        if (devMode || mailSender == null) {
            log.warn("Dev mode is active or JavaMailSender is not initialized. Skipping actual email transmission.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setFrom(fromAddress, "NayePankh Foundation");
            helper.setSubject("Verify Your Email Address - NayePankh Foundation");

            String htmlContent = "<div style=\"font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #faf6ee; color: #1c1c1c;\">" +
                    "  <h2 style=\"color: #1f3a2e; margin-bottom: 20px;\">Welcome to NayePankh Foundation</h2>" +
                    "  <p style=\"font-size: 16px; line-height: 1.5;\">Dear Volunteer,</p>" +
                    "  <p style=\"font-size: 16px; line-height: 1.5;\">Thank you for your interest in onboarding as a volunteer. Please verify your email address by using the 6-digit One-Time Password (OTP) below:</p>" +
                    "  <div style=\"text-align: center; margin: 30px 0;\">" +
                    "    <span style=\"display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #3f6f52; padding: 12px 24px; border: 2px dashed #3f6f52; border-radius: 8px; background-color: #eef3e8;\">" + otp + "</span>" +
                    "  </div>" +
                    "  <p style=\"font-size: 14px; line-height: 1.5; color: #718096;\">This OTP is valid for 5 minutes and can only be used once. If you did not initiate this request, you can ignore this email.</p>" +
                    "  <hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;\" />" +
                    "  <p style=\"font-size: 14px; line-height: 1.5; color: #718096; text-align: center;\">NayePankh Foundation Team &bull; Giving Wings to Kindness</p>" +
                    "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Successfully sent OTP email to {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to transmit OTP email to {}. Exception: {}", toEmail, e.getMessage(), e);
        }
    }

    @Async
    @Override
    public void sendWelcomeEmail(String toEmail, String name) {
        log.info("Preparing Welcome email async transmission to {} (Thread: {})", toEmail, Thread.currentThread().getName());
        if (devMode || mailSender == null) {
            log.warn("Dev mode is active or JavaMailSender is not initialized. Skipping actual email transmission.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setFrom(fromAddress, "NayePankh Foundation");
            helper.setSubject("Welcome to NayePankh Foundation! 🌟");

            String htmlContent = "<div style=\"font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #faf6ee; color: #1c1c1c;\">" +
                    "  <h2 style=\"color: #1f3a2e; margin-bottom: 20px;\">Onboarding Complete! 🎉</h2>" +
                    "  <p style=\"font-size: 16px; line-height: 1.5;\">Dear " + name + ",</p>" +
                    "  <p style=\"font-size: 16px; line-height: 1.5;\">We are absolutely thrilled to welcome you to the <strong>NayePankh Foundation</strong> family! 🌟</p>" +
                    "  <p style=\"font-size: 16px; line-height: 1.5;\">Your email verification was successful, and your application is officially registered in our Volunteer Hub. Our coordinators will review your profile and reach out to you shortly to map your skills (<strong>" + name + "</strong>) to active community programs.</p>" +
                    "  <p style=\"font-size: 16px; line-height: 1.5; color: #3f6f52; font-weight: bold;\">Together, let's give wings to kindness! 💚</p>" +
                    "  <hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;\" />" +
                    "  <p style=\"font-size: 14px; line-height: 1.5; color: #718096; text-align: center;\">NayePankh Foundation Team &bull; Giving Wings to Kindness</p>" +
                    "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Successfully sent Welcome email to {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to transmit Welcome email to {}. Exception: {}", toEmail, e.getMessage(), e);
        }
    }
}
