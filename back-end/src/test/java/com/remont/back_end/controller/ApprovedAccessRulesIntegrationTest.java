package com.remont.back_end.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.remont.back_end.model.*;
import com.remont.back_end.repository.*;
import com.remont.back_end.security.TokenService;
import com.remont.back_end.service.EmailService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApprovedAccessRulesIntegrationTest {
    private static final String EMPLOYEE = """
            {"name":"Funcionário de teste","email":"teste@example.com","cpf":"52998224725",
             "phone":"41999999999","birthDate":"1990-01-01","wage":1000,"password":"1234","active":true}
            """;
    private static final String CLIENT = """
            {"name":"Cliente de teste","email":"cliente.teste@example.com","cpf":"52998224725",
             "phoneNumber":"41999999999","zipCode":"80010000","street":"Rua de teste","number":"10",
             "neighborhood":"Centro","city":"Curitiba","state":"PR"}
            """;

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper mapper;
    @Autowired private UserRepository users;
    @Autowired private EmployeeRepository employees;
    @Autowired private ClientRepository clients;
    @Autowired private CategoryEquipmentRepository categories;
    @Autowired private MaintenanceRequestRepository requests;
    @Autowired private RequestHistoryRepository history;
    @Autowired private TokenService tokens;
    @Autowired private PasswordEncoder passwords;
    @Autowired private EntityManager entityManager;
    @MockitoBean private EmailService emailService;

    @ParameterizedTest
    @ValueSource(longs = {2, 4})
    void genericBudgetAndMaintenanceControllersAreClosed(Long userId) throws Exception {
        String token = bearer(userId);
        long requestsBefore = requests.count();
        for (String path : List.of("/api/budgets", "/api/maintenance-records")) {
            for (HttpMethod method : List.of(HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.DELETE)) {
                String endpoint = method == HttpMethod.PUT || method == HttpMethod.DELETE ? path + "/1" : path;
                mvc.perform(request(method, endpoint).header("Authorization", token)
                                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                        .andExpect(status().isForbidden()).andExpect(content().string(""));
            }
            mvc.perform(get(path + "/1").header("Authorization", token)).andExpect(status().isForbidden());
        }
        mvc.perform(get("/api/budgets/by-request/1").header("Authorization", token)).andExpect(status().isForbidden());
        assertThat(requests.count()).isEqualTo(requestsBefore);
    }

    @ParameterizedTest
    @ValueSource(longs = {2, 4})
    void serviceCatalogHasOnlyEmployeeReads(Long userId) throws Exception {
        String token = bearer(userId);
        for (String path : List.of("/api/services", "/api/services/1")) {
            mvc.perform(get(path).header("Authorization", token))
                    .andExpect(userId == 2L ? status().isOk() : status().isForbidden());
        }
        mvc.perform(post("/api/services").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
        mvc.perform(put("/api/services/1").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
        mvc.perform(delete("/api/services/1").header("Authorization", token)).andExpect(status().isForbidden());
    }

    @Test
    void clientCannotUseEmployeeOrClientAdministration() throws Exception {
        for (String path : List.of("/api/employees", "/api/clients")) {
            String body = path.endsWith("employees") ? EMPLOYEE : CLIENT;
            for (HttpMethod method : List.of(HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.DELETE)) {
                String endpoint = method == HttpMethod.PUT || method == HttpMethod.DELETE ? path + "/2" : path;
                mvc.perform(request(method, endpoint).header("Authorization", bearer(4L))
                        .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
            }
            mvc.perform(get(path + "/2").header("Authorization", bearer(4L))).andExpect(status().isForbidden());
        }
    }

    @ParameterizedTest
    @ValueSource(longs = {2, 4})
    void deactivationPreservesAccountAndBlocksOldTokenAndLogin(Long id) throws Exception {
        User user = users.findById(id).orElseThrow();
        String oldToken = bearer(id);
        String email = user.getEmail();
        long requestsBefore = requests.count();
        long historyBefore = history.count();
        mvc.perform(delete((id == 2L ? "/api/employees/" : "/api/clients/") + id)
                .header("Authorization", bearer(1L))).andExpect(status().isNoContent());
        entityManager.flush();
        entityManager.clear();

        assertThat(users.existsById(id)).isTrue();
        assertThat(requests.count()).isEqualTo(requestsBefore);
        assertThat(history.count()).isEqualTo(historyBefore);
        mvc.perform(get("/api/categories").header("Authorization", oldToken)).andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(java.util.Map.of("email", email, "password", id == 2L ? "4321" : "1234"))))
                .andExpect(status().isUnauthorized());
        if (id == 4L) {
            assertThat(clients.findAllByActiveTrue()).extracting(Client::getId).doesNotContain(id);
            mvc.perform(get("/api/clients/4").header("Authorization", bearer(1L))).andExpect(status().isOk());
        }
    }

    @Test
    void employeeEditionPreservesActivityAndPassword() throws Exception {
        String hash = employees.findById(2L).orElseThrow().getPassword();
        ObjectNode body = (ObjectNode) mapper.readTree(EMPLOYEE);
        body.put("active", false);
        body.remove("password");
        mvc.perform(put("/api/employees/2").header("Authorization", bearer(1L))
                        .contentType(MediaType.APPLICATION_JSON).content(body.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.active").value(true));
        assertThat(employees.findById(2L).orElseThrow().getPassword()).isEqualTo(hash);

        Employee mario = employees.findById(3L).orElseThrow();
        mario.setActive(false);
        employees.saveAndFlush(mario);
        body.put("email", "inativo@example.com").put("cpf", "11144477735").put("active", true);
        mvc.perform(put("/api/employees/3").header("Authorization", bearer(1L))
                        .contentType(MediaType.APPLICATION_JSON).content(body.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void oldTokenCannotRemoveOwnAccountAfterEmailChange() throws Exception {
        String oldToken = bearer(2L);
        mvc.perform(put("/api/employees/2").header("Authorization", oldToken)
                .contentType(MediaType.APPLICATION_JSON).content(EMPLOYEE)).andExpect(status().isOk());
        assertThatThrownBy(() -> mvc.perform(delete("/api/employees/2").header("Authorization", oldToken)))
                .hasRootCauseInstanceOf(IllegalStateException.class);
        assertThat(employees.findById(2L).orElseThrow().isActive()).isTrue();
    }

    @ParameterizedTest
    @CsvSource({"name,   ", "email,invalido", "cpf,11111111111", "cpf,123", "phone,   ", "birthDate,2026-99-99", "wage,0"})
    void employeeFieldsAreValidatedOnCreateAndEdit(String field, String value) throws Exception {
        ObjectNode body = (ObjectNode) mapper.readTree(EMPLOYEE);
        body.put(field, value);
        long before = employees.count();
        mvc.perform(post("/api/employees").header("Authorization", bearer(1L))
                .contentType(MediaType.APPLICATION_JSON).content(body.toString())).andExpect(status().isBadRequest());
        mvc.perform(put("/api/employees/2").header("Authorization", bearer(1L))
                .contentType(MediaType.APPLICATION_JSON).content(body.toString())).andExpect(status().isBadRequest());
        assertThat(employees.count()).isEqualTo(before);
    }

    @Test
    void categoryRequiresNonBlankNameAndIcon() throws Exception {
        for (String body : List.of("{}", "{\"name\":\"   \",\"icon\":\"build\"}", "{\"name\":\"Teste\",\"icon\":\"   \"}")) {
            mvc.perform(post("/api/categories").header("Authorization", bearer(2L))
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
            mvc.perform(put("/api/categories/1").header("Authorization", bearer(2L))
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        }
        assertThat(categories.findById(1).orElseThrow().getName()).isEqualTo("Notebook");
    }

    @Test
    void redirectedDetailAndHistoryFollowTheCurrentRecipient() throws Exception {
        MaintenanceRequest request = new MaintenanceRequest();
        request.setEquipmentName("Notebook");
        request.setDefectDescription("Não liga");
        request.setRequestDate(LocalDateTime.now());
        request.setStatus(StatusEnum.APROVADA);
        request.setClient(clients.findById(4L).orElseThrow());
        request.setCategory(categories.findById(1).orElseThrow());
        request.setAssignedEmployee(employees.findById(2L).orElseThrow());
        long id = requests.saveAndFlush(request).getId();
        mvc.perform(post("/api/requests/employee/" + id + "/redirect").param("targetEmployeeId", "3")
                .header("Authorization", bearer(2L))).andExpect(status().isOk());
        for (long denied : new long[]{1, 2}) {
            mvc.perform(get("/api/requests/employee/" + id).header("Authorization", bearer(denied))).andExpect(status().isForbidden());
            mvc.perform(get("/api/history/" + id + "/history").header("Authorization", bearer(denied))).andExpect(status().isForbidden());
        }
        mvc.perform(get("/api/requests/employee/" + id).header("Authorization", bearer(3L))).andExpect(status().isOk());
        mvc.perform(get("/api/history/" + id + "/history").header("Authorization", bearer(3L)))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].title").value("Redirecionada de Maria para Mário"));
        mvc.perform(get("/api/history/" + id + "/history").header("Authorization", bearer(4L))).andExpect(status().isOk());
        mvc.perform(get("/api/history/" + id + "/history").header("Authorization", bearer(5L))).andExpect(status().isForbidden());
        mvc.perform(get("/api/history/999999/history").header("Authorization", bearer(3L))).andExpect(status().isNotFound());
    }

    @Test
    void administrativeRegistrationReusesRandomPasswordEmailAndHash() throws Exception {
        mvc.perform(post("/api/clients").header("Authorization", bearer(1L))
                        .contentType(MediaType.APPLICATION_JSON).content(CLIENT))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.password").doesNotExist());
        ArgumentCaptor<String> password = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(1)).sendRandomPasswordEmail(eq("cliente.teste@example.com"), password.capture());
        assertThat(password.getValue()).matches("[0-9]{4}");
        Client client = clients.findByEmail("cliente.teste@example.com").orElseThrow();
        assertThat(passwords.matches(password.getValue(), client.getPassword())).isTrue();
        assertThat(client.isActive()).isTrue();
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void failedEmailDoesNotReturnSuccessOrCommitAdministrativeRegistration() {
        doThrow(new IllegalStateException("SMTP indisponível no teste")).when(emailService).sendRandomPasswordEmail(anyString(), anyString());
        assertThatThrownBy(() -> mvc.perform(post("/api/clients").header("Authorization", bearer(1L))
                .contentType(MediaType.APPLICATION_JSON).content(CLIENT))).hasRootCauseInstanceOf(IllegalStateException.class);
        assertThat(clients.findByEmail("cliente.teste@example.com")).isEmpty();
    }

    private String bearer(Long id) {
        return "Bearer " + tokens.generateToken(users.findById(id).orElseThrow());
    }
}
