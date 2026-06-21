package com.nayepankh.volunteerhub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nayepankh.volunteerhub.dto.GenerateOtpRequest;
import com.nayepankh.volunteerhub.dto.RegisterRequest;
import com.nayepankh.volunteerhub.entity.Volunteer;
import com.nayepankh.volunteerhub.service.VolunteerService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VolunteerController.class)
public class VolunteerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VolunteerService volunteerService;

    @Test
    void testGenerateOtpSuccess() throws Exception {
        GenerateOtpRequest request = new GenerateOtpRequest("newvol@example.com");
        doNothing().when(volunteerService).generateOtp(request.getEmail());

        mockMvc.perform(post("/api/volunteers/generate-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Verification OTP has been sent to your email."));
    }

    @Test
    void testGenerateOtpInvalidEmail() throws Exception {
        GenerateOtpRequest request = new GenerateOtpRequest("invalidemail");

        mockMvc.perform(post("/api/volunteers/generate-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity()) // 422
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.data.email").value("Invalid email format"));
    }

    @Test
    void testRegisterSuccess() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Jane Doe", "jane@example.com", "9876543210", "Teaching", "123456", "Weekends", "Excited!"
        );

        Volunteer mockSaved = new Volunteer(
                1L, "Jane Doe", "jane@example.com", "9876543210", "Teaching", "Weekends", "Excited!", "Pending", true, null
        );

        when(volunteerService.register(any(RegisterRequest.class))).thenReturn(mockSaved);

        mockMvc.perform(post("/api/volunteers/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated()) // 201
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.emailVerified").value(true));
    }

    @Test
    void testRegisterValidationFailure() throws Exception {
        // Leaving name empty and specifying invalid OTP pattern
        RegisterRequest request = new RegisterRequest(
                "", "jane@example.com", "9876543210", "Teaching", "123", "Weekends", "Excited!"
        );

        mockMvc.perform(post("/api/volunteers/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity()) // 422
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.name").value("Name is required"))
                .andExpect(jsonPath("$.data.otp").value("OTP must be a 6-digit number"));
    }
}
