import { Injectable } from "@angular/core";
import { BehaviorSubject, map, Observable, of, tap, throwError } from "rxjs";
import { MOCK_CLIENTS } from "../../../shared/mocks/client.mock";
import { MOCK_EMPLOYEES } from "../../../shared/mocks/employee.mock";
import { RegisterRequest } from "../../../shared/models/register-request";

export type UserState = {
  id?: number;
  name: string;
  email?: string;
  userAccess: "employee" | "client";
  token: string;
} | null;

const SESSION_STORAGE_KEY = "mock-auth-session";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<UserState>(
    this.readFromStorage(),
  );

  readonly currentUser$ = this.currentUserSubject.asObservable();

  readonly isEmployee$: Observable<boolean> = this.currentUser$.pipe(
    map((user) => user?.userAccess === "employee"),
  );

  readonly isLoggedIn$: Observable<boolean> = this.currentUser$.pipe(
    map((user) => user !== null),
  );

  get currentUserValue(): UserState {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<UserState> {
    const user = this.findMockUser(email, password);

    return of(user).pipe(
      tap((loggedUser) => {
        this.currentUserSubject.next(loggedUser);
        this.persistToStorage(loggedUser);
      }),
    );
  }

  signup(data: RegisterRequest): Observable<void> {
    const normalizedCpf = this.onlyDigits(data.cpf);
    const normalizedEmail = data.email.trim().toLowerCase();

    const cpfExists =
      MOCK_CLIENTS.some(
        (client) => this.onlyDigits(client.cpf) === normalizedCpf,
      ) ||
      MOCK_EMPLOYEES.some(
        (employee) => this.onlyDigits(employee.cpf) === normalizedCpf,
      );

    if (cpfExists) {
      return throwError(() => new Error("CPF já cadastrado."));
    }

    const emailExists =
      MOCK_CLIENTS.some(
        (client) => client.email.toLowerCase() === normalizedEmail,
      ) ||
      MOCK_EMPLOYEES.some(
        (employee) => employee.email.toLowerCase() === normalizedEmail,
      );

    if (emailExists) {
      return throwError(() => new Error("E-mail já cadastrado."));
    }

    return of(undefined);
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.persistToStorage(null);
  }

  private findMockUser(email: string, password: string): UserState {
    const normalizedEmail = email.trim().toLowerCase();

    const client = MOCK_CLIENTS.find(
      (candidate) =>
        candidate.email.toLowerCase() === normalizedEmail &&
        candidate.password === password,
    );

    if (client) {
      return {
        id: client.id,
        name: client.name,
        email: client.email,
        userAccess: "client",
        token: `mock-client-${client.id}`,
      };
    }

    const employee = MOCK_EMPLOYEES.find(
      (candidate) =>
        candidate.email.toLowerCase() === normalizedEmail &&
        candidate.password === password,
    );

    if (employee) {
      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        userAccess: "employee",
        token: `mock-employee-${employee.id}`,
      };
    }

    return null;
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
    return (value ?? "").replace(/\D/g, "");
  }
}
