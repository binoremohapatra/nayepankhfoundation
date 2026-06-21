package com.nayepankh.volunteerhub.service;

import com.nayepankh.volunteerhub.entity.Volunteer;
import com.nayepankh.volunteerhub.dto.RegisterRequest;
import com.nayepankh.volunteerhub.exception.EmailAlreadyRegisteredException;
import com.nayepankh.volunteerhub.repository.VolunteerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class VolunteerServiceImpl implements VolunteerService {

    private static final Logger log = LoggerFactory.getLogger(VolunteerServiceImpl.class);

    @Autowired
    private VolunteerRepository volunteerRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    @Override
    public Volunteer saveVolunteer(Volunteer volunteer) {
        if (volunteer.getStatus() == null || volunteer.getStatus().isBlank()) {
            volunteer.setStatus("Pending");
        }
        return volunteerRepository.save(volunteer);
    }

    @Override
    public List<Volunteer> getAllVolunteers() {
        return volunteerRepository.findAll();
    }

    @Override
    public Volunteer getVolunteerById(Long id) {
        return volunteerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Volunteer not found with id: " + id));
    }

    @Override
    public Volunteer updateVolunteerStatus(Long id, String newStatus) {
        Volunteer volunteer = getVolunteerById(id);
        volunteer.setStatus(newStatus);
        return volunteerRepository.save(volunteer);
    }

    @Override
    public void deleteVolunteer(Long id) {
        if (!volunteerRepository.existsById(id)) {
            throw new RuntimeException("Volunteer not found with id: " + id);
        }
        volunteerRepository.deleteById(id);
    }

    @Override
    public long getTotalApplicationsCount() {
        return volunteerRepository.count();
    }

    @Override
    public long getActiveVolunteersCount() {
        return volunteerRepository.countByStatus("Approved");
    }

    @Override
    public void generateOtp(String email) {
        log.info("Request to generate OTP for email: {}", email);
        
        // Prevent spamming fully registered user
        Optional<Volunteer> existing = volunteerRepository.findByEmail(email);
        if (existing.isPresent() && existing.get().isEmailVerified()) {
            log.warn("Email {} is already registered and verified", email);
            throw new EmailAlreadyRegisteredException("This email address is already verified and registered. Please login.");
        }

        // Generate OTP (Rate limits & TTLs managed within OtpService)
        String otp = otpService.generateOtp(email);

        // Async email delivery
        emailService.sendOtpEmail(email, otp);
    }

    @Override
    @Transactional
    public Volunteer register(RegisterRequest request) {
        log.info("Request to register volunteer with email: {}", request.getEmail());

        // 1. Verify OTP first (Throws InvalidOtpException/OtpExpiredException on failure)
        otpService.verifyOtp(request.getEmail(), request.getOtp());

        // 2. Prevent duplicate verified registration
        Optional<Volunteer> existingOpt = volunteerRepository.findByEmail(request.getEmail());
        if (existingOpt.isPresent() && existingOpt.get().isEmailVerified()) {
            log.warn("Email {} is already registered and verified during final register check", request.getEmail());
            throw new EmailAlreadyRegisteredException("This email address is already verified and registered. Please login.");
        }

        Volunteer volunteer;
        if (existingOpt.isPresent()) {
            // Re-use unverified entry if exists
            volunteer = existingOpt.get();
            log.info("Found existing unverified volunteer with ID: {}. Re-using record.", volunteer.getId());
        } else {
            volunteer = new Volunteer();
        }

        // 3. Set/Update details and verify email status
        volunteer.setName(request.getName());
        volunteer.setEmail(request.getEmail());
        volunteer.setPhone(request.getPhone());
        volunteer.setSkills(request.getSkills());
        volunteer.setAvailability(request.getAvailability() != null ? request.getAvailability() : "Weekends");
        volunteer.setComments(request.getComments());
        volunteer.setStatus("Pending");
        volunteer.setEmailVerified(true);

        Volunteer savedVolunteer = volunteerRepository.save(volunteer);
        log.info("Volunteer ID: {} registered successfully", savedVolunteer.getId());

        // 4. Send Welcome email asynchronously
        emailService.sendWelcomeEmail(savedVolunteer.getEmail(), savedVolunteer.getName());

        return savedVolunteer;
    }
}
