import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Router } from '@angular/router';
import { API_URL } from '../../configs/api.token';
import { RegisterRequest } from '../../../shared/models/register-request';

interface LoginResponseApi {
  token: string;
  userName: string;
  userRole: string;
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
        const payload = this.readTokenPayload(user?.token);
        if (typeof payload?.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
          this.logout();
          return;
        }
        this.currentUserSubject.next({ ...user, id: payload.id });
      } catch (e) {
        console.error('Erro ao carregar usuário', e);
        this.logout();
      }
    }
  }

  private readTokenPayload(token?: string): { id?: number; exp?: number } | null {
    if (!token || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
      return null;
    }
    try {
      return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return null;
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
          id: this.readTokenPayload(response.token)?.id,
          name: response.userName,
          userAccess: accessType, 
          token: response.token,
        };
        
        return user;
      }),
      tap((user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('token', user!.token);
        this.currentUserSubject.next(user);
      })
    );
  }

  public logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Realiza o cadastro de um novo cliente.
   * @param data Objeto com dados pessoais e endereço
   */
  public signup(data: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.apiBaseUrl}/auth/register`, data);
  }

  private mapRoleToUserAccess(role: string): 'employee' | 'client' {
    if (role === 'ROLE_EMPLOYEE') return 'employee';
    if (role === 'ROLE_CLIENT') return 'client';
    return 'client'; 
  }
}
