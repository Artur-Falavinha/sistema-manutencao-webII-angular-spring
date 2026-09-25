import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable, of, tap, throwError } from 'rxjs';
import { Estado } from '../../../shared/models/address';
import { Client } from '../../../shared/models/client';
import {
  getClientsForAuth,
  getEmployeesForAuth,
  loadRegisteredClients,
  MOCK_AUTH_SESSION_KEY,
  saveRegisteredClient,
} from '../../interceptors/mock-api.persistence';
import { RegisterRequest } from '../../../shared/models/register-request';

export type UserState = {
  id?: number;
  name: string;
  email?: string;
  userAccess: 'employee' | 'client';
  token: string;
} | null;

export interface SignupResult {
  generatedPassword: string;
}

const SESSION_STORAGE_KEY = MOCK_AUTH_SESSION_KEY;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<UserState>(
    this.readFromStorage(),
  );

  readonly currentUser$ = this.currentUserSubject.asObservable();

  readonly isEmployee$: Observable<boolean> = this.currentUser$.pipe(
    map((user) => user?.userAccess === 'employee'),
  );

  readonly isLoggedIn$: Observable<boolean> = this.currentUser$.pipe(
    map((user) => user !== null),
  );

  get currentUserValue(): UserState {
    return this.currentUserSubject.value;
  }

  constructor(private router: Router) {}

  login(email: string, password: string): Observable<UserState> {
    const user = this.findMockUser(email, password);

    return of(user).pipe(
      tap((loggedUser) => {
        this.currentUserSubject.next(loggedUser);
        this.persistToStorage(loggedUser);
        if (loggedUser?.userAccess === 'employee') {
          this.syncEmployeeSessionFromMock();
        }
      }),
    );
  }

  signup(data: RegisterRequest): Observable<SignupResult> {
    const normalizedCpf = this.onlyDigits(data.cpf);
    const normalizedEmail = data.email.trim().toLowerCase();
    const clients = getClientsForAuth();

    const cpfExists =
      clients.some(
        (client) => this.onlyDigits(client.cpf) === normalizedCpf,
      ) ||
      getEmployeesForAuth().some(
        (employee) => this.onlyDigits(employee.cpf) === normalizedCpf,
      );

    if (cpfExists) {
      return throwError(() => new Error('CPF já cadastrado.'));
    }

    const emailExists =
      clients.some(
        (client) => client.email.toLowerCase() === normalizedEmail,
      ) ||
      getEmployeesForAuth().some(
        (employee) => employee.email.toLowerCase() === normalizedEmail,
      );

    if (emailExists) {
      return throwError(() => new Error('E-mail já cadastrado.'));
    }

    const generatedPassword = this.generateRandomPassword();
    const newClient = this.buildClientFromRegisterRequest(
      data,
      normalizedEmail,
      normalizedCpf,
      generatedPassword,
    );

    saveRegisteredClient(newClient);

    return of({ generatedPassword });
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.persistToStorage(null);
    this.router.navigate(['/login']);
  }

  updateCurrentUser(
    updates: Partial<Pick<NonNullable<UserState>, 'name' | 'email'>>,
  ): void {
    const user = this.currentUserSubject.value;
    if (!user) {
      return;
    }

    const updatedUser = { ...user, ...updates };
    this.currentUserSubject.next(updatedUser);
    this.persistToStorage(updatedUser);
  }

  /** Atualiza nome/e-mail da sessão a partir do mock persistido (ex.: após editar funcionário). */
  syncEmployeeSessionFromMock(): void {
    const user = this.currentUserSubject.value;
    if (!user || user.userAccess !== 'employee' || user.id == null) {
      return;
    }

    const employee = getEmployeesForAuth().find(
      (candidate) => candidate.id === user.id,
    );
    if (!employee) {
      return;
    }

    if (employee.name === user.name && employee.email === user.email) {
      return;
    }

    this.updateCurrentUser({ name: employee.name, email: employee.email });
  }

  private findMockUser(email: string, password: string): UserState {
    const normalizedEmail = email.trim().toLowerCase();

    const client = getClientsForAuth().find(
      (candidate) =>
        candidate.email.toLowerCase() === normalizedEmail &&
        candidate.password === password,
    );

    if (client) {
      return {
        id: client.id,
        name: client.name,
        email: client.email,
        userAccess: 'client',
        token: `mock-client-${client.id}`,
      };
    }

    const employee = getEmployeesForAuth().find(
      (candidate) =>
        candidate.email.toLowerCase() === normalizedEmail &&
        candidate.password === password,
    );

    if (employee) {
      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        userAccess: 'employee',
        token: `mock-employee-${employee.id}`,
      };
    }

    return null;
  }

  private buildClientFromRegisterRequest(
    data: RegisterRequest,
    normalizedEmail: string,
    normalizedCpf: string,
    generatedPassword: string,
  ): Client {
    const existingClients = getClientsForAuth();
    const registeredClients = loadRegisteredClients();
    const nextId = Math.max(0, ...existingClients.map((client) => client.id)) + 1;
    const nextAddressId =
      Math.max(
        0,
        ...existingClients.map((client) => client.address?.id ?? 0),
        ...registeredClients.map((client) => client.address?.id ?? 0),
      ) + 1;

    return {
      id: nextId,
      name: data.name.trim(),
      email: normalizedEmail,
      cpf: this.formatCpf(normalizedCpf),
      phoneNumber: this.formatPhone(data.phoneNumber),
      password: generatedPassword,
      userAccess: 'client',
      address: {
        id: nextAddressId,
        cep: this.formatCep(data.zipCode),
        logradouro: data.street.trim(),
        complemento: data.complement?.trim() || undefined,
        bairro: data.neighborhood.trim(),
        cidade: data.city.trim(),
        estado: this.toEstado(data.state),
      },
    };
  }

  private generateRandomPassword(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  private formatCpf(digits: string): string {
    const value = digits.padStart(11, '0').slice(-11);
    return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
  }

  private formatPhone(digits: string): string {
    const value = digits.replace(/\D/g, '').slice(-11);
    if (value.length !== 11) {
      return digits;
    }

    return `(${value.slice(0, 2)}) ${value.slice(2, 3)} ${value.slice(3, 7)}-${value.slice(7)}`;
  }

  private formatCep(digits: string): string {
    const value = digits.replace(/\D/g, '').slice(-8);
    if (value.length !== 8) {
      return digits;
    }

    return `${value.slice(0, 5)}-${value.slice(5)}`;
  }

  private toEstado(value: string): Estado {
    const normalized = value.trim().toUpperCase();
    return Object.values(Estado).includes(normalized as Estado)
      ? (normalized as Estado)
      : Estado.PR;
  }

  private persistToStorage(user: UserState): void {
    if (user) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  private readFromStorage(): UserState {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as UserState;
    } catch {
      return null;
    }
  }

  private onlyDigits(value: string | null | undefined): string {
    return (value ?? '').replace(/\D/g, '');
  }
}
