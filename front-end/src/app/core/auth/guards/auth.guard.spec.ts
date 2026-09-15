import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserValue: null,
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('allows access when there is a logged-in session', () => {
    Object.defineProperty(authServiceSpy, 'currentUserValue', {
      get: () => ({ name: 'Ana', userAccess: 'client', token: 't' }),
    });

    const result = guard.canActivate(
      {} as any,
      { url: '/client/dashboard' } as any,
    );

    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('redirects to /login with returnUrl when there is no session', () => {
    const result = guard.canActivate(
      {} as any,
      { url: '/client/dashboard' } as any,
    );

    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/client/dashboard' },
    });
  });
});