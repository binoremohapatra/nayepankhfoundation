package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.entity.Volunteer;
import com.nayepankh.volunteerhub.dto.RegisterRequest;
import java.util.List;

public interface VolunteerService {
    Volunteer saveVolunteer(Volunteer volunteer);
    List<Volunteer> getAllVolunteers();
    Volunteer getVolunteerById(Long id);
    Volunteer updateVolunteerStatus(Long id, String newStatus);
    void deleteVolunteer(Long id);
    
    long getTotalApplicationsCount();
    long getActiveVolunteersCount();

    // OTP Onboarding operations
    void generateOtp(String email);
    Volunteer register(RegisterRequest request);
}
