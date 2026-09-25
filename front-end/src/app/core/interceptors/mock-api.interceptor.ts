import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
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
import { RequestHistory } from '../../shared/models/request-history';
import {
  getClientsForAuth,
  getLoggedInClientId,
  loadMockApiState,
  MockApiPersistedState,
  resetAllMockDataToSeed,
  saveMockApiState,
} from './mock-api.persistence';

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
 *   POST /requests/employee/{id}/redirect      -> RF015 redireciona manutenção (APROVADA/REDIRECIONADA → REDIRECIONADA)
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
const MOCK_AUTH_SESSION_KEY = 'mock-auth-session';

function resolveLoggedInClientId(): number {
  return getLoggedInClientId() ?? 1;
}

function getLoggedInEmployeeId(): number | null {
  const raw = sessionStorage.getItem(MOCK_AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const user = JSON.parse(raw) as { userAccess?: string; id?: number };
    return user.userAccess === 'employee' && user.id ? user.id : null;
  } catch {
    return null;
  }
}

function getRequestStatusName(request: Request): string {
  return request.status ?? MOCK_STATUSES.find((s) => s.id === request.statusId)?.nome ?? '';
}

function filterRequestsForLoggedEmployee(requests: Request[]): Request[] {
  const loggedEmployeeId = getLoggedInEmployeeId();

  return requests.filter((request) => {
    const statusName = getRequestStatusName(request);

    if (statusName === 'REDIRECIONADA') {
      return loggedEmployeeId !== null && request.employeeId === loggedEmployeeId;
    }

    return true;
  });
}

let mockRequests: Request[];
let mockCategories: Category[];
let mockEmployees: Employee[];
let mockBudgets: Budget[];
let mockMaintenanceRecords: Record<number, MaintenanceRecordDTO>;
let mockRequestHistory: Record<number, RequestHistory[]>;
let mockStateInitialized = false;

function seedMockApiStateFromFixtures(): void {
  mockRequests = MOCK_REQUESTS.map((request) => ({ ...request }));
  mockCategories = MOCK_CATEGORIES.map((category) => ({ ...category }));
  mockEmployees = MOCK_EMPLOYEES.map((employee) => ({ ...employee }));
  mockBudgets = MOCK_BUDGETS.map((budget) => ({ ...budget }));
  mockMaintenanceRecords = {};
  mockRequestHistory = Object.fromEntries(
    Object.entries(MOCK_REQUEST_HISTORY).map(([requestId, entries]) => [
      Number(requestId),
      entries.map((entry) => ({ ...entry })),
    ])
  );
}

function getMockApiSnapshot(): MockApiPersistedState {
  return {
    mockRequests,
    mockCategories,
    mockEmployees,
    mockBudgets,
    mockMaintenanceRecords,
    mockRequestHistory,
  };
}

function applyMockApiSnapshot(state: MockApiPersistedState): void {
  mockRequests = state.mockRequests.map((request) => ({
    ...request,
    requestDate:
      request.requestDate instanceof Date
        ? request.requestDate
        : new Date(request.requestDate),
  }));
  mockCategories = state.mockCategories.map((category) => ({ ...category }));
  mockEmployees = state.mockEmployees.map((employee) => ({ ...employee }));
  mockBudgets = state.mockBudgets.map((budget) => ({ ...budget }));
  mockMaintenanceRecords = { ...state.mockMaintenanceRecords };
  mockRequestHistory = Object.fromEntries(
    Object.entries(state.mockRequestHistory ?? {}).map(([requestId, entries]) => [
      Number(requestId),
      entries.map((entry) => ({ ...entry })),
    ])
  );
}

function persistMockApiState(): void {
  saveMockApiState(getMockApiSnapshot());
}

export function initializeMockApiState(): void {
  if (mockStateInitialized) {
    return;
  }

  mockStateInitialized = true;

  const persisted = loadMockApiState();
  if (persisted) {
    applyMockApiSnapshot(persisted);
    return;
  }

  seedMockApiStateFromFixtures();
  persistMockApiState();
}

export function resetMockApiState(): void {
  resetAllMockDataToSeed();
  mockStateInitialized = false;
  initializeMockApiState();
}

/** Limpa persistência mock + sessão e recarrega a aplicação na seed inicial. */
export function resetMockDataToSeed(): void {
  resetAllMockDataToSeed();
  window.location.href = '/login';
  window.location.reload();
}

function ensureMockApiStateInitialized(): void {
  if (!mockStateInitialized) {
    initializeMockApiState();
  }
}

function getClientName(clientId: number): string {
  return getClientsForAuth().find((client) => client.id === clientId)?.name ?? 'Cliente';
}

function getEmployeeName(employeeId: number | null | undefined): string {
  if (!employeeId) {
    return 'Funcionário';
  }

  return mockEmployees.find((employee) => employee.id === employeeId)?.name ?? 'Funcionário';
}

function getLoggedInUserName(): string {
  const raw = sessionStorage.getItem(MOCK_AUTH_SESSION_KEY);
  if (!raw) {
    return getClientName(resolveLoggedInClientId());
  }

  try {
    const user = JSON.parse(raw) as { userAccess?: string; id?: number; name?: string };
    if (user.name) {
      return user.name;
    }

    if (user.userAccess === 'employee' && user.id) {
      return getEmployeeName(user.id);
    }

    if (user.userAccess === 'client' && user.id) {
      return getClientName(user.id);
    }
  } catch {
    // fallback abaixo
  }

  return getClientName(resolveLoggedInClientId());
}

function nextHistoryId(): number {
  const allIds = Object.values(mockRequestHistory).flat().map((entry) => entry.id);
  return Math.max(0, ...allIds) + 1;
}

function addHistoryEntry(
  requestId: number,
  title: string,
  userName: string,
  statusName: string
): void {
  const status = MOCK_STATUSES.find((current) => current.nome === statusName);
  const entry: RequestHistory = {
    id: nextHistoryId(),
    title,
    occurrenceDate: new Date().toISOString(),
    userName,
    statusName,
    statusColor: status?.cor ?? '',
  };

  mockRequestHistory = {
    ...mockRequestHistory,
    [requestId]: [...(mockRequestHistory[requestId] ?? []), entry],
  };

  persistMockApiState();
}

function toResponseDTO(request: Request): MaintenanceRequestResponseDTO {
  const status = MOCK_STATUSES.find((s) => s.id === request.statusId);
  const category = MOCK_CATEGORIES.find((c) => c.id === request.categoryId);
  const client = getClientsForAuth().find((c) => c.id === request.clientId);

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
    history: mockRequestHistory[request.id] ?? [],
  };
}

function toEmployeeDetailDTO(request: Request): EmployeeRequestDetailDTO {
  const status = MOCK_STATUSES.find((s) => s.id === request.statusId);
  const category = MOCK_CATEGORIES.find((c) => c.id === request.categoryId);
  const client = getClientsForAuth().find((c) => c.id === request.clientId);
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
  ensureMockApiStateInitialized();

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
      const employeeResponses = filterRequestsForLoggedEmployee(mockRequests).map(toResponseDTO);
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
        .filter((request) => request.clientId === resolveLoggedInClientId())
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
        clientId: resolveLoggedInClientId(),
        employeeId: 0,
      };

      mockRequests = [created, ...mockRequests];
      addHistoryEntry(
        created.id,
        'Solicitação aberta',
        getClientName(created.clientId),
        'ABERTA'
      );

      return of(new HttpResponse({ status: 201, body: toResponseDTO(created) })).pipe(delay(150));
    }

    if (approveMatch) {
      const requestId = Number(approveMatch[1]);
      updateRequestStatus(requestId, 'APROVADA');
      addHistoryEntry(requestId, 'Orçamento Aprovado', getLoggedInUserName(), 'APROVADA');
      return of(new HttpResponse({ status: 200, body: null })).pipe(delay(150));
    }

    if (rejectMatch) {
      const requestId = Number(rejectMatch[1]);
      const payload = req.body as RejectionDTO;
      updateRequestStatus(requestId, 'REJEITADA', payload?.rejectionReason);
      addHistoryEntry(requestId, 'Orçamento Rejeitado', getLoggedInUserName(), 'REJEITADA');
      return of(new HttpResponse({ status: 200, body: null })).pipe(delay(150));
    }

    if (rescueMatch) {
      const id = Number(rescueMatch[1]);
      const request = mockRequests.find((r) => r.id === id);

      if (!request) {
        return of(new HttpResponse({ status: 404, body: { message: 'Solicitação não encontrada.' } })).pipe(delay(150));
      }

      const statusName = getRequestStatusName(request);

      if (statusName !== 'REJEITADA') {
        return of(
          new HttpResponse({
            status: 403,
            body: { message: 'Resgate só é permitido para solicitações rejeitadas.' },
          })
        ).pipe(delay(150));
      }

      updateRequestStatus(id, 'APROVADA');
      addHistoryEntry(
        id,
        'Orçamento resgatado de rejeitado para aprovado',
        getLoggedInUserName(),
        'APROVADA'
      );
      const updated = mockRequests.find((r) => r.id === id);

      return of(new HttpResponse({ status: 200, body: updated ? toResponseDTO(updated) : null })).pipe(delay(150));
    }

    if (payMatch) {
      const id = Number(payMatch[1]);
      const request = mockRequests.find((r) => r.id === id);

      if (!request) {
        return of(new HttpResponse({ status: 404, body: { message: 'Solicitação não encontrada.' } })).pipe(delay(150));
      }

      const statusName = getRequestStatusName(request);

      if (statusName === 'PAGA') {
        return of(
          new HttpResponse({ status: 403, body: { message: 'Esta solicitação já foi paga.' } })
        ).pipe(delay(150));
      }

      if (statusName !== 'ARRUMADA') {
        return of(
          new HttpResponse({
            status: 403,
            body: { message: 'Pagamento só é permitido após a manutenção ser concluída.' },
          })
        ).pipe(delay(150));
      }

      updateRequestStatus(id, 'PAGA');
      addHistoryEntry(id, 'Serviço pago', getLoggedInUserName(), 'PAGA');
      const updated = mockRequests.find((r) => r.id === id);

      return of(new HttpResponse({ status: 200, body: updated ? toResponseDTO(updated) : null })).pipe(delay(150));
    }

    if (redirectMatch) {
      const requestId = Number(redirectMatch[1]);
      const targetEmployeeId = Number(req.params.get('targetEmployeeId'));
      const loggedEmployeeId = getLoggedInEmployeeId();
      const request = mockRequests.find((r) => r.id === requestId);

      if (!request) {
        return of(new HttpResponse({ status: 404, body: { message: 'Solicitação não encontrada.' } })).pipe(delay(150));
      }

      if (!loggedEmployeeId) {
        return of(new HttpResponse({ status: 403, body: { message: 'Funcionário não autenticado.' } })).pipe(delay(150));
      }

      if (targetEmployeeId === loggedEmployeeId) {
        return of(
          new HttpResponse({ status: 403, body: { message: 'Não é permitido redirecionar para si mesmo.' } })
        ).pipe(delay(150));
      }

      if (!mockEmployees.some((employee) => employee.id === targetEmployeeId)) {
        return of(new HttpResponse({ status: 404, body: { message: 'Funcionário destino não encontrado.' } })).pipe(delay(150));
      }

      const statusName = getRequestStatusName(request);

      if (statusName !== 'APROVADA' && statusName !== 'REDIRECIONADA') {
        return of(
          new HttpResponse({
            status: 403,
            body: { message: 'Redirecionamento só é permitido após aprovação do orçamento.' },
          })
        ).pipe(delay(150));
      }

      if (mockMaintenanceRecords[requestId]) {
        return of(
          new HttpResponse({
            status: 403,
            body: { message: 'Não é possível redirecionar após registrar a manutenção.' },
          })
        ).pipe(delay(150));
      }

      if (statusName === 'REDIRECIONADA' && request.employeeId !== loggedEmployeeId) {
        return of(
          new HttpResponse({
            status: 403,
            body: { message: 'Somente o funcionário destino pode redirecionar esta solicitação.' },
          })
        ).pipe(delay(150));
      }

      mockRequests = mockRequests.map((r) =>
        r.id === requestId ? { ...r, employeeId: targetEmployeeId } : r
      );
      updateRequestStatus(requestId, 'REDIRECIONADA');
      addHistoryEntry(
        requestId,
        'Solicitação redirecionada',
        getLoggedInUserName(),
        'REDIRECIONADA'
      );

      const updated = mockRequests.find((r) => r.id === requestId);
      return of(new HttpResponse({ status: 200, body: updated ? toResponseDTO(updated) : null })).pipe(delay(150));
    }

    if (budgetMatch) {
      const requestId = Number(budgetMatch[1]);
      const payload = req.body as BudgetCreateDTO;
      const requestBeingBudgeted = mockRequests.find((r) => r.id === requestId);
      const loggedEmployeeId = getLoggedInEmployeeId();

      if (!requestBeingBudgeted) {
        return of(new HttpResponse({ status: 404, body: { message: 'Solicitação não encontrada.' } })).pipe(delay(150));
      }

      if (getRequestStatusName(requestBeingBudgeted) !== 'ABERTA') {
        return of(
          new HttpResponse({ status: 403, body: { message: 'Orçamento só pode ser registrado em solicitações ABERTAS.' } })
        ).pipe(delay(150));
      }

      if (mockBudgets.some((budget) => budget.requestId === requestId)) {
        return of(
          new HttpResponse({ status: 403, body: { message: 'Esta solicitação já possui orçamento.' } })
        ).pipe(delay(150));
      }

      const chosenServices = MOCK_SERVICE_ITEMS.filter((s) => payload.serviceIds.includes(s.id));
      const total = payload.total ?? chosenServices.reduce((acc, s) => acc + s.valorServico, 0);

      const budget: Budget = {
        id: nextId(mockBudgets),
        requestId,
        employeeId: loggedEmployeeId ?? 0,
        total,
        services: chosenServices.map((s) => s.nome).join(', '),
        serviceIds: payload.serviceIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockBudgets = [...mockBudgets, budget];
      mockRequests = mockRequests.map((request) =>
        request.id === requestId
          ? { ...request, employeeId: loggedEmployeeId ?? request.employeeId }
          : request
      );
      updateRequestStatus(requestId, 'ORÇADA');
      addHistoryEntry(
        requestId,
        'Orçamento efetuado',
        getLoggedInUserName(),
        'ORÇADA'
      );

      const updated = mockRequests.find((r) => r.id === requestId);
      return of(new HttpResponse({ status: 201, body: updated ? toResponseDTO(updated) : null })).pipe(delay(150));
    }

    if (maintenanceMatch) {
      const requestId = Number(maintenanceMatch[1]);
      const payload = req.body as MaintenanceRecordDTO;
      const request = mockRequests.find((r) => r.id === requestId);

      if (!request) {
        return of(new HttpResponse({ status: 404, body: { message: 'Solicitação não encontrada.' } })).pipe(delay(150));
      }

      const statusName = getRequestStatusName(request);
      const loggedEmployeeId = getLoggedInEmployeeId();
      const existing = mockMaintenanceRecords[requestId];
      const allowedForCreate = statusName === 'APROVADA' || statusName === 'REDIRECIONADA';
      const allowedForUpdate = statusName === 'APROVADA' || statusName === 'ARRUMADA';

      if (statusName === 'REDIRECIONADA' && request.employeeId !== loggedEmployeeId) {
        return of(
          new HttpResponse({
            status: 403,
            body: { message: 'Somente o funcionário destino pode registrar a manutenção.' },
          })
        ).pipe(delay(150));
      }

      if (!existing && !allowedForCreate) {
        return of(
          new HttpResponse({
            status: 403,
            body: { message: 'Manutenção só pode ser registrada após aprovação do orçamento.' },
          })
        ).pipe(delay(150));
      }

      if (existing && !allowedForUpdate) {
        return of(
          new HttpResponse({
            status: 403,
            body: { message: 'Não é permitido alterar a manutenção neste status.' },
          })
        ).pipe(delay(150));
      }

      mockMaintenanceRecords = {
        ...mockMaintenanceRecords,
        [requestId]: {
          id: existing?.id ?? Object.keys(mockMaintenanceRecords).length + 1,
          maintenanceDescription: payload.maintenanceDescription,
          clientGuidelines: payload.clientGuidelines,
          finishedAt: new Date().toISOString(),
        },
      };

      if (!existing) {
        updateRequestStatus(requestId, 'ARRUMADA');
        addHistoryEntry(
          requestId,
          'Manutenção efetuada',
          getLoggedInUserName(),
          'ARRUMADA'
        );

        if (loggedEmployeeId) {
          mockRequests = mockRequests.map((current) =>
            current.id === requestId ? { ...current, employeeId: loggedEmployeeId } : current
          );
        }
      } else {
        persistMockApiState();
      }

      const updated = mockRequests.find((r) => r.id === requestId);
      return of(new HttpResponse({ status: 200, body: updated ? toResponseDTO(updated) : null })).pipe(delay(150));
    }

    if (finalizeMatch) {
      const requestId = Number(finalizeMatch[1]);
      updateRequestStatus(requestId, 'FINALIZADA');
      addHistoryEntry(
        requestId,
        'Solicitação Finalizada',
        getLoggedInUserName(),
        'FINALIZADA'
      );

      const updated = mockRequests.find((r) => r.id === requestId);
      return of(new HttpResponse({ status: 200, body: updated ? toResponseDTO(updated) : null })).pipe(delay(150));
    }
  }

  if (req.url.includes('/categories')) {
    if (req.method === 'POST') {
      const category = { ...(req.body as Category), id: nextId(mockCategories) };
      mockCategories = [...mockCategories, category];
      persistMockApiState();
      return of(new HttpResponse({ status: 201, body: category })).pipe(delay(150));
    }

    if (req.method === 'PUT') {
      const category = req.body as Category;
      mockCategories = mockCategories.map((current) => current.id === category.id ? category : current);
      persistMockApiState();
      return of(new HttpResponse({ status: 200, body: category })).pipe(delay(150));
    }

    if (req.method === 'DELETE') {
      const categoryId = getResourceId(req.url, '/categories/');
      mockCategories = mockCategories.filter((category) => category.id !== categoryId);
      persistMockApiState();
      return of(new HttpResponse({ status: 204, body: null })).pipe(delay(150));
    }
  }

  if (req.url.includes('/employees')) {
    if (req.method === 'POST') {
      const employee = { ...(req.body as Employee), id: nextId(mockEmployees) };
      mockEmployees = [...mockEmployees, employee];
      persistMockApiState();
      return of(new HttpResponse({ status: 201, body: employee })).pipe(delay(150));
    }

    if (req.method === 'PUT') {
      const employee = req.body as Employee;
      mockEmployees = mockEmployees.map((current) => current.id === employee.id ? employee : current);
      persistMockApiState();
      return of(new HttpResponse({ status: 200, body: employee })).pipe(delay(150));
    }

    if (req.method === 'DELETE') {
      const employeeId = getResourceId(req.url, '/employees/');
      const loggedEmployeeId = getLoggedInEmployeeId();

      if (loggedEmployeeId && employeeId === loggedEmployeeId) {
        return throwError(() => ({ status: 400, error: 'Não é permitido remover o funcionário autenticado.' }));
      }

      mockEmployees = mockEmployees.filter((employee) => employee.id !== employeeId);
      persistMockApiState();
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