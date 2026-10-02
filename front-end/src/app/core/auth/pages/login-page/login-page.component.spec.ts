import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginPageComponent } from './login-page.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['error', 'success', 'warn']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not call authService.login when the form is invalid', () => {
    component.loginForm.patchValue({ email: '', password: '' });

    component.onSubmit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
  });

  it('navigates to /client/dashboard when a client logs in', () => {
    authServiceSpy.login.and.returnValue(
      of({ name: 'Ana', userAccess: 'client', token: 't' } as any),
    );
    component.loginForm.patchValue({ email: 'cli1@mant.com', password: 'tads' });

    component.onSubmit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/client/dashboard']);
    expect(component.isLoading).toBeFalse();
  });

  it('navigates to /employee/dashboard when an employee logs in', () => {
    authServiceSpy.login.and.returnValue(
      of({ name: 'João', userAccess: 'employee', token: 't' } as any),
    );
    component.loginForm.patchValue({ email: 'func1@mant.com', password: 'tads' });

    component.onSubmit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/employee/dashboard']);
  });

  it('shows a toast error when credentials are invalid', () => {
    authServiceSpy.login.and.returnValue(of(null));
    component.loginForm.patchValue({ email: 'wrong@example.com', password: 'wrong' });

    component.onSubmit();

    expect(toastServiceSpy.error).toHaveBeenCalledWith(
      'Erro',
      'Login falhou. E-mail ou senha incorretos.',
    );
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('shows a toast error when login fails unexpectedly', () => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('network')));
    component.loginForm.patchValue({ email: 'cli1@mant.com', password: 'tads' });

    component.onSubmit();

    expect(toastServiceSpy.error).toHaveBeenCalledWith('Erro', 'Login falhou');
    expect(component.isLoading).toBeFalse();
  });
});