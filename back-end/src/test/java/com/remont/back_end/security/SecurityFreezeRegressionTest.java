package com.remont.back_end.security;

import com.remont.back_end.model.User;
import com.remont.back_end.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

/**
 * Congelamento de 05/11: a fronteira de segurança e o tempo das listagens
 * principais não podem regredir. Relatórios continuam só de funcionário.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SecurityFreezeRegressionTest {

    private static final Duration BASIC_BOUND = Duration.ofSeconds(5);
    private static final String CLIENT_EMAIL = "joao@gmail.com";
    private static final String EMPLOYEE_EMAIL = "maria@remont.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserRepository userRepository;

    private String clientToken;
    private String employeeToken;

    @BeforeEach
    void issueTokens() {
        clientToken = tokenFor(CLIENT_EMAIL);
        employeeToken = tokenFor(EMPLOYEE_EMAIL);
    }

    @Test
    void anonymousCannotOpenReports() throws Exception {
        mockMvc.perform(get("/api/reports/category"))
                .andExpect(status().isForbidden())
                .andExpect(content().string(""));
    }

    @Test
    void clientCannotOpenReports() throws Exception {
        mockMvc.perform(get("/api/reports/category")
                        .header("Authorization", bearer(clientToken)))
                .andExpect(status().isForbidden())
                .andExpect(content().string(""));
    }

    @Test
    void employeeCanOpenCategoryReport() throws Exception {
        mockMvc.perform(get("/api/reports/category")
                        .header("Authorization", bearer(employeeToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void categoryListStaysWithinBasicBound() {
        assertTimeoutPreemptively(BASIC_BOUND, () ->
                mockMvc.perform(get("/api/categories")
                                .header("Authorization", bearer(clientToken)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$").isArray()));
    }

    @Test
    void employeeReportStaysWithinBasicBound() {
        assertTimeoutPreemptively(BASIC_BOUND, () ->
                mockMvc.perform(get("/api/reports/date")
                                .header("Authorization", bearer(employeeToken)))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$").isArray()));
    }

    private String tokenFor(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Usuário de teste ausente: " + email));
        return tokenService.generateToken(user);
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
