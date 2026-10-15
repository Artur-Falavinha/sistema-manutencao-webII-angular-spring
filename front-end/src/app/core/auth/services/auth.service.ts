import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Router } from '@angular/router';
import { API_URL } from '../../configs/api.token';
import { RegisterRequest } from '../../../shared/models/register-request';
import {
  getEmployeesForAuth,
  MOCK_AUTH_SESSION_KEY,
} from '../../interceptors/mock-api.persistence';

interface LoginResponseApi {
  token: string;
  userName: string;
  userRole: string;
  userId?: number;
  userEmail?: string;
}

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
  private http = inject(HttpClient);
  private apiBaseUrl = inject(API_URL);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<UserState>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  public isEmployee$: Observable<boolean> = this.currentUser$.pipe(
    map(user => user?.userAccess === 'employee')
  );

  public isLoggedIn$: Observable<boolean> = this.currentUser$.pipe(
    map(user => user !== null)
  );

  constructor() {
    this.loadInitialUser();
  }

  public get currentUserValue(): UserState {
    return this.currentUserSubject.value;
  }

  private loadInitialUser(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Erro ao carregar usuário', e);
        this.logout();
      }
    }
  }

  public login(email: string, password: string): Observable<UserState> {
    return this.http.post<LoginResponseApi>(`${this.apiBaseUrl}/auth/login`, {
      email,
      password
    }).pipe(
      map(response => {
        const accessType = this.mapRoleToUserAccess(response.userRole);

        const user: UserState = {
          id: response.userId,
          name: response.userName,
          email: response.userEmail,
          userAccess: accessType,
          token: response.token,
        };

        return user;
      }),
      tap((user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('token', user!.token);
        this.currentUserSubject.next(user);
        this.persistMockSession(user);
      })
    );
  }

  public logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.persistMockSession(null);
    this.router.navigate(['/login']);
  }

  public signup(data: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.apiBaseUrl}/auth/register`, data);
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
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    this.persistMockSession(updatedUser);
  }

  syncEmployeeSessionFromMock(): void {
    const user = this.currentUserSubject.value;
    if (!user) {
      return;
    }

    this.persistMockSession(user);

    if (user.userAccess !== 'employee' || user.id == null) {
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

  private persistMockSession(user: UserState): void {
    if (user) {
      sessionStorage.setItem(MOCK_AUTH_SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(MOCK_AUTH_SESSION_KEY);
    }
  }

  private mapRoleToUserAccess(role: string): 'employee' | 'client' {
    if (role === 'ROLE_EMPLOYEE') return 'employee';
    if (role === 'ROLE_CLIENT') return 'client';
    return 'client';
  }
}
