package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.exception.InvalidOtpException;
import com.nayepankh.volunteerhub.exception.OtpExpiredException;
import com.nayepankh.volunteerhub.exception.OtpRateLimitException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpServiceImpl implements OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpServiceImpl.class);
    private static final int OTP_TTL_MINUTES = 5;
    private static final int MAX_VERIFY_ATTEMPTS = 3;
    private static final int MAX_GENERATE_REQUESTS = 3;
    private static final int GENERATE_WINDOW_MINUTES = 10;

    @Value("${app.mail.dev-mode:false}")
    private boolean devMode;

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public static class OtpEntry {
        private String otp;
        private LocalDateTime expiryTime;
        private int attemptCount;
        private int requestCount;
        private LocalDateTime firstRequestAt;

        public OtpEntry(String otp, LocalDateTime expiryTime, int requestCount, LocalDateTime firstRequestAt) {
            this.otp = otp;
            this.expiryTime = expiryTime;
            this.attemptCount = 0;
            this.requestCount = requestCount;
            this.firstRequestAt = firstRequestAt;
        }

        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
        public LocalDateTime getExpiryTime() { return expiryTime; }
        public void setExpiryTime(LocalDateTime expiryTime) { this.expiryTime = expiryTime; }
        public int getAttemptCount() { return attemptCount; }
        public void incrementAttemptCount() { this.attemptCount++; }
        public int getRequestCount() { return requestCount; }
        public void setRequestCount(int requestCount) { this.requestCount = requestCount; }
        public void incrementRequestCount() { this.requestCount++; }
        public LocalDateTime getFirstRequestAt() { return firstRequestAt; }
        public void setFirstRequestAt(LocalDateTime firstRequestAt) { this.firstRequestAt = firstRequestAt; }
    }

    @Override
    public String generateOtp(String email) {
        LocalDateTime now = LocalDateTime.now();
        OtpEntry entry = otpStore.get(email);

        if (entry != null) {
            // Check rate limits: max 3 requests per 10 minutes
            if (entry.getFirstRequestAt().plusMinutes(GENERATE_WINDOW_MINUTES).isBefore(now)) {
                // Window passed, reset rate limit variables
                entry.setRequestCount(1);
                entry.setFirstRequestAt(now);
            } else {
                if (entry.getRequestCount() >= MAX_GENERATE_REQUESTS) {
                    log.warn("Rate limit exceeded for email: {}", email);
                    throw new OtpRateLimitException("Too many OTP requests. Please wait a few minutes before trying again.");
                }
                entry.incrementRequestCount();
            }
            // Update OTP code and expiry
            String newOtp = generate6DigitCode();
            entry.setOtp(newOtp);
            entry.setExpiryTime(now.plusMinutes(OTP_TTL_MINUTES));
            // Reset attempts on new generation
            entry.attemptCount = 0;
        } else {
            // New entry
            String otp = generate6DigitCode();
            entry = new OtpEntry(otp, now.plusMinutes(OTP_TTL_MINUTES), 1, now);
            otpStore.put(email, entry);
        }

        if (devMode) {
            log.info("\n" +
                    "==================================================\n" +
                    "               NAYEPANKH OTP GENERATION           \n" +
                    "   EMAIL: {}\n" +
                    "   OTP CODE: {}\n" +
                    "==================================================", email, entry.getOtp());
        }

        return entry.getOtp();
    }

    @Override
    public void verifyOtp(String email, String code) {
        OtpEntry entry = otpStore.get(email);
        if (entry == null) {
            log.warn("Verification attempted but no OTP found for email: {}", email);
            throw new OtpExpiredException("OTP not found or expired. Please request a new one.");
        }

        if (entry.getExpiryTime().isBefore(LocalDateTime.now())) {
            log.warn("OTP expired for email: {}", email);
            otpStore.remove(email);
            throw new OtpExpiredException("OTP has expired. Please request a new one.");
        }

        if (entry.getAttemptCount() >= MAX_VERIFY_ATTEMPTS) {
            log.warn("Lockout due to too many verify attempts for email: {}", email);
            otpStore.remove(email);
            throw new InvalidOtpException("Too many invalid verification attempts. This OTP is locked. Please request a new one.");
        }

        if (!entry.getOtp().equals(code)) {
            entry.incrementAttemptCount();
            int remaining = MAX_VERIFY_ATTEMPTS - entry.getAttemptCount();
            log.warn("Incorrect OTP for email: {}. Remaining attempts: {}", email, remaining);
            if (remaining <= 0) {
                otpStore.remove(email);
                throw new InvalidOtpException("Too many invalid verification attempts. Please request a new OTP.");
            }
            throw new InvalidOtpException("Invalid OTP code. " + remaining + " attempts remaining.");
        }

        // OTP matched, remove the code (clear session)
        otpStore.remove(email);
        log.info("OTP verified successfully for email: {}", email);
    }

    @Override
    public void clearOtp(String email) {
        otpStore.remove(email);
    }

    private String generate6DigitCode() {
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    // Cron setup: runs clean up every 10 minutes
    @Scheduled(fixedRate = 600000)
    public void cleanExpiredOtps() {
        log.info("Starting scheduled cleanup of expired OTP entries...");
        LocalDateTime now = LocalDateTime.now();
        otpStore.entrySet().removeIf(entry -> entry.getValue().getExpiryTime().isBefore(now));
        log.info("Completed scheduled cleanup of expired OTP entries.");
    }
}
