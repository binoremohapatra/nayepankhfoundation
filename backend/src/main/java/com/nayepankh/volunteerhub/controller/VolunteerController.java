package com.nayepankh.volunteerhub.controller;

import com.nayepankh.volunteerhub.dto.ApiResponse;
import com.nayepankh.volunteerhub.dto.GenerateOtpRequest;
import com.nayepankh.volunteerhub.dto.RegisterRequest;
import com.nayepankh.volunteerhub.entity.Volunteer;
import com.nayepankh.volunteerhub.service.VolunteerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/volunteers")
public class VolunteerController {

    @Autowired
    private VolunteerService volunteerService;

    @PostMapping("/generate-otp")
    public ResponseEntity<ApiResponse<Void>> generateOtp(@Valid @RequestBody GenerateOtpRequest request) {
        volunteerService.generateOtp(request.getEmail());
        ApiResponse<Void> response = new ApiResponse<>(true, "Verification OTP has been sent to your email.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Volunteer>> register(@Valid @RequestBody RegisterRequest request) {
        Volunteer volunteer = volunteerService.register(request);
        ApiResponse<Volunteer> response = new ApiResponse<>(true, "Volunteer onboarding completed successfully.", volunteer);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Direct save endpoint (kept for legacy/backward compatibility)
    @PostMapping
    public ResponseEntity<ApiResponse<Volunteer>> registerVolunteer(@RequestBody Volunteer volunteer) {
        Volunteer saved = volunteerService.saveVolunteer(volunteer);
        ApiResponse<Volunteer> response = new ApiResponse<>(true, "Volunteer created directly.", saved);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Volunteer>>> getAllVolunteers() {
        List<Volunteer> list = volunteerService.getAllVolunteers();
        ApiResponse<List<Volunteer>> response = new ApiResponse<>(true, "Volunteers fetched successfully.", list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Volunteer>> getVolunteerById(@PathVariable Long id) {
        Volunteer volunteer = volunteerService.getVolunteerById(id);
        ApiResponse<Volunteer> response = new ApiResponse<>(true, "Volunteer found.", volunteer);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Volunteer>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        Volunteer updated = volunteerService.updateVolunteerStatus(id, status);
        ApiResponse<Volunteer> response = new ApiResponse<>(true, "Volunteer status updated successfully.", updated);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVolunteer(@PathVariable Long id) {
        volunteerService.deleteVolunteer(id);
        ApiResponse<Void> response = new ApiResponse<>(true, "Volunteer deleted successfully.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getMetrics() {
        Map<String, Long> metrics = new HashMap<>();
        metrics.put("totalApplications", volunteerService.getTotalApplicationsCount());
        metrics.put("activeVolunteers", volunteerService.getActiveVolunteersCount());
        ApiResponse<Map<String, Long>> response = new ApiResponse<>(true, "Metrics retrieved successfully.", metrics);
        return ResponseEntity.ok(response);
    }
}
