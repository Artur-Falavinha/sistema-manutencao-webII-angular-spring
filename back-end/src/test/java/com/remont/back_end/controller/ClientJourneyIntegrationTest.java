package com.remont.back_end.controller;

import com.jayway.jsonpath.JsonPath;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RF003-RF010: jornada do cliente pela API real, do login ao pagamento.
 * Usa os usuarios do data.sql (cliente joao@gmail.com / 1234, outro cliente jose@gmail.com / 1234
 * e funcionaria maria@remont.com / 4321). Cada teste e desfeito no fim (@Transactional).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ClientJourneyIntegrationTest {

    private static final String CLIENT_EMAIL = "joao@gmail.com";
    private static final String OTHER_CLIENT_EMAIL = "jose@gmail.com";
    private static final String CLIENT_PASSWORD = "1234";
    private static final String EMPLOYEE_EMAIL = "maria@remont.com";
    private static final String EMPLOYEE_PASSWORD = "4321";

    // Servico "Conserto geral" do data.sql, no valor de R$ 200,00
    private static final long SERVICE_ID = 5L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EntityManager entityManager;

    private String clientToken;
    private String employeeToken;

    @BeforeEach
    void issueTokens() throws Exception {
        clientToken = tokenFor(CLIENT_EMAIL, CLIENT_PASSWORD);
        employeeToken = tokenFor(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
    }

    @Test
    void newRequestStartsOpenAndAppearsOnClientHome() throws Exception {
        long id = openRequest();

        clientGet("/api/requests/client")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)].statusName".formatted(id)).value(hasItem("ABERTA")))
                .andExpect(jsonPath("$[?(@.id == %d)].categoryName".formatted(id)).value(hasItem("Notebook")));

        clientGet("/api/requests/client/" + id)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.equipmentName").value("Notebook de teste"))
                .andExpect(jsonPath("$.history[0].statusName").value("ABERTA"))
                .andExpect(jsonPath("$.history[0].userName").value("João"));
    }

    @Test
    void clientApprovesBudgetAndPaysAfterMaintenance() throws Exception {
        long id = budgetedRequest();

        clientGet("/api/requests/client/" + id)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.budgets[0].total").value(200.0));

        clientPost("/api/requests/client/" + id + "/approve", "{}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusName").value("APROVADA"));

        employeePost("/api/requests/employee/" + id + "/maintenance", """
                {"maintenanceDescription":"Troca da placa","clientGuidelines":"Evitar quedas"}
                """).andExpect(status().isOk());
        flushAndClear();

        clientPost("/api/requests/client/" + id + "/pay", "{}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusName").value("PAGA"));
        flushAndClear();

        clientGet("/api/requests/client/" + id)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.history[*].statusName")
                        .value(contains("ABERTA", "ORÇADA", "APROVADA", "ARRUMADA", "PAGA")));
    }

    @Test
    void clientRejectsWithReasonAndRescuesRequest() throws Exception {
        long id = budgetedRequest();

        clientPost("/api/requests/client/" + id + "/reject", """
                {"rejectionReason":"Valor acima do esperado"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusName").value("REJEITADA"));
        flushAndClear();

        clientGet("/api/requests/client/" + id)
                .andExpect(jsonPath("$.rejectionReason").value("Valor acima do esperado"));

        clientPost("/api/requests/client/" + id + "/rescue", "{}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusName").value("APROVADA"));
        flushAndClear();

        clientGet("/api/requests/client/" + id)
                .andExpect(jsonPath("$.rejectionReason").doesNotExist())
                .andExpect(jsonPath("$.history[*].statusName")
                        .value(contains("ABERTA", "ORÇADA", "REJEITADA", "APROVADA")));
    }

    @Test
    void rejectionWithoutReasonIsRefusedWith400() throws Exception {
        long id = budgetedRequest();

        clientPost("/api/requests/client/" + id + "/reject", "{\"rejectionReason\":\"\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("O motivo da rejeição é obrigatório"));
    }

    @Test
    void invalidTransitionsAreRefusedWith409AndPortugueseMessage() throws Exception {
        long id = openRequest();

        clientPost("/api/requests/client/" + id + "/approve", "{}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("A solicitação não está em fase de aprovação."));

        clientPost("/api/requests/client/" + id + "/rescue", "{}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Apenas solicitações rejeitadas podem ser resgatadas."));

        clientPost("/api/requests/client/" + id + "/pay", "{}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("O serviço precisa estar ARRUMADO para ser pago."));
    }

    @Test
    void anotherClientCannotSeeOrChangeTheRequest() throws Exception {
        long id = budgetedRequest();
        String otherToken = tokenFor(OTHER_CLIENT_EMAIL, CLIENT_PASSWORD);

        mockMvc.perform(get("/api/requests/client/" + id).header("Authorization", bearer(otherToken)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Acesso negado a esta solicitação."));

        mockMvc.perform(post("/api/requests/client/" + id + "/approve")
                        .header("Authorization", bearer(otherToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    private long openRequest() throws Exception {
        String json = clientPost("/api/requests", """
                {"equipmentName":"Notebook de teste","defectDescription":"Não liga","categoryId":1}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statusName").value("ABERTA"))
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(json, "$.id")).longValue();
    }

    private long budgetedRequest() throws Exception {
        long id = openRequest();
        employeePost("/api/requests/employee/" + id + "/budget", "{\"serviceIds\":[%d]}".formatted(SERVICE_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusName").value("ORÇADA"));
        flushAndClear();
        return id;
    }

    /** Simula requisicoes em transacoes separadas, como no uso real, recarregando as entidades do banco. */
    private void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    private ResultActions clientGet(String url) throws Exception {
        return mockMvc.perform(get(url).header("Authorization", bearer(clientToken)));
    }

    private ResultActions clientPost(String url, String body) throws Exception {
        return authorizedPost(url, clientToken, body);
    }

    private ResultActions employeePost(String url, String body) throws Exception {
        return authorizedPost(url, employeeToken, body);
    }

    private ResultActions authorizedPost(String url, String token, String body) throws Exception {
        return mockMvc.perform(post(url)
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private String tokenFor(String email, String password) throws Exception {
        String json = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.token");
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
