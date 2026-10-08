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
    describe('ViaCEP integration', () => {
    const cepValido = {
      logradouro: 'Rua XV de Novembro',
      bairro: 'Centro',
      localidade: 'Curitiba',
      uf: 'PR',
    };

    it('fills the address fields when a valid CEP is typed', () => {
      viaCepServiceSpy.buscarCep.and.returnValue(of(cepValido as any));

      component.secondFormGroup.get('cep')?.setValue('80010-000');

      expect(viaCepServiceSpy.buscarCep).toHaveBeenCalledWith('80010000');
      expect(component.secondFormGroup.getRawValue()).toEqual(
        jasmine.objectContaining({
          address: 'Rua XV de Novembro',
          neighborhood: 'Centro',
          city: 'Curitiba',
          state: 'PR',
        }),
      );
    });

    it('does not query ViaCEP while the CEP is incomplete', () => {
      component.secondFormGroup.get('cep')?.setValue('80010');

      expect(viaCepServiceSpy.buscarCep).not.toHaveBeenCalled();
    });

    it('does not query ViaCEP twice for the same CEP', () => {
      const cep = component.secondFormGroup.get('cep');

      cep?.setValue('80010-000');
      cep?.setValue('80010000');

      expect(viaCepServiceSpy.buscarCep).toHaveBeenCalledTimes(1);
    });

    it('warns and keeps the fields empty when the CEP does not exist', () => {
      viaCepServiceSpy.buscarCep.and.returnValue(of({ erro: true } as any));

      component.secondFormGroup.get('cep')?.setValue('99999-999');

      expect(toastServiceSpy.warn).toHaveBeenCalledWith(
        'CEP não encontrado',
        'Verifique o CEP informado.',
      );
      expect(component.secondFormGroup.get('address')?.value).toBe('');
    });

    it('shows an error toast and keeps the fields editable when the lookup fails', () => {
      viaCepServiceSpy.buscarCep.and.returnValue(
        throwError(() => new Error('offline')),
      );

      component.secondFormGroup.get('cep')?.setValue('80010-000');
      component.secondFormGroup.get('address')?.setValue('Rua Manual');

      expect(toastServiceSpy.error).toHaveBeenCalledWith(
        'Erro',
        'Não foi possível consultar o CEP. Tente novamente.',
      );
      expect(component.secondFormGroup.get('address')?.enabled).toBeTrue();
      expect(component.secondFormGroup.get('address')?.value).toBe('Rua Manual');
    });

    it('keeps the typed complement when ViaCEP does not return one', () => {
      viaCepServiceSpy.buscarCep.and.returnValue(of(cepValido as any));
      component.secondFormGroup.get('complement')?.setValue('Apto 5');

      component.secondFormGroup.get('cep')?.setValue('80010-000');

      expect(component.secondFormGroup.get('complement')?.value).toBe('Apto 5');
    });

    it('searchCep warns and skips the lookup when the CEP has fewer than 8 digits', () => {
      component.secondFormGroup.get('cep')?.setValue('800');

      component.searchCep();

      expect(toastServiceSpy.warn).toHaveBeenCalledWith(
        'CEP inválido',
        'Informe um CEP com 8 dígitos.',
      );
      expect(viaCepServiceSpy.buscarCep).not.toHaveBeenCalled();
      expect(component.secondFormGroup.get('cep')?.touched).toBeTrue();
    });

    it('searchCep does nothing when the CEP is empty', () => {
      component.searchCep();

      expect(toastServiceSpy.warn).not.toHaveBeenCalled();
      expect(viaCepServiceSpy.buscarCep).not.toHaveBeenCalled();
    });

    it('isCepValid is true only with 8 digits', () => {
      component.secondFormGroup.get('cep')?.setValue('80010');
      expect(component.isCepValid).toBeFalse();

      component.secondFormGroup.get('cep')?.setValue('80010-000');
      expect(component.isCepValid).toBeTrue();
    });

    it('stops looking up CEPs after the component is destroyed', () => {
      const cep = component.secondFormGroup.get('cep');

      fixture.destroy();
      cep?.setValue('80010-000');

      expect(viaCepServiceSpy.buscarCep).not.toHaveBeenCalled();
    });
  });
});