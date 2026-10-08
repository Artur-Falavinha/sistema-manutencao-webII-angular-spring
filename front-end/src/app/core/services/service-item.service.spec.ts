import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { serviceItemService } from './service-item.service';
import { API_URL } from '../configs/api.token';
import { ServiceItemDTO } from '../../shared/models/service-item.model';

/**
 * Contrato HTTP do catálogo de serviços usado no orçamento (RF012),
 * conferido contra o ServiceItemController do back-end de referência (/api/services).
 */
describe('serviceItemService (contrato HTTP)', () => {
  const apiUrl = 'http://localhost:8080/api';
  let service: serviceItemService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    // src/test.ts registra o mockApiInterceptor para todas as suítes; ele responderia
    // /services antes de a requisição chegar ao HttpTestingController.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: apiUrl },
      ],
    });
    service = TestBed.inject(serviceItemService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('RF012: lista os serviços via GET /services com nome e valorServico', () => {
    // ServiceItemDTO do back-end: { id, nome, valorServico } (BigDecimal vira número no JSON)
    const backendBody: ServiceItemDTO[] = [
      { id: 1, nome: 'Troca de tela', valorServico: 350.5 },
      { id: 2, nome: 'Limpeza interna', valorServico: 80 },
    ];

    let result: ServiceItemDTO[] | undefined;
    service.getAllServices().subscribe((data) => (result = data));

    const req = httpMock.expectOne(`${apiUrl}/services`);
    expect(req.request.method).toBe('GET');
    req.flush(backendBody);

    expect(result).toEqual(backendBody);
    // budget-delivery soma valorServico para montar o total do orçamento
    expect(result!.reduce((acc, s) => acc + s.valorServico, 0)).toBe(430.5);
  });
});
