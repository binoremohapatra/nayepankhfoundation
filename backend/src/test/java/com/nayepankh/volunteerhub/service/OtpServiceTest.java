package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.exception.InvalidOtpException;
import com.nayepankh.volunteerhub.exception.OtpExpiredException;
import com.nayepankh.volunteerhub.exception.OtpRateLimitException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

public class OtpServiceTest {

    private OtpServiceImpl otpService;

    @BeforeEach
    void setUp() {
        otpService = new OtpServiceImpl();
        ReflectionTestUtils.setField(otpService, "devMode", true);
    }

    @Test
    void testGenerateAndVerifySuccess() {
        String email = "test@example.com";
        String otp = otpService.generateOtp(email);
        
        assertNotNull(otp);
        assertEquals(6, otp.length());
        
        // Verification should succeed and remove the entry
        assertDoesNotThrow(() -> otpService.verifyOtp(email, otp));
        
        // Subsequent verification should fail because the entry was cleared
        assertThrows(OtpExpiredException.class, () -> otpService.verifyOtp(email, otp));
    }

    @Test
    void testVerifyExpiredOtp() {
        String email = "expire@example.com";
        String otp = otpService.generateOtp(email);
        
        // Manually adjust the expiry time to be in the past
        @SuppressWarnings("unchecked")
        java.util.Map<String, OtpServiceImpl.OtpEntry> otpStore = (java.util.Map<String, OtpServiceImpl.OtpEntry>) ReflectionTestUtils.getField(otpService, "otpStore");
        assertNotNull(otpStore);
        OtpServiceImpl.OtpEntry entry = otpStore.get(email);
        assertNotNull(entry);
        entry.setExpiryTime(LocalDateTime.now().minusSeconds(1));
        
        assertThrows(OtpExpiredException.class, () -> otpService.verifyOtp(email, otp));
    }

    @Test
    void testLockoutAfterMaxAttempts() {
        String email = "lockout@example.com";
        String otp = otpService.generateOtp(email);
        
        // Attempt 1: wrong OTP
        assertThrows(InvalidOtpException.class, () -> otpService.verifyOtp(email, "000000"));
        
        // Attempt 2: wrong OTP
        assertThrows(InvalidOtpException.class, () -> otpService.verifyOtp(email, "000000"));
        
        // Attempt 3: wrong OTP -> Lockout (removes entry, next is expired/locked)
        assertThrows(InvalidOtpException.class, () -> otpService.verifyOtp(email, "000000"));
        
        // Subsequent calls throw OtpExpiredException (since entry is deleted)
        assertThrows(OtpExpiredException.class, () -> otpService.verifyOtp(email, otp));
    }

    @Test
    void testRateLimitForGeneration() {
        String email = "rate@example.com";
        
        // 1st request
        assertDoesNotThrow(() -> otpService.generateOtp(email));
        // 2nd request
        assertDoesNotThrow(() -> otpService.generateOtp(email));
        // 3rd request
        assertDoesNotThrow(() -> otpService.generateOtp(email));
        
        // 4th request -> RateLimit
        assertThrows(OtpRateLimitException.class, () -> otpService.generateOtp(email));
    }
}
