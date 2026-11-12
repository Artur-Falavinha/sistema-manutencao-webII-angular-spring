package com.remont.back_end.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.remont.back_end.service.EmailService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

/**
 * RF001-RF002: matriz de regressao de login e autocadastro pela API real.
 * Login: todos os usuarios de demonstracao do data.sql e as entradas invalidas.
 * Cadastro: cada campo obrigatorio, formatos invalidos e o campo opcional.
 * Cada teste e desfeito no fim (@Transactional) e o envio de e-mail e simulado.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthRegressionMatrixTest {

    private static final String VALID_CPF = "52998224725";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EmailService emailService;

    // ---------- RF001: login ----------

    @ParameterizedTest(name = "{0} entra como {2}")
    @CsvSource({
            "maria@remont.com,4321,ROLE_EMPLOYEE",
            "mario@remont.com,4321,ROLE_EMPLOYEE",
            "joao@gmail.com,1234,ROLE_CLIENT",
            "jose@gmail.com,1234,ROLE_CLIENT",
            "joana@gmail.com,1234,ROLE_CLIENT",
            "joaquina@gmail.com,1234,ROLE_CLIENT"
    })
    void seededUsersLoginWithTheirRole(String email, String password, String role) throws Exception {
        postJson("/api/auth/login", Map.of("email", email, "password", password))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.userName").isNotEmpty())
                .andExpect(jsonPath("$.userRole").value(role));
    }

    @Test
    void loginWithMissingOrMalformedFieldsIsRejectedWith400() throws Exception {
        List<Map<String, String>> invalidBodies = List.of(
                Map.of(),
                Map.of("email", "joao@gmail.com"),
                Map.of("password", "1234"),
                Map.of("email", "", "password", "1234"),
                Map.of("email", "joao@gmail.com", "password", ""),
                Map.of("email", "nao-e-um-email", "password", "1234"));

        for (Map<String, String> body : invalidBodies) {
            postJson("/api/auth/login", body)
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string(""));
        }
    }

    @Test
    void anonymousCannotOpenProtectedRoutes() throws Exception {
        mockMvc.perform(get("/api/requests/client")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/requests/employee")).andExpect(status().isForbidden());
    }

    // ---------- RF002: autocadastro ----------

    @ParameterizedTest(name = "campo obrigatorio vazio: {0}")
    @ValueSource(strings = {"cpf", "name", "email", "phoneNumber", "zipCode",
            "street", "number", "neighborhood", "city", "state"})
    void registerRejectsBlankRequiredField(String field) throws Exception {
        Map<String, Object> body = validBody("campo.vazio@example.com");
        body.put(field, "");

        postJson("/api/auth/register", body)
                .andExpect(status().isBadRequest())
                .andExpect(content().string(""));

        verify(emailService, never()).sendRandomPasswordEmail(anyString(), anyString());
    }

    @ParameterizedTest(name = "valor invalido: {0} = {1}")
    @CsvSource({
            "cpf,123",
            "cpf,11111111111",
            "email,sem-arroba",
            "zipCode,1234567",
            "zipCode,123456789",
            "state,P",
            "state,PRR"
    })
    void registerRejectsMalformedValue(String field, String value) throws Exception {
        Map<String, Object> body = validBody("valor.invalido@example.com");
        body.put(field, value);

        postJson("/api/auth/register", body)
                .andExpect(status().isBadRequest())
                .andExpect(content().string(""));

        verify(emailService, never()).sendRandomPasswordEmail(anyString(), anyString());
    }

    @Test
    void registerWithoutOptionalComplementIsCreated() throws Exception {
        Map<String, Object> body = validBody("sem.complemento@example.com");
        body.remove("complement");

        postJson("/api/auth/register", body)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("sem.complemento@example.com"));
    }

    @Test
    void newClientTokenOpensOnlyClientRoutes() throws Exception {
        String email = "jornada.nova@example.com";
        postJson("/api/auth/register", validBody(email)).andExpect(status().isCreated());

        ArgumentCaptor<String> password = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendRandomPasswordEmail(eq(email), password.capture());

        String json = postJson("/api/auth/login", Map.of("email", email, "password", password.getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userRole").value("ROLE_CLIENT"))
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(json, "$.token");

        mockMvc.perform(get("/api/requests/client").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/requests/employee").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // ---------- apoio ----------

    private Map<String, Object> validBody(String email) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cpf", VALID_CPF);
        body.put("name", "Cliente de Teste");
        body.put("email", email);
        body.put("phoneNumber", "41999999999");
        body.put("zipCode", "80010000");
        body.put("street", "Rua de Teste");
        body.put("number", "100");
        body.put("complement", "Apto 1");
        body.put("neighborhood", "Centro");
        body.put("city", "Curitiba");
        body.put("state", "PR");
        return new HashMap<>(body);
    }

    private ResultActions postJson(String url, Map<String, ?> body) throws Exception {
        return mockMvc.perform(post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }
}
