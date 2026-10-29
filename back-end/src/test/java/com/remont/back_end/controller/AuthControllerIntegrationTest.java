package com.remont.back_end.controller;

import com.jayway.jsonpath.JsonPath;
import com.remont.back_end.service.EmailService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RF001-RF002: integracao de login e autocadastro pela API real.
 * Usa os usuarios do data.sql (cliente joao@gmail.com / 1234 e funcionaria maria@remont.com / 4321).
 * O envio de e-mail e substituido por um mock e cada teste e desfeito no fim (@Transactional).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerIntegrationTest {

    private static final String CLIENT_EMAIL = "joao@gmail.com";
    private static final String CLIENT_PASSWORD = "1234";
    private static final String EMPLOYEE_EMAIL = "maria@remont.com";
    private static final String EMPLOYEE_PASSWORD = "4321";

    private static final String VALID_CPF_A = "52998224725";
    private static final String VALID_CPF_B = "11144477735";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EmailService emailService;

    // ---------- login ----------

    @Test
    void employeeLoginReturnsTokenAndEmployeeRole() throws Exception {
        login(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.userRole").value("ROLE_EMPLOYEE"));
    }

    @Test
    void clientLoginReturnsTokenAndClientRole() throws Exception {
        login(CLIENT_EMAIL, CLIENT_PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.userRole").value("ROLE_CLIENT"));
    }

    @Test
    void wrongPasswordIsRejectedWith401() throws Exception {
        login(CLIENT_EMAIL, "senha-errada")
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unknownEmailIsRejectedWith401() throws Exception {
        login("ninguem@example.com", "1234")
                .andExpect(status().isUnauthorized());
    }

    @Test
    void clientTokenOpensOnlyClientRoutes() throws Exception {
        String token = tokenFor(CLIENT_EMAIL, CLIENT_PASSWORD);

        mockMvc.perform(get("/api/requests/client").header("Authorization", bearer(token)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/requests/employee").header("Authorization", bearer(token)))
                .andExpect(status().isForbidden());
    }

    @Test
    void employeeTokenOpensOnlyEmployeeRoutes() throws Exception {
        String token = tokenFor(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);

        mockMvc.perform(get("/api/requests/employee").header("Authorization", bearer(token)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/requests/client").header("Authorization", bearer(token)))
                .andExpect(status().isForbidden());
    }

    // ---------- cadastro ----------

    @Test
    void registerCreatesClientSendsPasswordByEmailAndAllowsLogin() throws Exception {
        String email = "novo.cliente@example.com";

        register(VALID_CPF_A, email)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email));

        ArgumentCaptor<String> password = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendRandomPasswordEmail(eq(email), password.capture());
        assertThat(password.getValue()).matches("\\d{4}");

        login(email, password.getValue())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userRole").value("ROLE_CLIENT"));
    }

    @Test
    void registerRejectsDuplicateCpf() throws Exception {
        register(VALID_CPF_A, "primeiro@example.com").andExpect(status().isCreated());

        register(VALID_CPF_A, "segundo@example.com").andExpect(status().isBadRequest());

        verify(emailService, times(1)).sendRandomPasswordEmail(anyString(), anyString());
    }

    @Test
    void registerRejectsDuplicateEmailOfAnotherNewClient() throws Exception {
        register(VALID_CPF_A, "mesmo@example.com").andExpect(status().isCreated());

        register(VALID_CPF_B, "mesmo@example.com").andExpect(status().isBadRequest());

        verify(emailService, times(1)).sendRandomPasswordEmail(anyString(), anyString());
    }

    @Test
    void registerRejectsEmailOfExistingUser() throws Exception {
        register(VALID_CPF_B, CLIENT_EMAIL).andExpect(status().isBadRequest());
        register(VALID_CPF_B, EMPLOYEE_EMAIL).andExpect(status().isBadRequest());

        verify(emailService, never()).sendRandomPasswordEmail(anyString(), anyString());
    }

    @Test
    void registerRejectsInvalidCpf() throws Exception {
        register("11111111111", "cpf.invalido@example.com").andExpect(status().isBadRequest());

        verify(emailService, never()).sendRandomPasswordEmail(anyString(), anyString());
    }

    // ---------- apoio ----------

    private ResultActions login(String email, String password) throws Exception {
        String body = """
                {"email":"%s","password":"%s"}
                """.formatted(email, password);
        return mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private ResultActions register(String cpf, String email) throws Exception {
        String body = """
                {
                  "cpf": "%s",
                  "name": "Cliente de Teste",
                  "email": "%s",
                  "phoneNumber": "41999999999",
                  "zipCode": "80010000",
                  "street": "Rua de Teste",
                  "number": "100",
                  "complement": "Apto 1",
                  "neighborhood": "Centro",
                  "city": "Curitiba",
                  "state": "PR"
                }
                """.formatted(cpf, email);
        return mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private String tokenFor(String email, String password) throws Exception {
        String json = login(email, password)
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(json, "$.token");
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
