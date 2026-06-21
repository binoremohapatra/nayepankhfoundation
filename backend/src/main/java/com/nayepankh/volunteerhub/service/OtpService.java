package com.nayepankh.volunteerhub.service;

public interface OtpService {
    String generateOtp(String email);
    void verifyOtp(String email, String code);
    void clearOtp(String email);
}
