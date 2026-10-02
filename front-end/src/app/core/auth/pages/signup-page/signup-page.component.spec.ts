import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SignupPageComponent } from './signup-page.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { ViaCepService } from '../../../services/viacep.service';

describe('SignupPageComponent', () => {
  let component: SignupPageComponent;
  let fixture: ComponentFixture<SignupPageComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let viaCepServiceSpy: jasmine.SpyObj<ViaCepService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const validFirstStep = {
    nameUser: 'Novo Usuário',
    cpfUser: '529.982.247-25',
    phoneUser: '(41) 9 9999-9999',
    email: 'novo@example.com',
  };

  const validSecondStep = {
    cep: '80010-000',
    address: 'Rua Teste',
    number: '123',
    complement: '',
    neighborhood: 'Centro',
    city: 'Curitiba',
    state: 'PR',
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['signup']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warn']);
    viaCepServiceSpy = jasmine.createSpyObj('ViaCepService', ['buscarCep']);
    viaCepServiceSpy.buscarCep.and.returnValue(of({} as any));
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [SignupPageComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ViaCepService, useValue: viaCepServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not call authService.signup when the forms are invalid', () => {
    component.onSubmit();

    expect(authServiceSpy.signup).not.toHaveBeenCalled();
    expect(component.firstFormGroup.touched).toBeTrue();
    expect(component.secondFormGroup.touched).toBeTrue();
  });

  it('calls authService.signup and navigates to /login on valid data', () => {
    authServiceSpy.signup.and.returnValue(of({ generatedPassword: '1234' }));
    component.firstFormGroup.patchValue(validFirstStep);
    component.secondFormGroup.patchValue(validSecondStep);

    component.onSubmit();

    expect(authServiceSpy.signup).toHaveBeenCalled();
    expect(toastServiceSpy.success).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('shows a toast error and does not navigate when signup fails (duplicate CPF/email)', () => {
    authServiceSpy.signup.and.returnValue(
      throwError(() => new Error('CPF já cadastrado.')),
    );
    component.firstFormGroup.patchValue(validFirstStep);
    component.secondFormGroup.patchValue(validSecondStep);
    spyOn(console, 'error');

    component.onSubmit();

    expect(console.error).toHaveBeenCalled();
    expect(toastServiceSpy.error).toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalledWith(['/login']);
  });
});