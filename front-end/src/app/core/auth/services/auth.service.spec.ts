import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
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
});
