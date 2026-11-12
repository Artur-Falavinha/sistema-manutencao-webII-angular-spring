package com.remont.back_end.service;

import com.remont.back_end.dto.RequestHistoryDTO;
import com.remont.back_end.exception.ResourceNotFoundException;
import com.remont.back_end.model.MaintenanceRequest;
import com.remont.back_end.model.RequestHistory;
import com.remont.back_end.model.StatusEnum;
import com.remont.back_end.model.User;
import com.remont.back_end.repository.MaintenanceRequestRepository;
import com.remont.back_end.repository.RequestHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.remont.back_end.security.UserPrincipal;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class RequestHistoryServiceImpl implements RequestHistoryService {

    @Autowired
    private RequestHistoryRepository historyRepository;

    @Autowired
    private MaintenanceRequestRepository requestRepository;

    @Override
    @Transactional
    public void addHistory(MaintenanceRequest request, User user, StatusEnum status, String title) {
        RequestHistory history = new RequestHistory(request, user, status, title);
        historyRepository.save(history);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RequestHistoryDTO> getHistoryByRequestId(Long requestId) {
        MaintenanceRequest request = requestRepository.findById(Objects.requireNonNull(requestId))
                .orElseThrow(() -> new ResourceNotFoundException("Solicitação não encontrada id=" + requestId));
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado ao histórico.");
        }
        boolean client = principal.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_CLIENT"));
        boolean employee = principal.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_EMPLOYEE"));
        if (!(client && request.getClient().getId().equals(principal.getId()))
                && !(employee && (request.getStatus() != StatusEnum.REDIRECIONADA
                || (request.getAssignedEmployee() != null && request.getAssignedEmployee().getId().equals(principal.getId()))))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado ao histórico.");
        }

        return historyRepository.findByMaintenanceRequest_IdOrderByOccurrenceDateAsc(requestId)
                .stream()
                .map(RequestHistoryDTO::fromEntity)
                .collect(Collectors.toList());
    }
}