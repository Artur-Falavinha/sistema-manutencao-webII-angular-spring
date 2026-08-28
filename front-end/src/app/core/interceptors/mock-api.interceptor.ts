import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MOCK_STATUSES } from '../../shared/mocks/status.mock';
import { MOCK_CATEGORIES } from '../../shared/mocks/category.mock';
import { MOCK_EMPLOYEE_REQUESTS } from '../../shared/mocks/maintenance-request.mock';
import { MOCK_REQUESTS } from '../../shared/mocks/request.mock';
import { MOCK_CLIENTS } from '../../shared/mocks/client.mock';
import { Request } from '../../shared/models/request';
import { MaintenanceRequestCreateDTO, MaintenanceRequestResponseDTO } from '../../shared/models/maintenance-request.models';

/**
 * SCAFFOLD TEMPORÁRIO — declarado no plano do semestre.
 *
 * Intercepta chamadas HTTP feitas pelos services migrados literalmente
 * (status.service.ts, maintenance-request.service.ts, category.service.ts)
 * e devolve dados simulados no shape real dos DTOs. Nenhum desses services
 * foi alterado — a "troca de motor" acontece só aqui.
 *
 * Rotas cobertas hoje (RF011/RF012, visão funcionário; RF001, visão cliente):
 *   GET  /status-enum        -> MOCK_STATUSES
 *   GET  /requests/employee  -> MOCK_EMPLOYEE_REQUESTS
 *   GET  /requests/client    -> MOCK_REQUESTS do cliente logado
 *   POST /requests           -> cria em memória e devolve o DTO criado
 *   GET  /categories         -> MOCK_CATEGORIES
 *
 * Remover este arquivo e a linha correspondente em app.config.ts quando os
 * services HTTP reais forem integrados (marco 08/10 para requests,
 * 15/10 para o restante do backend).
 */
const LOGGED_IN_CLIENT_ID = 1;

let mockRequests: Request[] = [...MOCK_REQUESTS];

function toResponseDTO(request: Request): MaintenanceRequestResponseDTO {
  const status = MOCK_STATUSES.find((s) => s.id === request.statusId);
  const category = MOCK_CATEGORIES.find((c) => c.id === request.categoryId);
  const client = MOCK_CLIENTS.find((c) => c.id === request.clientId);

  return {
    id: request.id,
    equipmentName: request.equipmentName,
    defectDescription: request.equipmentDescription,
    requestDate: request.requestDate.toISOString(),
    statusName: status?.nome ?? '',
    statusColor: status?.cor ?? '',
    categoryName: category?.name ?? '',
    clientName: client?.name ?? '',
  };
}

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'GET') {
    if (req.url.endsWith('/status-enum')) {
      return of(new HttpResponse({ status: 200, body: MOCK_STATUSES })).pipe(delay(150));
    }

    if (req.url.endsWith('/requests/employee')) {
      return of(new HttpResponse({ status: 200, body: MOCK_EMPLOYEE_REQUESTS })).pipe(delay(150));
    }

    if (req.url.endsWith('/requests/client')) {
      const clientResponses = mockRequests
        .filter((request) => request.clientId === LOGGED_IN_CLIENT_ID)
        .map(toResponseDTO);

      return of(new HttpResponse({ status: 200, body: clientResponses })).pipe(delay(150));
    }

    if (req.url.endsWith('/categories')) {
      return of(new HttpResponse({ status: 200, body: MOCK_CATEGORIES })).pipe(delay(150));
    }
  }

  if (req.method === 'POST' && req.url.endsWith('/requests')) {
    const payload = req.body as MaintenanceRequestCreateDTO;
    const category = MOCK_CATEGORIES.find((c) => c.id === payload.categoryId);

    const created: Request = {
      id: Math.max(0, ...mockRequests.map((request) => request.id)) + 1,
      equipmentName: payload.equipmentName,
      equipmentDescription: payload.defectDescription,
      requestDate: new Date(),
      category: category?.name ?? '',
      categoryId: payload.categoryId,
      statusId: 1,
      status: 'ABERTA',
      clientId: LOGGED_IN_CLIENT_ID,
      employeeId: 0,
    };

    mockRequests = [created, ...mockRequests];

    return of(new HttpResponse({ status: 201, body: toResponseDTO(created) })).pipe(delay(150));
  }

  return next(req);
};
