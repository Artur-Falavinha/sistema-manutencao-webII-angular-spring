package com.remont.back_end.security;

import com.remont.back_end.model.User;
import com.remont.back_end.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ProfileAuthorizationTest {

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
    void anonymousIsRejectedFromEmployeeRequests() throws Exception {
        mockMvc.perform(get("/api/requests/employee"))
                .andExpect(status().isForbidden());
    }

    @Test
    void clientCannotOpenEmployeeRequests() throws Exception {
        mockMvc.perform(get("/api/requests/employee")
                        .header("Authorization", bearer(clientToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void employeeCannotOpenClientRequests() throws Exception {
        mockMvc.perform(get("/api/requests/client")
                        .header("Authorization", bearer(employeeToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void employeeCannotCreateClientRequest() throws Exception {
        mockMvc.perform(post("/api/requests")
                        .header("Authorization", bearer(employeeToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"equipmentName\":\"Notebook\",\"defectDescription\":\"Nao liga\",\"categoryId\":1}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void clientCannotCreateCategory() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .header("Authorization", bearer(clientToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void clientCanListOwnRequests() throws Exception {
        mockMvc.perform(get("/api/requests/client")
                        .header("Authorization", bearer(clientToken)))
                .andExpect(status().isOk());
    }

    @Test
    void employeeCanListRequests() throws Exception {
        mockMvc.perform(get("/api/requests/employee")
                        .header("Authorization", bearer(employeeToken)))
                .andExpect(status().isOk());
    }

    @Test
    void authenticatedClientCanReadCategories() throws Exception {
        mockMvc.perform(get("/api/categories")
                        .header("Authorization", bearer(clientToken)))
                .andExpect(status().isOk());
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
