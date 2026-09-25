import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { resetMockApiState } from '../../interceptors/mock-api.interceptor';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    resetMockApiState();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('authenticates a client from the local mock', () => {
    service.login('cli1@mant.com', 'tads').subscribe();

    expect(service.currentUserValue?.userAccess).toBe('client');
    expect(service.currentUserValue?.token).toBe('mock-client-1');
    expect(service.currentUserValue?.name).toBe('Ana Beatriz Souza');
  });

  it('authenticates an employee from the local mock', () => {
    service.login('func1@mant.com', 'tads').subscribe();

    expect(service.currentUserValue?.userAccess).toBe('employee');
    expect(service.currentUserValue?.token).toBe('mock-employee-1');
    expect(service.currentUserValue?.name).toBe('João Pedro Alves');
  });

  it('normalizes the email before looking up a mock user', () => {
    service.login('  FUNC1@MANT.COM  ', 'tads').subscribe();

    expect(service.currentUserValue?.email).toBe('func1@mant.com');
    expect(service.currentUserValue?.userAccess).toBe('employee');
  });

  it('returns a logged-out state for invalid credentials', () => {
    service.login('unknown@example.com', 'wrong-password').subscribe();

    expect(service.currentUserValue).toBeNull();
  });

  it('clears the shared session on logout', () => {
    service.login('func1@mant.com', 'tads').subscribe();
    expect(service.currentUserValue).not.toBeNull();

    service.logout();

    expect(service.currentUserValue).toBeNull();
  });

  it('publishes the logged-in state through the shared observable', () => {
    let isLoggedIn = false;
    service.isLoggedIn$.subscribe((value) => isLoggedIn = value);

    service.login('func1@mant.com', 'tads').subscribe();

    expect(isLoggedIn).toBeTrue();
  });

  it('identifies employee sessions through the shared observable', () => {
    let isEmployee = false;
    service.isEmployee$.subscribe((value) => isEmployee = value);

    service.login('func1@mant.com', 'tads').subscribe();

    expect(isEmployee).toBeTrue();
  });
    it('rejects signup with a CPF that already exists in the mocks', (done) => {
    service.signup({
      name: 'Novo Usuário',
      cpf: '123.456.789-00',
      email: 'novo@example.com',
      phoneNumber: '11999999999',
      zipCode: '00000000',
      street: 'Rua Teste',
      number: '1',
      neighborhood: 'Centro',
      city: 'Curitiba',
      state: 'PR',
    }).subscribe({
      error: (err) => {
        expect(err.message).toBe('CPF já cadastrado.');
        done();
      },
    });
  });

  it('rejects signup with an email that already exists in the mocks', (done) => {
    service.signup({
      name: 'Novo Usuário',
      cpf: '000.000.000-00',
      email: 'cli1@mant.com',
      phoneNumber: '11999999999',
      zipCode: '00000000',
      street: 'Rua Teste',
      number: '1',
      neighborhood: 'Centro',
      city: 'Curitiba',
      state: 'PR',
    }).subscribe({
      error: (err) => {
        expect(err.message).toBe('E-mail já cadastrado.');
        done();
      },
    });
  });

  it('accepts signup with unique CPF and email', (done) => {
    service.signup({
      name: 'Novo Usuário',
      cpf: '000.000.000-00',
      email: 'novo@example.com',
      phoneNumber: '11999999999',
      zipCode: '00000000',
      street: 'Rua Teste',
      number: '1',
      neighborhood: 'Centro',
      city: 'Curitiba',
      state: 'PR',
    }).subscribe({
      next: (result) => {
        expect(result.generatedPassword).toMatch(/^\d{4}$/);

        service.login('novo@example.com', result.generatedPassword).subscribe({
          next: () => {
            expect(service.currentUserValue?.userAccess).toBe('client');
            expect(service.currentUserValue?.email).toBe('novo@example.com');
            done();
          },
        });
      },
    });
  });

  it('navigates to /login on logout', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');

    service.login('func1@mant.com', 'tads').subscribe();
    service.logout();

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
