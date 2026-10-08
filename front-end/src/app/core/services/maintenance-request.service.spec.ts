import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MaintenanceRequestService } from './maintenance-request.service';
import { API_URL } from '../configs/api.token';
import {
  EmployeeRequestDetailDTO,
  MaintenanceRequestResponseDTO,
} from '../../shared/models/maintenance-request.models';
import { BudgetCreateDTO } from '../../shared/models/budget.model';
import { MaintenanceRecordDTO } from '../../shared/models/maintenance-record.model';

/**
 * Contrato HTTP da jornada do funcionário (RF011–RF016), conferido contra o
 * MaintenanceRequestController do back-end de referência (/api/requests/employee/**).
 */
describe('MaintenanceRequestService (contrato HTTP do funcionário)', () => {
  const apiUrl = 'http://localhost:8080/api';
  let service: MaintenanceRequestService;
  let httpMock: HttpTestingController;

  const responseDTO: MaintenanceRequestResponseDTO = {
    id: 7,
    equipmentName: 'Notebook Dell',
    defectDescription: 'Não liga',
    requestDate: '2026-10-01T09:30:00',
    statusName: 'ORÇADA',
    statusColor: '#7C3804',
    categoryName: 'Notebook',
    clientName: 'Maria Silva',
  };

  beforeEach(() => {
    // src/test.ts registra o mockApiInterceptor para todas as suítes; ele responderia
    // /requests/employee/** antes de a requisição chegar ao HttpTestingController.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: apiUrl },
      ],
    });
    service = TestBed.inject(MaintenanceRequestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('RF011: lista as solicitações via GET /requests/employee', () => {
    let result: MaintenanceRequestResponseDTO[] | undefined;
    service.getAllEmployeeRequests().subscribe((data) => (result = data));

    const req = httpMock.expectOne(`${apiUrl}/requests/employee`);
    expect(req.request.method).toBe('GET');
    req.flush([responseDTO]);

    expect(result).toEqual([responseDTO]);
  });

  it('RF012–RF016: busca o detalhe via GET /requests/employee/{id} no formato do back-end', () => {
    // JSON como o EmployeeRequestDetailDTO do back-end serializa: status como objeto
    // {id, nome, cor} (StatusEnum com @JsonFormat OBJECT) e client como ClientDTO plano.
    const backendBody = {
      id: 7,
      equipmentName: 'Notebook Dell',
      defectDescription: 'Não liga',
      requestDate: '2026-10-01T09:30:00',
      status: { id: 4, nome: 'APROVADA', cor: '#FFAE36' },
      categoryName: 'Notebook',
      client: {
        id: 3,
        name: 'Maria Silva',
        email: 'maria@email.com',
        cpf: '12345678909',
        phoneNumber: '41999990000',
        zipCode: '80000000',
        street: 'Rua XV de Novembro',
        number: '100',
        complement: null,
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
      },
      assignedEmployeeName: 'Mário',
      budgets: [
        {
          id: 1,
          requestId: 7,
          employeeId: 2,
          total: 350.5,
          services: 'Troca de tela',
          serviceIds: [1],
          createdAt: '2026-10-02T10:00:00',
          updatedAt: '2026-10-02T10:00:00',
        },
      ],
      maintenanceRecord: null,
    };

    let result: EmployeeRequestDetailDTO | undefined;
    service.getRequestByIdForEmployee(7).subscribe((data) => (result = data));

    const req = httpMock.expectOne(`${apiUrl}/requests/employee/7`);
    expect(req.request.method).toBe('GET');
    req.flush(backendBody);

    // Campos que a tela budget-delivery lê do detalhe
    expect(result?.status.nome).toBe('APROVADA');
    expect(result?.status.cor).toBe('#FFAE36');
    expect(result?.client.name).toBe('Maria Silva');
    expect(result?.assignedEmployeeName).toBe('Mário');
    expect(result?.budgets[0].total).toBe(350.5);
    expect(result?.budgets[0].services).toBe('Troca de tela');
  });

  it('RF012: envia o orçamento via POST /requests/employee/{id}/budget com serviceIds e total', () => {
    const payload: BudgetCreateDTO = { serviceIds: [1, 3], total: 480 };

    service.createBudget(7, payload).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/requests/employee/7/budget`);
    expect(req.request.method).toBe('POST');
    // O BudgetDTO do back-end lê o valor do campo "total"
    expect(req.request.body).toEqual({ serviceIds: [1, 3], total: 480 });
    req.flush({ ...responseDTO, statusName: 'ORÇADA' });
  });

  it('RF014: registra a manutenção via POST /requests/employee/{id}/maintenance', () => {
    const payload: MaintenanceRecordDTO = {
      id: 0,
      maintenanceDescription: 'Troca do conector de energia',
      clientGuidelines: 'Evitar usar carregador paralelo',
    };

    service.executeMaintenance(7, payload).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/requests/employee/7/maintenance`);
    expect(req.request.method).toBe('POST');
    // Os dois textos são @NotBlank no MaintenanceRecordDTO do back-end
    expect(req.request.body.maintenanceDescription).toBe(payload.maintenanceDescription);
    expect(req.request.body.clientGuidelines).toBe(payload.clientGuidelines);
    req.flush({ ...responseDTO, statusName: 'ARRUMADA' });
  });

  it('RF015: redireciona via POST /requests/employee/{id}/redirect com targetEmployeeId na query string', () => {
    service.redirectMaintenance(7, 5).subscribe();

    const req = httpMock.expectOne(
      (request) => request.url === `${apiUrl}/requests/employee/7/redirect`
    );
    expect(req.request.method).toBe('POST');
    // O back-end lê @RequestParam targetEmployeeId, não o corpo
    expect(req.request.params.get('targetEmployeeId')).toBe('5');
    expect(req.request.body).toBeNull();
    req.flush({ ...responseDTO, statusName: 'REDIRECIONADA' });
  });

  it('RF016: finaliza via POST /requests/employee/{id}/finalize sem dados no corpo', () => {
    service.finalizeRequest(7).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/requests/employee/7/finalize`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ ...responseDTO, statusName: 'FINALIZADA' });
  });

  it('propaga o erro do back-end (ex.: 403 do @PreAuthorize sem papel EMPLOYEE)', () => {
    let status: number | undefined;
    service.getAllEmployeeRequests().subscribe({ error: (err) => (status = err.status) });

    httpMock
      .expectOne(`${apiUrl}/requests/employee`)
      .flush(null, { status: 403, statusText: 'Forbidden' });

    expect(status).toBe(403);
  });
});
