import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MOCK_STATUSES } from '../../shared/mocks/status.mock';
import { MOCK_CATEGORIES } from '../../shared/mocks/category.mock';
import { MOCK_REQUESTS } from '../../shared/mocks/request.mock';
import { MOCK_CLIENTS } from '../../shared/mocks/client.mock';
import { MOCK_EMPLOYEES } from '../../shared/mocks/employee.mock';
import { MOCK_BUDGETS, MOCK_SERVICE_ITEMS } from '../../shared/mocks/budget.mock';
import { MOCK_REQUEST_HISTORY } from '../../shared/mocks/request-history.mock';
import { Category } from '../../shared/models/category';
import { Employee } from '../../shared/models/employee';
import { Request } from '../../shared/models/request';
import { Budget, BudgetCreateDTO } from '../../shared/models/budget.model';
import { MaintenanceRecordDTO } from '../../shared/models/maintenance-record.model';
import {
  ClientRequestDetailDTO,
  EmployeeRequestDetailDTO,
  MaintenanceRequestCreateDTO,
  MaintenanceRequestResponseDTO,
  RejectionDTO,
} from '../../shared/models/maintenance-request.models';

/**
 * SCAFFOLD TEMPORÁRIO — declarado no plano do semestre.
 *
 * Intercepta chamadas HTTP feitas pelos services migrados literalmente
 * (status.service.ts, maintenance-request.service.ts, category.service.ts,
 * service-item.service.ts) e devolve dados simulados no shape real dos DTOs.
 * Nenhum desses services foi alterado — a "troca de motor" acontece só aqui.
 *
 * O lado funcionário e o lado cliente agora compartilham o MESMO estado em
 * memória (mockRequests) — uma ação de um lado (ex: cliente paga) reflete
 * no outro (ex: funcionário pode finalizar). Antes disso, o funcionário
 * usava um array estático separado (MOCK_EMPLOYEE_REQUESTS), aposentado
 * nesta janela.
 *
 * Rotas cobertas hoje (RF001, RF003-RF010 visão cliente; RF011-RF016 visão
 * funcionário; RF017/RF018 CRUD simulado de categorias e funcionários):
 *   GET  /status-enum                          -> MOCK_STATUSES
 *   GET  /services                             -> MOCK_SERVICE_ITEMS
 *   GET  /requests/employee                    -> lista (deriva de mockRequests)
 *   GET  /requests/employee/{id}               -> detalhe completo do funcionário
 *   POST /requests/employee/{id}/redirect      -> reatribui o funcionário responsável
 *   POST /requests/employee/{id}/budget        -> registra orçamento, muda para ORÇADA
 *   POST /requests/employee/{id}/maintenance   -> registra manutenção
 *   POST /requests/employee/{id}/finalize      -> muda o estado para FINALIZADA
 *   GET  /requests/client                      -> MOCK_REQUESTS do cliente logado
 *   GET  /requests/client/{id}                 -> detalhe + orçamentos + histórico
 *   POST /requests                             -> cria em memória e devolve o DTO criado
 *   POST /requests/client/{id}/approve         -> muda o estado para APROVADA
 *   POST /requests/client/{id}/reject          -> muda o estado para REJEITADA, grava o motivo
 *   POST /requests/client/{id}/rescue          -> muda o estado de REJEITADA para APROVADA
 *   POST /requests/client/{id}/pay             -> muda o estado para PAGA
 *   GET  /categories                           -> lista simulada de categorias
 *   POST/PUT/DELETE /categories                -> CRUD simulado de categorias
 *   GET/POST/PUT/DELETE /employees              -> CRUD simulado de funcionários
 *
 * Remover este arquivo e a linha correspondente em app.config.ts quando os
 * services HTTP reais forem integrados (marco 08/10 para requests,
 * 15/10 para o restante do backend).
 */
const LOGGED_IN_CLIENT_ID = 1;

let mockRequests: Request[];
let mockCategories: Category[];
let mockEmployees: Employee[];
let mockBudgets: Budget[];
let mockMaintenanceRecords: Record<number, MaintenanceRecordDTO>;

export function resetMockApiState(): void {
  mockRequests = MOCK_REQUESTS.map((request) => ({ ...request }));
  mockCategories = MOCK_CATEGORIES.map((category) => ({ ...category }));
  mockEmployees = MOCK_EMPLOYEES.map((employee) => ({ ...employee }));
  mockBudgets = MOCK_BUDGETS.map((budget) => ({ ...budget }));
  mockMaintenanceRecords = {};
}

resetMockApiState();

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

function toDetailDTO(request: Request): ClientRequestDetailDTO {
  const status = MOCK_STATUSES.find((s) => s.id === request.statusId);
  const category = MOCK_CATEGORIES.find((c) => c.id === request.categoryId);

  return {
    id: request.id,
    equipmentName: request.equipmentName,
    defectDescription: request.equipmentDescription,
    requestDate: request.requestDate.toISOString(),
    status: status ?? { id: request.statusId, nome: request.status ?? '', cor: '' },
    categoryName: category?.name ?? '',
    rejectionReason: request.rejectionReason,
    budgets: mockBudgets.filter((budget) => budget.requestId === request.id),
    history: MOCK_REQUEST_HISTORY[request.id] ?? [],
  };
}

function toEmployeeDetailDTO(request: Request): EmployeeRequestDetailDTO {
  const status = MOCK_STATUSES.find((s) => s.id === request.statusId);
  const category = MOCK_CATEGORIES.find((c) => c.id === request.categoryId);
  const client = MOCK_CLIENTS.find((c) => c.id === request.clientId);
  const assignedEmployee = mockEmployees.find((e) => e.id === request.employeeId);

  return {
    id: request.id,
    equipmentName: request.equipmentName,
    defectDescription: request.equipmentDescription,
    requestDate: request.requestDate.toISOString(),
    status: status ?? { id: request.statusId, nome: request.status ?? '', cor: '' },
    categoryName: category?.name ?? '',
    client: client!,
    assignedEmployeeName: request.employeeId ? assignedEmployee?.name : undefined,
    budgets: mockBudgets.filter((budget) => budget.requestId === request.id),
    maintenanceRecord: mockMaintenanceRecords[request.id],
  };
}

function updateRequestStatus(id: number, statusName: string, rejectionReason?: string): void {
  const status = MOCK_STATUSES.find((s) => s.nome === statusName);

  mockRequests = mockRequests.map((request) =>
    request.id === id
      ? { ...request, statusId: status?.id ?? request.statusId, status: statusName, rejectionReason }
      : request
  );
}

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const clientDetailMatch = req.url.match(/\/requests\/client\/(\d+)$/);
  const approveMatch = req.url.match(/\/requests\/client\/(\d+)\/approve$/);
  const rejectMatch = req.url.match(/\/requests\/client\/(\d+)\/reject$/);
  const rescueMatch = req.url.match(/\/requests\/client\/(\d+)\/rescue$/);
  const payMatch = req.url.match(/\/requests\/client\/(\d+)\/pay$/);

  const employeeDetailMatch = req.url.match(/\/requests\/employee\/(\d+)$/);
  const redirectMatch = req.url.match(/\/requests\/employee\/(\d+)\/redirect$/);
  const budgetMatch = req.url.match(/\/requests\/employee\/(\d+)\/budget$/);
  const maintenanceMatch = req.url.match(/\/requests\/employee\/(\d+)\/maintenance$/);
  const finalizeMatch = req.url.match(/\/requests\/employee\/(\d+)\/finalize$/);

  if (req.method === 'GET') {
    if (req.url.endsWith('/status-enum')) {
      return of(new HttpResponse({ status: 200, body: MOCK_STATUSES })).pipe(delay(150));
    }

    if (req.url.endsWith('/services')) {
      return of(new HttpResponse({ status: 200, body: MOCK_SERVICE_ITEMS })).pipe(delay(150));
    }

    if (employeeDetailMatch) {
      const request = mockRequests.find((r) => r.id === Number(employeeDetailMatch[1]));

      return request
        ? of(new HttpResponse({ status: 200, body: toEmployeeDetailDTO(request) })).pipe(delay(150))
        : of(new HttpResponse({ status: 404, body: null })).pipe(delay(150));
    }

    if (req.url.endsWith('/requests/employee')) {
      const employeeResponses = mockRequests.map(toResponseDTO);
      return of(new HttpResponse({ status: 200, body: employeeResponses })).pipe(delay(150));
    }

    if (clientDetailMatch) {
      const request = mockRequests.find((r) => r.id === Number(clientDetailMatch[1]));

      return request
        ? of(new HttpResponse({ status: 200, body: toDetailDTO(request) })).pipe(delay(150))
        : of(new HttpResponse({ status: 404, body: null })).pipe(delay(150));
    }

    if (req.url.endsWith('/requests/client')) {
      const clientResponses = mockRequests
        .filter((request) => request.clientId === LOGGED_IN_CLIENT_ID)
        .map(toResponseDTO);

      return of(new HttpResponse({ status: 200, body: clientResponses })).pipe(delay(150));
    }

    if (req.url.endsWith('/categories')) {
      return of(new HttpResponse({ status: 200, body: mockCategories })).pipe(delay(150));
    }

    if (req.url.endsWith('/employees')) {
      return of(new HttpResponse({ status: 200, body: mockEmployees })).pipe(delay(150));
    }

    const employeeId = getResourceId(req.url, '/employees/');
    if (employeeId !== null) {
      return of(new HttpResponse({ status: 200, body: mockEmployees.find((employee) => employee.id === employeeId) })).pipe(delay(150));
    }
  }

  if (req.method === 'POST') {
    if (req.url.endsWith('/requests')) {
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

    if (approveMatch) {
      updateRequestStatus(Number(approveMatch[1]), 'APROVADA');
      return of(new HttpResponse({ status: 200, body: null })).pipe(delay(150));
    }

    if (rejectMatch) {
      const payload = req.body as RejectionDTO;
      updateRequestStatus(Number(rejectMatch[1]), 'REJEITADA', payload?.rejectionReason);
      return of(new HttpResponse({ status: 200, body: null })).pipe(delay(150));
    }

    if (rescueMatch) {
      const id = Number(rescueMatch[1]);
      updateRequestStatus(id, 'APROVADA');
      const request = mockRequests.find((r) => r.id === id);

      return of(new HttpResponse({ status: 200, body: request ? toResponseDTO(request) : null })).pipe(delay(150));
    }

    if (payMatch) {
      const id = Number(payMatch[1]);
      updateRequestStatus(id, 'PAGA');
      const request = mockRequests.find((r) => r.id === id);

      return of(new HttpResponse({ status: 200, body: request ? toResponseDTO(request) : null })).pipe(delay(150));
    }

    if (redirectMatch) {
      const requestId = Number(redirectMatch[1]);
      const targetEmployeeId = Number(req.params.get('targetEmployeeId'));

      mockRequests = mockRequests.map((r) =>
        r.id === requestId ? { ...r, employeeId: targetEmployeeId } : r
      );

      const updated = mockRequests.find((r) => r.id === requestId);
      return of(new HttpResponse({ status: 200, body: updated ? toResponseDTO(updated) : null })).pipe(delay(150));
    }

    if (budgetMatch) {
      const requestId = Number(budgetMatch[1]);
      const payload = req.body as BudgetCreateDTO;
      const chosenServices = MOCK_SERVICE_ITEMS.filter((s) => payload.serviceIds.includes(s.id));
      const total = payload.total ?? chosenServices.reduce((acc, s) => acc + s.valorServico, 0);
      const requestBeingBudgeted = mockRequests.find((r) => r.id === requestId);

      const budget: Budget = {
        id: nextId(mockBudgets),
        requestId,
        employeeId: requestBeingBudgeted?.employeeId ?? 0,
        total,
        services: chosenServices.map((s) => s.nome).join(', '),
        serviceIds: payload.serviceIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockBudgets = [...mockBudgets, budget];
      updateRequestStatus(requestId, 'ORÇADA');

      const updated = mockRequests.find((r) => r.id === requestId);
      return of(new HttpResponse({ status: 201, body: updated ? toResponseDTO(updated) : null })).pipe(delay(150));
    }

    if (maintenanceMatch) {
      const requestId = Number(maintenanceMatch[1]);
      const payload = req.body as MaintenanceRecordDTO;
      const existing = mockMaintenanceRecords[requestId];

      mockMaintenanceRecords = {
        ...mockMaintenanceRecords,
        [requestId]: {
          id: existing?.id ?? Object.keys(mockMaintenanceRecords).length + 1,
          maintenanceDescription: payload.maintenanceDescription,
          clientGuidelines: payload.clientGuidelines,
          finishedAt: new Date().toISOString(),
        },
      };

      const updated = mockRequests.find((r) => r.id === requestId);
      return of(new HttpResponse({ status: 200, body: updated ? toResponseDTO(updated) : null })).pipe(delay(150));
    }

    if (finalizeMatch) {
      const requestId = Number(finalizeMatch[1]);
      updateRequestStatus(requestId, 'FINALIZADA');

      const updated = mockRequests.find((r) => r.id === requestId);
      return of(new HttpResponse({ status: 200, body: updated ? toResponseDTO(updated) : null })).pipe(delay(150));
    }
  }

  if (req.url.includes('/categories')) {
    if (req.method === 'POST') {
      const category = { ...(req.body as Category), id: nextId(mockCategories) };
      mockCategories = [...mockCategories, category];
      return of(new HttpResponse({ status: 201, body: category })).pipe(delay(150));
    }

    if (req.method === 'PUT') {
      const category = req.body as Category;
      mockCategories = mockCategories.map((current) => current.id === category.id ? category : current);
      return of(new HttpResponse({ status: 200, body: category })).pipe(delay(150));
    }

    if (req.method === 'DELETE') {
      const categoryId = getResourceId(req.url, '/categories/');
      mockCategories = mockCategories.filter((category) => category.id !== categoryId);
      return of(new HttpResponse({ status: 204, body: null })).pipe(delay(150));
    }
  }

  if (req.url.includes('/employees')) {
    if (req.method === 'POST') {
      const employee = { ...(req.body as Employee), id: nextId(mockEmployees) };
      mockEmployees = [...mockEmployees, employee];
      return of(new HttpResponse({ status: 201, body: employee })).pipe(delay(150));
    }

    if (req.method === 'PUT') {
      const employee = req.body as Employee;
      mockEmployees = mockEmployees.map((current) => current.id === employee.id ? employee : current);
      return of(new HttpResponse({ status: 200, body: employee })).pipe(delay(150));
    }

    if (req.method === 'DELETE') {
      const employeeId = getResourceId(req.url, '/employees/');
      mockEmployees = mockEmployees.filter((employee) => employee.id !== employeeId);
      return of(new HttpResponse({ status: 204, body: null })).pipe(delay(150));
    }
  }

  return next(req);
};

function getResourceId(url: string, resourcePath: string): number | null {
  const value = url.split(resourcePath)[1];
  if (!value || value.includes('/')) {
    return null;
  }

  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

function nextId<T extends { id: number }>(items: T[]): number {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}