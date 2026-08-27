import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MOCK_STATUSES } from '../../shared/mocks/status.mock';
import { MOCK_CATEGORIES } from '../../shared/mocks/category.mock';
import { MOCK_EMPLOYEE_REQUESTS } from '../../shared/mocks/maintenance-request.mock';

/**
 * SCAFFOLD TEMPORÁRIO — declarado no plano do semestre.
 *
 * Intercepta chamadas HTTP feitas pelos services migrados literalmente
 * (status.service.ts, maintenance-request.service.ts, category.service.ts)
 * e devolve dados simulados no shape real dos DTOs. Nenhum desses services
 * foi alterado — a "troca de motor" acontece só aqui.
 *
 * Rotas cobertas hoje (RF011/RF012, visão funcionário):
 *   GET /status-enum          -> MOCK_STATUSES
 *   GET /requests/employee    -> MOCK_EMPLOYEE_REQUESTS
 *   GET /categories           -> MOCK_CATEGORIES
 *
 * Remover este arquivo e a linha correspondente em app.config.ts quando os
 * services HTTP reais forem integrados (marco 08/10 para requests,
 * 15/10 para o restante do backend).
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req);
  }

  if (req.url.endsWith('/status-enum')) {
    return of(new HttpResponse({ status: 200, body: MOCK_STATUSES })).pipe(delay(150));
  }

  if (req.url.endsWith('/requests/employee')) {
    return of(new HttpResponse({ status: 200, body: MOCK_EMPLOYEE_REQUESTS })).pipe(delay(150));
  }

  if (req.url.endsWith('/categories')) {
    return of(new HttpResponse({ status: 200, body: MOCK_CATEGORIES })).pipe(delay(150));
  }

  return next(req);
};
