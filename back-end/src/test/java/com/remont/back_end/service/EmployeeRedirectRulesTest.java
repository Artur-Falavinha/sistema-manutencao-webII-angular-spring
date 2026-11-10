package com.remont.back_end.service;

import com.remont.back_end.dto.MaintenanceRequestResponseDTO;
import com.remont.back_end.model.MaintenanceRequest;
import com.remont.back_end.model.RequestHistory;
import com.remont.back_end.model.StatusEnum;
import com.remont.back_end.repository.CategoryEquipmentRepository;
import com.remont.back_end.repository.ClientRepository;
import com.remont.back_end.repository.EmployeeRepository;
import com.remont.back_end.repository.MaintenanceRequestRepository;
import com.remont.back_end.repository.RequestHistoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Redirecionamento (RF015) e visibilidade das solicitações redirecionadas na listagem (RF013).
 */
@SpringBootTest
@Transactional
class EmployeeRedirectRulesTest {

    private static final Long MARIA_ID = 2L;
    private static final Long MARIO_ID = 3L;
    private static final String MARIA_EMAIL = "maria@remont.com";
    private static final String MARIO_EMAIL = "mario@remont.com";

    @Autowired
    private MaintenanceRequestService maintenanceRequestService;

    @Autowired
    private MaintenanceRequestRepository requestRepository;

    @Autowired
    private RequestHistoryRepository historyRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private CategoryEquipmentRepository categoryRepository;

    @Test
    void redirectedRequestIsListedOnlyForTargetEmployee() {
        Long id = approvedRequestAssignedTo(MARIA_ID);

        maintenanceRequestService.redirectMaintenance(id, MARIO_ID, MARIA_ID);

        assertThat(listedIds(MARIO_EMAIL)).contains(id);
        assertThat(listedIds(MARIA_EMAIL)).doesNotContain(id);
    }

    @Test
    void redirectHistoryRecordsOriginAndTarget() {
        Long id = approvedRequestAssignedTo(MARIA_ID);

        maintenanceRequestService.redirectMaintenance(id, MARIO_ID, MARIA_ID);

        List<RequestHistory> history = historyRepository.findByMaintenanceRequest_IdOrderByOccurrenceDateAsc(id);
        RequestHistory last = history.get(history.size() - 1);
        assertThat(last.getStatus()).isEqualTo(StatusEnum.REDIRECIONADA);
        assertThat(last.getTitle()).isEqualTo("Redirecionada de Maria para Mário");
    }

    @Test
    void employeeCannotRedirectToHimself() {
        Long id = approvedRequestAssignedTo(MARIA_ID);

        assertThatThrownBy(() -> maintenanceRequestService.redirectMaintenance(id, MARIA_ID, MARIA_ID))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    }

    private List<Long> listedIds(String employeeEmail) {
        return maintenanceRequestService.getRequestsForEmployee(employeeEmail).stream()
                .map(MaintenanceRequestResponseDTO::getId)
                .toList();
    }

    private Long approvedRequestAssignedTo(Long employeeId) {
        MaintenanceRequest request = new MaintenanceRequest();
        request.setEquipmentName("Notebook de teste");
        request.setDefectDescription("Não liga");
        request.setRequestDate(LocalDateTime.now());
        request.setStatus(StatusEnum.APROVADA);
        request.setClient(clientRepository.findById(4L).orElseThrow());
        request.setCategory(categoryRepository.findById(1).orElseThrow());
        request.setAssignedEmployee(employeeRepository.findById(employeeId).orElseThrow());
        return requestRepository.save(request).getId();
    }
}
