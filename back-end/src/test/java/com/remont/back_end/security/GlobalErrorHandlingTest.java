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

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GlobalErrorHandlingTest {

    private static final String CLIENT_EMAIL = "joao@gmail.com";
    private static final String BROWSER_ORIGIN = "http://localhost:4200";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserRepository userRepository;

    private String clientToken;

    @BeforeEach
    void issueToken() {
        User client = userRepository.findByEmail(CLIENT_EMAIL)
                .orElseThrow(() -> new IllegalStateException("Usuário de teste ausente: " + CLIENT_EMAIL));
        clientToken = tokenService.generateToken(client);
    }

    @Test
    void anonymousForbiddenIncludesMessage() throws Exception {
        mockMvc.perform(get("/api/requests/employee"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Autenticação necessária."));
    }

    @Test
    void wrongProfileForbiddenIncludesMessage() throws Exception {
        mockMvc.perform(get("/api/requests/employee")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Você não tem permissão para esta operação."));
    }

    @Test
    void missingCategoryIncludesNotFoundMessage() throws Exception {
        mockMvc.perform(get("/api/categories/99999")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Categoria não encontrada")));
    }

    @Test
    void invalidLoginIncludesValidationMessage() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].defaultMessage", hasItem("O e-mail é obrigatório")));
    }

    @Test
    void browserOriginIsAccepted() throws Exception {
        mockMvc.perform(get("/api/categories")
                        .header("Origin", BROWSER_ORIGIN)
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", BROWSER_ORIGIN));
    }
}
