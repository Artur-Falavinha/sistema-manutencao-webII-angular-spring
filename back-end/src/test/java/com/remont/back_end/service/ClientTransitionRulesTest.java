package com.remont.back_end.service;

import com.remont.back_end.dto.RejectionDTO;
import com.remont.back_end.model.MaintenanceRequest;
import com.remont.back_end.model.RequestHistory;
import com.remont.back_end.model.StatusEnum;
import com.remont.back_end.repository.CategoryEquipmentRepository;
import com.remont.back_end.repository.ClientRepository;
import com.remont.back_end.repository.MaintenanceRequestRepository;
import com.remont.back_end.repository.RequestHistoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Regras de transição do cliente (RF006, RF007, RF009 e RF010).
 */
@SpringBootTest
@Transactional
class ClientTransitionRulesTest {

    private static final Long CLIENT_ID = 4L;
    private static final Long OTHER_CLIENT_ID = 5L;

    @Autowired
    private MaintenanceRequestService maintenanceRequestService;

    @Autowired
    private MaintenanceRequestRepository requestRepository;

    @Autowired
    private RequestHistoryRepository historyRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private CategoryEquipmentRepository categoryRepository;

    @Test
    void clientApprovesBudgetedRequest() {
        Long id = requestWithStatus(StatusEnum.ORCADA);

        maintenanceRequestService.approveBudget(id, CLIENT_ID);

        assertStatusAndLastHistory(id, StatusEnum.APROVADA);
    }

    @Test
    void clientRejectsBudgetedRequestWithReason() {
        Long id = requestWithStatus(StatusEnum.ORCADA);

        maintenanceRequestService.rejectBudget(id, rejection("Valor acima do esperado"), CLIENT_ID);

        assertStatusAndLastHistory(id, StatusEnum.REJEITADA);
        assertThat(requestRepository.findById(id).orElseThrow().getRejectionReason())
                .isEqualTo("Valor acima do esperado");
    }

    @Test
    void clientRescuesRejectedRequest() {
        Long id = requestWithStatus(StatusEnum.REJEITADA);

        maintenanceRequestService.rescueRequest(id, CLIENT_ID);

        assertStatusAndLastHistory(id, StatusEnum.APROVADA);
        assertThat(requestRepository.findById(id).orElseThrow().getRejectionReason()).isNull();
    }

    @Test
    void clientPaysFixedRequest() {
        Long id = requestWithStatus(StatusEnum.ARRUMADA);

        maintenanceRequestService.payRequest(id, CLIENT_ID);

        assertStatusAndLastHistory(id, StatusEnum.PAGA);
    }

    @Test
    void approveAndRejectRequireBudgetedRequest() {
        for (StatusEnum status : List.of(StatusEnum.ABERTA, StatusEnum.APROVADA, StatusEnum.REJEITADA, StatusEnum.PAGA)) {
            Long id = requestWithStatus(status);

            assertThatThrownBy(() -> maintenanceRequestService.approveBudget(id, CLIENT_ID))
                    .isInstanceOf(IllegalStateException.class);
            assertThatThrownBy(() -> maintenanceRequestService.rejectBudget(id, rejection("Motivo"), CLIENT_ID))
                    .isInstanceOf(IllegalStateException.class);
            assertThat(requestRepository.findById(id).orElseThrow().getStatus()).isEqualTo(status);
        }
    }

    @Test
    void rescueRequiresRejectedRequest() {
        for (StatusEnum status : List.of(StatusEnum.ORCADA, StatusEnum.APROVADA, StatusEnum.ARRUMADA)) {
            Long id = requestWithStatus(status);

            assertThatThrownBy(() -> maintenanceRequestService.rescueRequest(id, CLIENT_ID))
                    .isInstanceOf(IllegalStateException.class);
            assertThat(requestRepository.findById(id).orElseThrow().getStatus()).isEqualTo(status);
        }
    }

    @Test
    void paymentRequiresFixedRequest() {
        for (StatusEnum status : List.of(StatusEnum.ORCADA, StatusEnum.APROVADA, StatusEnum.PAGA, StatusEnum.FINALIZADA)) {
            Long id = requestWithStatus(status);

            assertThatThrownBy(() -> maintenanceRequestService.payRequest(id, CLIENT_ID))
                    .isInstanceOf(IllegalStateException.class);
            assertThat(requestRepository.findById(id).orElseThrow().getStatus()).isEqualTo(status);
        }
    }

    @Test
    void clientCannotChangeAnotherClientsRequest() {
        Long budgeted = requestWithStatus(StatusEnum.ORCADA);
        Long rejected = requestWithStatus(StatusEnum.REJEITADA);
        Long fixed = requestWithStatus(StatusEnum.ARRUMADA);

        assertThatThrownBy(() -> maintenanceRequestService.approveBudget(budgeted, OTHER_CLIENT_ID))
                .isInstanceOf(SecurityException.class);
        assertThatThrownBy(() -> maintenanceRequestService.rejectBudget(budgeted, rejection("Motivo"), OTHER_CLIENT_ID))
                .isInstanceOf(SecurityException.class);
        assertThatThrownBy(() -> maintenanceRequestService.rescueRequest(rejected, OTHER_CLIENT_ID))
                .isInstanceOf(SecurityException.class);
        assertThatThrownBy(() -> maintenanceRequestService.payRequest(fixed, OTHER_CLIENT_ID))
                .isInstanceOf(SecurityException.class);
    }

    private Long requestWithStatus(StatusEnum status) {
        MaintenanceRequest request = new MaintenanceRequest();
        request.setEquipmentName("Notebook de teste");
        request.setDefectDescription("Não liga");
        request.setRequestDate(LocalDateTime.now());
        request.setStatus(status);
        request.setClient(clientRepository.findById(CLIENT_ID).orElseThrow());
        request.setCategory(categoryRepository.findById(1).orElseThrow());
        return requestRepository.save(request).getId();
    }

    private RejectionDTO rejection(String reason) {
        RejectionDTO dto = new RejectionDTO();
        dto.setRejectionReason(reason);
        return dto;
    }

    private void assertStatusAndLastHistory(Long id, StatusEnum expected) {
        assertThat(requestRepository.findById(id).orElseThrow().getStatus()).isEqualTo(expected);

        List<RequestHistory> history = historyRepository.findByMaintenanceRequest_IdOrderByOccurrenceDateAsc(id);
        assertThat(history).isNotEmpty();
        RequestHistory last = history.get(history.size() - 1);
        assertThat(last.getStatus()).isEqualTo(expected);
        assertThat(last.getOccurrenceDate()).isNotNull();
        assertThat(last.getUser().getId()).isEqualTo(CLIENT_ID);
    }
}
