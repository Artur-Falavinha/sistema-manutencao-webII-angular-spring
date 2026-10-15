import {
  HttpErrorResponse,
  HttpEvent,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Estado } from '../../shared/models/address';
import { Client } from '../../shared/models/client';
import { RegisterRequest } from '../../shared/models/register-request';
import {
  getClientsForAuth,
  getEmployeesForAuth,
  saveRegisteredClient,
} from './mock-api.persistence';

type MockResult = Observable<HttpEvent<unknown>>;

const MOCK_DELAY_MS = 150;

export function handleMockAuthRequest(req: HttpRequest<unknown>): MockResult | null {
  if (req.method !== 'POST') {
    return null;
  }

  if (req.url.endsWith('/auth/login')) {
    return mockLogin(req);
  }

  if (req.url.endsWith('/auth/register')) {
    return mockRegister(req);
  }

  return null;
}

function mockLogin(req: HttpRequest<unknown>): MockResult {
  const body = (req.body ?? {}) as { email?: string; password?: string };
  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';

  const client = getClientsForAuth().find(
    (candidate) =>
      candidate.email.toLowerCase() === email && candidate.password === password,
  );

  if (client) {
    return respond(200, {
      token: `mock-client-${client.id}`,
      userName: client.name,
      userRole: 'ROLE_CLIENT',
      userId: client.id,
      userEmail: client.email,
    });
  }

  const employee = getEmployeesForAuth().find(
    (candidate) =>
      candidate.email.toLowerCase() === email && candidate.password === password,
  );

  if (employee) {
    return respond(200, {
      token: `mock-employee-${employee.id}`,
      userName: employee.name,
      userRole: 'ROLE_EMPLOYEE',
      userId: employee.id,
      userEmail: employee.email,
    });
  }

  return fail(req, 401, 'Unauthorized', null);
}

function mockRegister(req: HttpRequest<unknown>): MockResult {
  const data = req.body as RegisterRequest;
  const cpf = onlyDigits(data.cpf);
  const email = data.email.trim().toLowerCase();
  const clients = getClientsForAuth();

  if (clients.some((client) => onlyDigits(client.cpf) === cpf)) {
    return fail(req, 400, 'Bad Request', 'CPF já cadastrado.');
  }

  const emailInUse =
    clients.some((client) => client.email.toLowerCase() === email) ||
    getEmployeesForAuth().some((employee) => employee.email.toLowerCase() === email);

  if (emailInUse) {
    return fail(req, 400, 'Bad Request', 'E-mail já cadastrado.');
  }

  const newClient = buildClient(data, email, cpf, generateRandomPassword(), clients);
  saveRegisteredClient(newClient);

  return respond(201, {
    id: newClient.id,
    name: newClient.name,
    email,
    cpf,
    phoneNumber: onlyDigits(data.phoneNumber),
    zipCode: onlyDigits(data.zipCode),
    street: data.street,
    number: data.number,
    complement: data.complement,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
  });
}

function respond(status: number, body: unknown): MockResult {
  return of(new HttpResponse<unknown>({ status, body })).pipe(delay(MOCK_DELAY_MS));
}

function fail(
  req: HttpRequest<unknown>,
  status: number,
  statusText: string,
  error: unknown,
): MockResult {
  return throwError(
    () => new HttpErrorResponse({ status, statusText, error, url: req.url }),
  );
}

function buildClient(
  data: RegisterRequest,
  email: string,
  cpf: string,
  password: string,
  existing: Client[],
): Client {
  return {
    id: Math.max(0, ...existing.map((client) => client.id)) + 1,
    name: data.name.trim(),
    email,
    cpf: formatCpf(cpf),
    phoneNumber: formatPhone(data.phoneNumber),
    password,
    userAccess: 'client',
    address: {
      id: Math.max(0, ...existing.map((client) => client.address?.id ?? 0)) + 1,
      cep: formatCep(data.zipCode),
      logradouro: data.street.trim(),
      complemento: data.complement?.trim() || undefined,
      bairro: data.neighborhood.trim(),
      cidade: data.city.trim(),
      estado: toEstado(data.state),
    },
  };
}

function generateRandomPassword(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

function onlyDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

function formatCpf(digits: string): string {
  const value = digits.padStart(11, '0').slice(-11);
  return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
}

function formatPhone(digits: string): string {
  const value = digits.replace(/\D/g, '').slice(-11);
  if (value.length !== 11) {
    return digits;
  }

  return `(${value.slice(0, 2)}) ${value.slice(2, 3)} ${value.slice(3, 7)}-${value.slice(7)}`;
}

function formatCep(digits: string): string {
  const value = digits.replace(/\D/g, '').slice(-8);
  if (value.length !== 8) {
    return digits;
  }

  return `${value.slice(0, 5)}-${value.slice(5)}`;
}

function toEstado(value: string): Estado {
  const normalized = value.trim().toUpperCase();
  return Object.values(Estado).includes(normalized as Estado)
    ? (normalized as Estado)
    : Estado.PR;
}
