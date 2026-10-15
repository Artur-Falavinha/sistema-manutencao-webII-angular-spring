import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, UserState } from './auth.service';
import { API_URL } from '../../configs/api.token';
import { RegisterRequest } from '../../../shared/models/register-request';
import { resetMockApiState } from '../../interceptors/mock-api.interceptor';
import {
  loadRegisteredClients,
  MOCK_AUTH_SESSION_KEY,
} from '../../interceptors/mock-api.persistence';

const registerData: RegisterRequest = {
  name: 'Novo Usuário',
  cpf: '529.982.247-25',
  email: 'novo@example.com',
  phoneNumber: '41999999999',
  zipCode: '80010000',
  street: 'Rua Teste',
  number: '123',
  neighborhood: 'Centro',
  city: 'Curitiba',
  state: 'PR',
};

function clearSession(): void {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('token');
  sessionStorage.clear();
}

describe('AuthService (contrato HTTP)', () => {
  const apiUrl = 'http://localhost:8080/api';
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    clearSession();
    // src/test.ts registra o mockApiInterceptor para todas as suítes; ele responderia
    // /auth/** antes de a requisição chegar ao HttpTestingController.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: apiUrl },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    clearSession();
  });

  function loginAs(body: object): void {
    service.login('qualquer@example.com', 'senha').subscribe();
    httpMock.expectOne(`${apiUrl}/auth/login`).flush(body);
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('POST /auth/login envia e-mail e senha e abre a sessão do cliente', () => {
    const emitted: UserState[] = [];
    service.login('ana@example.com', 'secret').subscribe((user) => emitted.push(user));

    const req = httpMock.expectOne(`${apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ana@example.com', password: 'secret' });
    req.flush({ token: 'jwt-123', userName: 'Ana', userRole: 'ROLE_CLIENT' });

    expect(emitted.length).toBe(1);
    expect(emitted[0]?.userAccess).toBe('client');
    expect(emitted[0]?.name).toBe('Ana');
    expect(service.currentUserValue?.token).toBe('jwt-123');
    expect(localStorage.getItem('token')).toBe('jwt-123');
    expect(JSON.parse(localStorage.getItem('currentUser') ?? 'null').name).toBe('Ana');
  });

  it('mapeia ROLE_EMPLOYEE para funcionário', () => {
    loginAs({ token: 'jwt', userName: 'João', userRole: 'ROLE_EMPLOYEE' });

    expect(service.currentUserValue?.userAccess).toBe('employee');
  });

  it('trata perfil desconhecido como cliente, como a referência', () => {
    loginAs({ token: 'jwt', userName: 'Alguém', userRole: 'ROLE_OUTRO' });

    expect(service.currentUserValue?.userAccess).toBe('client');
  });

  it('propaga o 401 do login e não abre sessão', () => {
    const errors: HttpErrorResponse[] = [];
    service.login('x@example.com', 'errada').subscribe({
      error: (err: HttpErrorResponse) => errors.push(err),
    });

    httpMock
      .expectOne(`${apiUrl}/auth/login`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(errors.length).toBe(1);
    expect(errors[0].status).toBe(401);
    expect(service.currentUserValue).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('POST /auth/register envia os dados do cadastro', () => {
    const completions: string[] = [];
    service.signup(registerData).subscribe({ complete: () => completions.push('ok') });

    const req = httpMock.expectOne(`${apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(registerData);
    req.flush(null, { status: 201, statusText: 'Created' });

    expect(completions.length).toBe(1);
  });

  it('propaga o 400 do cadastro duplicado', () => {
    const errors: HttpErrorResponse[] = [];
    service.signup(registerData).subscribe({
      error: (err: HttpErrorResponse) => errors.push(err),
    });

    httpMock
      .expectOne(`${apiUrl}/auth/register`)
      .flush('CPF já cadastrado.', { status: 400, statusText: 'Bad Request' });

    expect(errors[0].status).toBe(400);
    expect(errors[0].error).toBe('CPF já cadastrado.');
  });

  it('restaura a sessão salva em localStorage ao iniciar', () => {
    localStorage.setItem(
      'currentUser',
      JSON.stringify({ name: 'Ana', userAccess: 'client', token: 'jwt' }),
    );

    const restored = TestBed.runInInjectionContext(() => new AuthService());

    expect(restored.currentUserValue?.name).toBe('Ana');
  });

  it('descarta uma sessão corrompida e volta para o login', () => {
    localStorage.setItem('currentUser', '{invalido');
    spyOn(console, 'error');
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');

    const restored = TestBed.runInInjectionContext(() => new AuthService());

    expect(restored.currentUserValue).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('logout limpa a sessão e navega para /login', () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    loginAs({ token: 'jwt', userName: 'Ana', userRole: 'ROLE_CLIENT' });

    service.logout();

    expect(service.currentUserValue).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(sessionStorage.getItem(MOCK_AUTH_SESSION_KEY)).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('publica isLoggedIn$ e isEmployee$ depois do login', () => {
    const logged: boolean[] = [];
    const employee: boolean[] = [];
    service.isLoggedIn$.subscribe((value) => logged.push(value));
    service.isEmployee$.subscribe((value) => employee.push(value));

    loginAs({ token: 'jwt', userName: 'João', userRole: 'ROLE_EMPLOYEE' });

    expect(logged).toEqual([false, true]);
    expect(employee).toEqual([false, true]);
  });

  it('(scaffold) guarda id e e-mail do mock e espelha a sessão para a API simulada', () => {
    loginAs({
      token: 'mock-employee-1',
      userName: 'João',
      userRole: 'ROLE_EMPLOYEE',
      userId: 1,
      userEmail: 'func1@mant.com',
    });

    expect(service.currentUserValue?.id).toBe(1);
    expect(service.currentUserValue?.email).toBe('func1@mant.com');

    const mirrored = JSON.parse(sessionStorage.getItem(MOCK_AUTH_SESSION_KEY) ?? 'null');
    expect(mirrored.id).toBe(1);
    expect(mirrored.userAccess).toBe('employee');
  });

  it('(scaffold) updateCurrentUser atualiza nome e e-mail e persiste', () => {
    loginAs({ token: 'jwt', userName: 'Ana', userRole: 'ROLE_CLIENT' });

    service.updateCurrentUser({ name: 'Ana Maria', email: 'ana.maria@example.com' });

    expect(service.currentUserValue?.name).toBe('Ana Maria');
    expect(JSON.parse(localStorage.getItem('currentUser') ?? 'null').email).toBe(
      'ana.maria@example.com',
    );
  });

  it('(scaffold) updateCurrentUser não faz nada sem sessão', () => {
    service.updateCurrentUser({ name: 'Ninguém' });

    expect(service.currentUserValue).toBeNull();
  });

  it('(scaffold) syncEmployeeSessionFromMock atualiza nome e e-mail pelo mock', () => {
    loginAs({
      token: 'mock-employee-1',
      userName: 'Nome Desatualizado',
      userRole: 'ROLE_EMPLOYEE',
      userId: 1,
      userEmail: 'antigo@example.com',
    });

    service.syncEmployeeSessionFromMock();

    expect(service.currentUserValue?.name).toBe('João Pedro Alves');
    expect(service.currentUserValue?.email).toBe('func1@mant.com');
  });

  it('(scaffold) syncEmployeeSessionFromMock restaura o espelho da sessão', () => {
    loginAs({ token: 'jwt', userName: 'Ana', userRole: 'ROLE_CLIENT', userId: 1 });
    sessionStorage.removeItem(MOCK_AUTH_SESSION_KEY);

    service.syncEmployeeSessionFromMock();

    expect(sessionStorage.getItem(MOCK_AUTH_SESSION_KEY)).not.toBeNull();
  });
});

describe('AuthService (com a API simulada)', () => {
  let service: AuthService;

  beforeEach(() => {
    clearSession();
    resetMockApiState();
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    clearSession();
  });

  it('autentica um cliente pelo /auth/login simulado', (done) => {
    service.login('cli1@mant.com', 'tads').subscribe(() => {
      expect(service.currentUserValue?.userAccess).toBe('client');
      expect(service.currentUserValue?.token).toBe('mock-client-1');
      expect(service.currentUserValue?.name).toBe('Ana Beatriz Souza');
      expect(service.currentUserValue?.id).toBe(1);
      done();
    });
  });

  it('autentica um funcionário e normaliza o e-mail', (done) => {
    service.login('  FUNC1@MANT.COM  ', 'tads').subscribe(() => {
      expect(service.currentUserValue?.userAccess).toBe('employee');
      expect(service.currentUserValue?.token).toBe('mock-employee-1');
      expect(service.currentUserValue?.email).toBe('func1@mant.com');
      done();
    });
  });

  it('rejeita credenciais inválidas com 401', (done) => {
    service.login('unknown@example.com', 'wrong-password').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
        expect(service.currentUserValue).toBeNull();
        done();
      },
    });
  });

  it('rejeita cadastro com CPF já existente entre os clientes', (done) => {
    service.signup({ ...registerData, cpf: '123.456.789-00' }).subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(400);
        expect(err.error).toBe('CPF já cadastrado.');
        done();
      },
    });
  });

  it('rejeita cadastro com e-mail já usado por um cliente', (done) => {
    service.signup({ ...registerData, email: 'cli1@mant.com' }).subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(400);
        expect(err.error).toBe('E-mail já cadastrado.');
        done();
      },
    });
  });

  it('rejeita cadastro com e-mail já usado por um funcionário', (done) => {
    service.signup({ ...registerData, email: 'func1@mant.com' }).subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.error).toBe('E-mail já cadastrado.');
        done();
      },
    });
  });

  it('cadastra um cliente novo que entra com a senha gerada', (done) => {
    service.signup(registerData).subscribe(() => {
      const created = loadRegisteredClients().find(
        (client) => client.email === 'novo@example.com',
      );
      expect(created?.password).toMatch(/^\d{4}$/);

      service.login('novo@example.com', created!.password).subscribe(() => {
        expect(service.currentUserValue?.userAccess).toBe('client');
        expect(service.currentUserValue?.email).toBe('novo@example.com');
        done();
      });
    });
  });
});
