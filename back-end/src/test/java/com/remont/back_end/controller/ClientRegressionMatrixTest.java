package com.remont.back_end.controller;

import com.jayway.jsonpath.JsonPath;
import com.remont.back_end.model.MaintenanceRequest;
import com.remont.back_end.model.StatusEnum;
import com.remont.back_end.repository.CategoryEquipmentRepository;
import com.remont.back_end.repository.ClientRepository;
import com.remont.back_end.repository.MaintenanceRequestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

/**
 * RF003-RF010: regressao da jornada do cliente com diferentes estados, clientes e datas.
 * Usa os quatro clientes do data.sql (senha 1234) e a funcionaria maria@remont.com (senha 4321).
 * Cada teste e desfeito no fim (@Transactional).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ClientRegressionMatrixTest {

    private static final Map<Long, String> CLIENTS = Map.of(
            4L, "joao@gmail.com",
            5L, "jose@gmail.com",
            6L, "joana@gmail.com",
            7L, "joaquina@gmail.com");
    private static final String CLIENT_PASSWORD = "1234";

    // Acoes do cliente e o unico status em que cada uma e aceita (RF006, RF007, RF009, RF010)
    private static final Map<String, StatusEnum> ACTIONS = Map.of(
            "approve", StatusEnum.ORCADA,
            "reject", StatusEnum.ORCADA,
            "rescue", StatusEnum.REJEITADA,
            "pay", StatusEnum.ARRUMADA);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MaintenanceRequestRepository requestRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private CategoryEquipmentRepository categoryRepository;

    private final Map<Long, String> tokens = new HashMap<>();

    @Test
    void eachClientSeesOnlyOwnRequestsSortedByDateAscending() throws Exception {
        LocalDateTime base = LocalDateTime.of(2026, 10, 1, 9, 0);
        Map<Long, List<Long>> seeded = new HashMap<>();
        for (Long clientId : CLIENTS.keySet()) {
            // Datas inseridas fora de ordem, inclusive no mesmo dia em horarios diferentes
            seeded.put(clientId, List.of(
                    seed(clientId, StatusEnum.ABERTA, base.plusDays(3)),
                    seed(clientId, StatusEnum.ORCADA, base.plusHours(5)),
                    seed(clientId, StatusEnum.PAGA, base.minusMonths(1))));
        }

        for (Long clientId : CLIENTS.keySet()) {
            String json = clientGet(clientId, "/api/requests/client")
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();

            List<Long> ids = longs(JsonPath.read(json, "$[*].id"));
            List<String> dates = JsonPath.read(json, "$[*].requestDate");

            assertThat(ids).containsAll(seeded.get(clientId));
            seeded.forEach((otherId, otherIds) -> {
                if (!otherId.equals(clientId)) {
                    assertThat(ids).doesNotContainAnyElementsOf(otherIds);
                }
            });
            assertThat(dates.stream().map(LocalDateTime::parse).toList()).isSorted();
        }
    }

    @ParameterizedTest
    @EnumSource(StatusEnum.class)
    void everyStatusIsShownConsistentlyOnListAndDetail(StatusEnum status) throws Exception {
        Long clientId = clientFor(status);
        long id = seed(clientId, status, LocalDateTime.of(2026, 9, 15, 14, 30));

        clientGet(clientId, "/api/requests/client")
                .andExpect(jsonPath("$[?(@.id == %d)].statusName".formatted(id)).value(status.getName()))
                .andExpect(jsonPath("$[?(@.id == %d)].statusColor".formatted(id)).value(status.getColor()))
                .andExpect(jsonPath("$[?(@.id == %d)].requestDate".formatted(id)).value("2026-09-15T14:30:00"));

        // Contrato lido pelas telas do cliente: status como objeto { id, nome, cor }
        clientGet(clientId, "/api/requests/client/" + id)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status.id").value((int) status.getId()))
                .andExpect(jsonPath("$.status.nome").value(status.getName()))
                .andExpect(jsonPath("$.status.cor").value(status.getColor()))
                .andExpect(jsonPath("$.categoryName").value("Notebook"))
                .andExpect(jsonPath("$.budgets").isArray())
                .andExpect(jsonPath("$.history").isArray());
    }

    @ParameterizedTest
    @EnumSource(StatusEnum.class)
    void clientActionsAreAcceptedOnlyInTheirStatus(StatusEnum status) throws Exception {
        Long clientId = clientFor(status);
        List<String> accepted = new ArrayList<>();

        for (Map.Entry<String, StatusEnum> action : ACTIONS.entrySet()) {
            long id = seed(clientId, status, LocalDateTime.of(2026, 9, 20, 8, 0));
            boolean allowed = action.getValue() == status;

            clientPost(clientId, "/api/requests/client/" + id + "/" + action.getKey())
                    .andExpect(allowed ? status().isOk() : status().isConflict())
                    .andExpect(allowed ? jsonPath("$.id").value(id) : content().string(""));

            StatusEnum after = requestRepository.findById(id).orElseThrow().getStatus();
            if (allowed) {
                accepted.add(action.getKey());
                assertThat(after).isNotEqualTo(status);
            } else {
                assertThat(after).isEqualTo(status);
            }
        }

        Set<String> expected = switch (status) {
            case ORCADA -> Set.of("approve", "reject");
            case REJEITADA -> Set.of("rescue");
            case ARRUMADA -> Set.of("pay");
            default -> Set.of();
        };
        assertThat(accepted).containsExactlyInAnyOrderElementsOf(expected);
    }

    @ParameterizedTest
    @EnumSource(StatusEnum.class)
    void otherClientsAreAlwaysForbidden(StatusEnum status) throws Exception {
        Long ownerId = clientFor(status);
        Long intruderId = ownerId == 7L ? 4L : ownerId + 1;
        long id = seed(ownerId, status, LocalDateTime.of(2026, 9, 25, 16, 45));

        clientGet(intruderId, "/api/requests/client/" + id)
                .andExpect(status().isForbidden());
        for (String action : ACTIONS.keySet()) {
            clientPost(intruderId, "/api/requests/client/" + id + "/" + action)
                    .andExpect(status().isForbidden());
        }
        assertThat(requestRepository.findById(id).orElseThrow().getStatus()).isEqualTo(status);
    }

    /** Distribui os estados entre os quatro clientes do data.sql. */
    private static Long clientFor(StatusEnum status) {
        return 4L + status.ordinal() % CLIENTS.size();
    }

    private long seed(Long clientId, StatusEnum status, LocalDateTime requestDate) {
        MaintenanceRequest request = new MaintenanceRequest();
        request.setEquipmentName("Regressão " + status.name());
        request.setDefectDescription("Cenário de regressão do cliente");
        request.setRequestDate(requestDate);
        request.setStatus(status);
        request.setClient(clientRepository.findById(clientId).orElseThrow());
        request.setCategory(categoryRepository.findById(1).orElseThrow());
        return requestRepository.save(request).getId();
    }

    private ResultActions clientGet(Long clientId, String url) throws Exception {
        return mockMvc.perform(get(url).header("Authorization", bearer(clientId)));
    }

    private ResultActions clientPost(Long clientId, String url) throws Exception {
        String body = url.endsWith("/reject") ? "{\"rejectionReason\":\"Regressão\"}" : "{}";
        return mockMvc.perform(post(url)
                .header("Authorization", bearer(clientId))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private String bearer(Long clientId) throws Exception {
        String cached = tokens.get(clientId);
        if (cached != null) {
            return cached;
        }
        String json = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(CLIENTS.get(clientId), CLIENT_PASSWORD)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = "Bearer " + JsonPath.read(json, "$.token");
        tokens.put(clientId, token);
        return token;
    }

    private static List<Long> longs(List<Number> numbers) {
        return numbers.stream().map(Number::longValue).toList();
    }
}
