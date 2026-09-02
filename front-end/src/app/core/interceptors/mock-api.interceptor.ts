import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MOCK_STATUSES } from '../../shared/mocks/status.mock';
import { MOCK_CATEGORIES } from '../../shared/mocks/category.mock';
import { MOCK_EMPLOYEE_REQUESTS } from '../../shared/mocks/maintenance-request.mock';
import { MOCK_REQUESTS } from '../../shared/mocks/request.mock';
import { MOCK_CLIENTS } from '../../shared/mocks/client.mock';
import { MOCK_EMPLOYEES } from '../../shared/mocks/employee.mock';
import { Category } from '../../shared/models/category';
import { Employee } from '../../shared/models/employee';
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
 *   GET  /categories         -> lista simulada de categorias
 *   POST/PUT/DELETE /categories -> CRUD simulado de categorias
 *   GET/POST/PUT/DELETE /employees -> CRUD simulado de funcionários
 *
 * Remover este arquivo e a linha correspondente em app.config.ts quando os
 * services HTTP reais forem integrados (marco 08/10 para requests,
 * 15/10 para o restante do backend).
 */
const LOGGED_IN_CLIENT_ID = 1;

let mockRequests: Request[];
let mockCategories: Category[];
let mockEmployees: Employee[];

export function resetMockApiState(): void {
  mockRequests = MOCK_REQUESTS.map((request) => ({ ...request }));
  mockCategories = MOCK_CATEGORIES.map((category) => ({ ...category }));
  mockEmployees = MOCK_EMPLOYEES.map((employee) => ({ ...employee }));
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
