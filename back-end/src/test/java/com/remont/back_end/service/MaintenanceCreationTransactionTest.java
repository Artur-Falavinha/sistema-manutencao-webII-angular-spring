package com.remont.back_end.service;

import com.remont.back_end.dto.MaintenanceRequestCreateDTO;
import com.remont.back_end.model.RequestHistory;
import com.remont.back_end.repository.RequestHistoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

@SpringBootTest(properties = "spring.jpa.hibernate.ddl-auto=update")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class MaintenanceCreationTransactionTest {

    @Autowired
    private MaintenanceRequestService requestService;

    @Autowired
    private JdbcTemplate jdbc;

    @MockitoSpyBean
    private RequestHistoryRepository historyRepository;

    @Test
    void historyFailureRollsBackRequestWithoutATestTransaction() {
        long requestsBefore = jdbc.queryForObject("select count(*) from maintenance_requests", Long.class);
        long historyBefore = historyRepository.count();
        doThrow(new DataIntegrityViolationException("Falha controlada no histórico"))
                .when(historyRepository).save(any(RequestHistory.class));

        assertThatThrownBy(() -> requestService.createMaintenanceRequest(request(), 4L))
                .isInstanceOf(DataIntegrityViolationException.class);

        assertThat(jdbc.queryForObject("select count(*) from maintenance_requests", Long.class)).isEqualTo(requestsBefore);
        assertThat(historyRepository.count()).isEqualTo(historyBefore);
    }

    @Test
    void validCreationCommitsRequestAndInitialHistory() {
        long id = requestService.createMaintenanceRequest(request(), 4L).getId();
        try {
            assertThat(jdbc.queryForObject("select status from maintenance_requests where id = ?", String.class, id)).isEqualTo("ABERTA");
            assertThat(historyRepository.findByMaintenanceRequest_IdOrderByOccurrenceDateAsc(id)).hasSize(1);
        } finally {
            jdbc.update("delete from request_history where request_id = ?", id);
            jdbc.update("delete from maintenance_requests where id = ?", id);
        }
    }

    @Test
    void inactiveCategoryIsRejectedWithoutRequestOrHistory() {
        long requestsBefore = jdbc.queryForObject("select count(*) from maintenance_requests", Long.class);
        long historyBefore = historyRepository.count();
        jdbc.update("update category set active = false where id = 1");
        try {
            assertThatThrownBy(() -> requestService.createMaintenanceRequest(request(), 4L))
                    .isInstanceOfSatisfying(ResponseStatusException.class, error -> assertThat(error.getStatusCode().value()).isEqualTo(409));
            assertThat(jdbc.queryForObject("select count(*) from maintenance_requests", Long.class)).isEqualTo(requestsBefore);
            assertThat(historyRepository.count()).isEqualTo(historyBefore);
        } finally {
            jdbc.update("update category set active = true where id = 1");
        }
    }

    private MaintenanceRequestCreateDTO request() {
        MaintenanceRequestCreateDTO dto = new MaintenanceRequestCreateDTO();
        dto.setEquipmentName("Notebook para teste de transação");
        dto.setDefectDescription("Não liga");
        dto.setCategoryId(1);
        return dto;
    }
}
