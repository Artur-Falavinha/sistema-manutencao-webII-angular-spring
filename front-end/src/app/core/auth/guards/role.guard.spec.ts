import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RoleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserValue: null,
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(RoleGuard);
  });

  function withUser(userAccess: 'client' | 'employee') {
    Object.defineProperty(authServiceSpy, 'currentUserValue', {
      get: () => ({ name: 'Ana', userAccess, token: 't' }),
    });
  }

  it('allows access when the role matches expectedRole', () => {
    withUser('client');

    const result = guard.canActivate(
      { data: { expectedRole: 'client' } } as any,
      {} as any,
    );

    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('redirects to /error-unauthorized when the role does not match', () => {
    withUser('client');

    const result = guard.canActivate(
      { data: { expectedRole: 'employee' } } as any,
      {} as any,
    );

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/error-unauthorized']);
  });

  it('redirects to /login when there is no session', () => {
    const result = guard.canActivate(
      { data: { expectedRole: 'client' } } as any,
      {} as any,
    );

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});