package com.nayepankh.volunteerhub.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);
    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${resend.from-email:onboarding@resend.dev}")
    private String fromEmail;

    @Value("${app.mail.dev-mode:false}")
    private boolean devMode;

    private final RestTemplate restTemplate = new RestTemplate();

    @Async
    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        log.info("Preparing OTP email to {} (Thread: {})", toEmail, Thread.currentThread().getName());

        if (devMode) {
            log.warn("Dev mode ON — skipping real email. OTP for {}: {}", toEmail, otp);
            return;
        }

        String html = "<div style=\"font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;" +
                " border: 1px solid #e2e8f0; border-radius: 12px; background-color: #faf6ee; color: #1c1c1c;\">" +
                "  <h2 style=\"color: #1f3a2e; margin-bottom: 20px;\">Welcome to NayePankh Foundation</h2>" +
                "  <p style=\"font-size: 16px; line-height: 1.5;\">Dear Volunteer,</p>" +
                "  <p style=\"font-size: 16px; line-height: 1.5;\">Please verify your email using the OTP below:</p>" +
                "  <div style=\"text-align: center; margin: 30px 0;\">" +
                "    <span style=\"display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 4px;" +
                " color: #3f6f52; padding: 12px 24px; border: 2px dashed #3f6f52; border-radius: 8px;" +
                " background-color: #eef3e8;\">" + otp + "</span>" +
                "  </div>" +
                "  <p style=\"font-size: 14px; color: #718096;\">This OTP is valid for 5 minutes and can only be used once.</p>" +
                "  <hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;\" />" +
                "  <p style=\"font-size: 14px; color: #718096; text-align: center;\">NayePankh Foundation Team &bull; Giving Wings to Kindness</p>" +
                "</div>";

        sendEmail(toEmail, "Verify Your Email Address - NayePankh Foundation", html);
    }

    @Async
    @Override
    public void sendWelcomeEmail(String toEmail, String name) {
        log.info("Preparing Welcome email to {} (Thread: {})", toEmail, Thread.currentThread().getName());

        if (devMode) {
            log.warn("Dev mode ON — skipping real email for {}", toEmail);
            return;
        }

        String html = "<div style=\"font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;" +
                " border: 1px solid #e2e8f0; border-radius: 12px; background-color: #faf6ee; color: #1c1c1c;\">" +
                "  <h2 style=\"color: #1f3a2e; margin-bottom: 20px;\">Onboarding Complete! 🎉</h2>" +
                "  <p style=\"font-size: 16px; line-height: 1.5;\">Dear " + name + ",</p>" +
                "  <p style=\"font-size: 16px; line-height: 1.5;\">We are thrilled to welcome you to the <strong>NayePankh Foundation</strong> family! 🌟</p>" +
                "  <p style=\"font-size: 16px; line-height: 1.5;\">Your email verification was successful. Our coordinators will review your profile and reach out shortly.</p>" +
                "  <p style=\"font-size: 16px; color: #3f6f52; font-weight: bold;\">Together, let's give wings to kindness! 💚</p>" +
                "  <hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;\" />" +
                "  <p style=\"font-size: 14px; color: #718096; text-align: center;\">NayePankh Foundation Team &bull; Giving Wings to Kindness</p>" +
                "</div>";

        sendEmail(toEmail, "Welcome to NayePankh Foundation! 🌟", html);
    }

    private void sendEmail(String toEmail, String subject, String htmlContent) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            headers.set("User-Agent", "NayePankh-Backend/1.0");

            Map<String, Object> body = Map.of(
                    "from", "NayePankh Foundation <" + fromEmail + ">",
                    "to", new String[]{toEmail},
                    "subject", subject,
                    "html", htmlContent
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            String response = restTemplate.postForObject(RESEND_API_URL, request, String.class);
            log.info("Email sent successfully to {}. Resend response: {}", toEmail, response);

        } catch (Exception e) {
            log.error("Failed to send email to {} via Resend API. Error: {}", toEmail, e.getMessage(), e);
        }
    }
}
