import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of, tap } from 'rxjs';
import { MOCK_CLIENTS } from '../../../shared/mocks/client.mock';
import { MOCK_EMPLOYEES } from '../../../shared/mocks/employee.mock';
import { RegisterRequest } from '../../../shared/models/register-request';

export type UserState = {
  id?: number;
  name: string;
  email?: string;
  userAccess: 'employee' | 'client';
  token: string;
} | null;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<UserState>(null);

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

  login(email: string, password: string): Observable<UserState> {
    const user = this.findMockUser(email, password);

    return of(user).pipe(
      tap((loggedUser) => this.currentUserSubject.next(loggedUser)),
    );
  }

  signup(data: RegisterRequest): Observable<void> {
    void data;
    return of(undefined);
  }

  logout(): void {
    this.currentUserSubject.next(null);
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
        userAccess: 'client',
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
        userAccess: 'employee',
        token: `mock-employee-${employee.id}`,
      };
    }

    return null;
  }
}
