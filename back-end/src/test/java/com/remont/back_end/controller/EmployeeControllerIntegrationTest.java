package com.remont.back_end.controller;

import com.jayway.jsonpath.JsonPath;
import com.remont.back_end.model.Employee;
import com.remont.back_end.model.User;
import com.remont.back_end.repository.EmployeeRepository;
import com.remont.back_end.repository.UserRepository;
import com.remont.back_end.security.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

/**
 * RF018: Testes de integracao e regressao do CRUD de funcionarios
 * e regras de negocio sobre o banco inicializado pelo data.sql.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class EmployeeControllerIntegrationTest {

    private static final String EMPLOYEE_EMAIL = "maria@remont.com";
    private static final String ADMIN_EMAIL = "admin@remont.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String employeeToken;
    private String adminToken;

    @BeforeEach
    void issueTokens() {
        employeeToken = tokenFor(EMPLOYEE_EMAIL);
        adminToken = tokenFor(ADMIN_EMAIL);
    }

    @Test
    void listAllEmployeesReturnsInitialActiveEmployees() throws Exception {
        mockMvc.perform(get("/api/employees")
                        .header("Authorization", bearer(employeeToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("Admin")))
                .andExpect(jsonPath("$[*].name", hasItem("Maria")))
                .andExpect(jsonPath("$[*].name", hasItem("Mário")));
    }

    @Test
    void getEmployeeByIdReturnsExistingAnd404WhenNotFound() throws Exception {
        mockMvc.perform(get("/api/employees/2")
                        .header("Authorization", bearer(employeeToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.name").value("Maria"))
                .andExpect(jsonPath("$.email").value("maria@remont.com"))
                .andExpect(jsonPath("$.cpf").value("50060070080"))
                .andExpect(jsonPath("$.active").value(true));

        mockMvc.perform(get("/api/employees/99999")
                        .header("Authorization", bearer(employeeToken)))
                .andExpect(status().isNotFound())
                .andExpect(content().string(""));
    }

    @Test
    void createEmployeeEncodesPasswordWithSha256SaltAndUpdatesEndToEnd() throws Exception {
        String createBody = """
                {
                    "name": "Carlos Eduardo",
                    "email": "carlos.eduardo@remont.com",
                    "cpf": "12345678909",
                    "phone": "41988881234",
                    "birthDate": "1992-03-15",
                    "wage": 4200.00,
                    "password": "senhaSegura123",
                    "active": true
                }
                """;

        String createdJson = mockMvc.perform(post("/api/employees")
                        .header("Authorization", bearer(employeeToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Carlos Eduardo"))
                .andExpect(jsonPath("$.email").value("carlos.eduardo@remont.com"))
                .andExpect(jsonPath("$.cpf").value("12345678909"))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Number createdId = JsonPath.read(createdJson, "$.id");
        Employee persisted = employeeRepository.findById(createdId.longValue()).orElseThrow();
        assertThat(persisted.getPassword()).isNotEqualTo("senhaSegura123");
        assertThat(persisted.getPassword()).contains("$");
        assertThat(passwordEncoder.matches("senhaSegura123", persisted.getPassword())).isTrue();

        String updateBody = """
                {
                    "name": "Carlos Eduardo Silva",
                    "email": "carlos.eduardo@remont.com",
                    "cpf": "12345678909",
                    "phone": "41988889999",
                    "birthDate": "1992-03-15",
                    "wage": 4800.50,
                    "active": true
                }
                """;

        mockMvc.perform(put("/api/employees/" + createdId)
                        .header("Authorization", bearer(employeeToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdId))
                .andExpect(jsonPath("$.name").value("Carlos Eduardo Silva"))
                .andExpect(jsonPath("$.phone").value("41988889999"))
                .andExpect(jsonPath("$.wage").value(4800.50));
    }

    @Test
    void createEmployeeBlocksDuplicateEmailAndCpf() {
        Employee maria = employeeRepository.findById(2L).orElseThrow();
        maria.setCpf("52998224725");
        employeeRepository.saveAndFlush(maria);
        String duplicateEmailBody = """
                {
                    "name": "Outro Admin",
                    "email": "admin@remont.com",
                    "cpf": "11144477735",
                    "phone": "41977778888",
                    "birthDate": "1990-01-01",
                    "wage": 3000.00,
                    "password": "senha",
                    "active": true
                }
                """;

        assertThatThrownBy(() -> mockMvc.perform(post("/api/employees")
                        .header("Authorization", bearer(employeeToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(duplicateEmailBody)))
                .hasRootCauseInstanceOf(RuntimeException.class)
                .hasRootCauseMessage("Erro: Este e-mail já está em uso!");

        String duplicateCpfBody = """
                {
                    "name": "Outra Maria",
                    "email": "outra.maria@remont.com",
                    "cpf": "52998224725",
                    "phone": "41977778888",
                    "birthDate": "1995-05-20",
                    "wage": 3500.00,
                    "password": "senha",
                    "active": true
                }
                """;

        assertThatThrownBy(() -> mockMvc.perform(post("/api/employees")
                        .header("Authorization", bearer(employeeToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(duplicateCpfBody)))
                .hasRootCauseInstanceOf(RuntimeException.class)
                .hasRootCauseMessage("Erro: CPF já está em uso por outro usuário!");
    }

    @Test
    void logicalDeletionMarksEmployeeInactiveAndHidesFromActiveList() throws Exception {
        mockMvc.perform(delete("/api/employees/3")
                        .header("Authorization", bearer(employeeToken)))
                .andExpect(status().isNoContent());

        Employee mario = employeeRepository.findById(3L).orElseThrow();
        assertThat(mario.isActive()).isFalse();

        mockMvc.perform(get("/api/employees")
                        .header("Authorization", bearer(employeeToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", not(hasItem("Mário"))));
    }

    @Test
    void deleteEmployeeBlocksSelfRemovalAndLastActiveEmployeeRemoval() throws Exception {
        assertThatThrownBy(() -> mockMvc.perform(delete("/api/employees/2")
                        .header("Authorization", bearer(employeeToken))))
                .hasRootCauseInstanceOf(IllegalStateException.class)
                .hasRootCauseMessage("Ação negada: O funcionário não pode remover a si mesmo.");

        assertThat(employeeRepository.findById(2L).orElseThrow().isActive()).isTrue();

        // Desativa Mário (id 3) e Maria (id 2, pelo Admin) deixando apenas Admin (id 1) ativo
        mockMvc.perform(delete("/api/employees/3")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete("/api/employees/2")
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());

        assertThat(employeeRepository.countByActiveTrue()).isEqualTo(1L);

        // Tentar remover um funcionário inativo quando há apenas 1 ativo no sistema é bloqueado
        assertThatThrownBy(() -> mockMvc.perform(delete("/api/employees/3")
                        .header("Authorization", bearer(adminToken))))
                .hasRootCauseInstanceOf(IllegalStateException.class)
                .hasRootCauseMessage("Ação negada: Existe apenas um funcionário ativo no sistema. Cadastre outro antes de remover este.");
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
