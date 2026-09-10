import { HttpRequest, HttpResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { MOCK_CATEGORIES } from '../../shared/mocks/category.mock';
import { MOCK_EMPLOYEES } from '../../shared/mocks/employee.mock';
import { Category } from '../../shared/models/category';
import { Employee } from '../../shared/models/employee';
import { mockApiInterceptor, resetMockApiState } from './mock-api.interceptor';

describe('mockApiInterceptor', () => {
  beforeEach(() => {
    resetMockApiState();
  });

  const next = () => {
    throw new Error('A rota deveria ser atendida pelo mock.');
  };

  it('returns the local category catalog without a backend', async () => {
    const request = new HttpRequest('GET', 'http://localhost:8080/api/categories');
    const response = await firstValueFrom(mockApiInterceptor(request, next)) as HttpResponse<Category[]>;

    expect(response).toBeInstanceOf(HttpResponse);
    expect(response.body).toEqual(MOCK_CATEGORIES);
  });

  it('creates an employee and assigns the next local id', async () => {
    const employee: Employee = {
      id: 0,
      name: 'Funcionário de Teste',
      email: 'teste@mant.com',
      cpf: '529.982.247-25',
      phone: '(41) 99999-9999',
      birthDate: '1995-01-20',
      wage: 2800,
      password: 'tads',
      active: true,
    };
    const request = new HttpRequest('POST', 'http://localhost:8080/api/employees', employee);
    const response = await firstValueFrom(mockApiInterceptor(request, next)) as HttpResponse<Employee>;

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ ...employee, id: MOCK_EMPLOYEES.length + 1 });
  });

  it('updates a category in the local collection', async () => {
    const category: Category = {
      ...MOCK_CATEGORIES[0],
      name: 'Eletrônicos revisados',
    };
    const request = new HttpRequest('PUT', `http://localhost:8080/api/categories/${category.id}`, category);
    const response = await firstValueFrom(mockApiInterceptor(request, next)) as HttpResponse<Category>;

    expect(response.status).toBe(200);
    expect(response.body).toEqual(category);
  });
});
