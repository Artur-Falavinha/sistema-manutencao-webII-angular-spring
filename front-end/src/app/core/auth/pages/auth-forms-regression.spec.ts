import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { EMPTY, of, throwError } from 'rxjs';
import { LoginPageComponent } from './login-page/login-page.component';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ViaCepService } from '../../services/viacep.service';

/**
 * RF001-RF002: matriz de regressao dos formularios de login e autocadastro.
 * Espelha no front-end os casos do AuthRegressionMatrixTest do back-end.
 */
describe('RF001-RF002 matriz de regressao dos formularios', () => {
  describe('login', () => {
    let fixture: ComponentFixture<LoginPageComponent>;
    let component: LoginPageComponent;
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

    const invalidForms = [
      { caso: 'e-mail e senha vazios', value: { email: '', password: '' } },
      { caso: 'e-mail vazio', value: { email: '', password: '1234' } },
      { caso: 'senha vazia', value: { email: 'joao@gmail.com', password: '' } },
      { caso: 'e-mail sem formato valido', value: { email: 'nao-e-um-email', password: '1234' } },
    ];

    invalidForms.forEach(({ caso, value }) => {
      it(`nao envia o login com ${caso}`, () => {
        component.loginForm.patchValue(value);

        component.onSubmit();

        expect(component.loginForm.invalid).toBeTrue();
        expect(authServiceSpy.login).not.toHaveBeenCalled();
        expect(component.isLoading).toBeFalse();
      });
    });

    it('envia ao AuthService exatamente o e-mail e a senha digitados', () => {
      authServiceSpy.login.and.returnValue(
        of({ name: 'Ana', userAccess: 'client', token: 't' } as any),
      );
      component.loginForm.patchValue({ email: 'joao@gmail.com', password: '1234' });

      component.onSubmit();

      expect(authServiceSpy.login).toHaveBeenCalledOnceWith('joao@gmail.com', '1234');
    });

    it('resposta 401 do servidor mostra o toast de falha e nao navega', () => {
      authServiceSpy.login.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 401 })),
      );
      component.loginForm.patchValue({ email: 'joao@gmail.com', password: 'senha-errada' });

      component.onSubmit();

      expect(toastServiceSpy.error).toHaveBeenCalledWith('Erro', 'E-mail ou senha incorretos.');
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('cadastro', () => {
    let fixture: ComponentFixture<SignupPageComponent>;
    let component: SignupPageComponent;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let toastServiceSpy: jasmine.SpyObj<ToastService>;
    let viaCepServiceSpy: jasmine.SpyObj<ViaCepService>;
    let routerSpy: jasmine.SpyObj<Router>;

    const validFirstStep = {
      nameUser: 'Cliente de Teste',
      cpfUser: '529.982.247-25',
      phoneUser: '(41) 9 9999-9999',
      email: 'novo@example.com',
    };

    const validSecondStep = {
      cep: '80010-000',
      address: 'Rua Teste',
      number: '123',
      complement: 'Apto 1',
      neighborhood: 'Centro',
      city: 'Curitiba',
      state: 'PR',
    };

    type Step = 'firstFormGroup' | 'secondFormGroup';

    beforeEach(async () => {
      authServiceSpy = jasmine.createSpyObj('AuthService', ['signup']);
      authServiceSpy.signup.and.returnValue(of(undefined));
      toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warn']);
      viaCepServiceSpy = jasmine.createSpyObj('ViaCepService', ['buscarCep']);
      viaCepServiceSpy.buscarCep.and.returnValue(EMPTY);
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

    function fillValid(): void {
      component.firstFormGroup.patchValue(validFirstStep);
      component.secondFormGroup.patchValue(validSecondStep);
    }

    const requiredFields: [Step, string][] = [
      ['firstFormGroup', 'nameUser'],
      ['firstFormGroup', 'cpfUser'],
      ['firstFormGroup', 'phoneUser'],
      ['firstFormGroup', 'email'],
      ['secondFormGroup', 'cep'],
      ['secondFormGroup', 'address'],
      ['secondFormGroup', 'number'],
      ['secondFormGroup', 'neighborhood'],
      ['secondFormGroup', 'city'],
      ['secondFormGroup', 'state'],
    ];

    requiredFields.forEach(([step, field]) => {
      it(`nao envia o cadastro com o campo obrigatorio vazio: ${field}`, () => {
        fillValid();
        component[step].get(field)?.setValue('');

        component.onSubmit();

        expect(component[step].get(field)?.invalid).toBeTrue();
        expect(authServiceSpy.signup).not.toHaveBeenCalled();
      });
    });

    const invalidValues: [Step, string, string][] = [
      ['firstFormGroup', 'nameUser', 'Ab'],
      ['firstFormGroup', 'cpfUser', '123.456.789-00'],
      ['firstFormGroup', 'email', 'sem-arroba'],
    ];

    invalidValues.forEach(([step, field, value]) => {
      it(`nao envia o cadastro com valor invalido: ${field} = ${value}`, () => {
        fillValid();
        component[step].get(field)?.setValue(value);

        component.onSubmit();

        expect(component[step].get(field)?.invalid).toBeTrue();
        expect(authServiceSpy.signup).not.toHaveBeenCalled();
      });
    });

    it('o complemento e opcional: cadastro sem complemento e enviado', () => {
      fillValid();
      component.secondFormGroup.get('complement')?.setValue('');

      component.onSubmit();

      expect(authServiceSpy.signup).toHaveBeenCalledTimes(1);
    });

    it('envia CPF, telefone e CEP somente com digitos, como o back-end valida', () => {
      fillValid();

      component.onSubmit();

      expect(authServiceSpy.signup).toHaveBeenCalledOnceWith({
        name: 'Cliente de Teste',
        cpf: '52998224725',
        email: 'novo@example.com',
        phoneNumber: '41999999999',
        zipCode: '80010000',
        street: 'Rua Teste',
        number: '123',
        complement: 'Apto 1',
        neighborhood: 'Centro',
        city: 'Curitiba',
        state: 'PR',
      });
    });

    const errosDoServidor = [
      { caso: 'texto puro', error: 'CPF ja cadastrado.', esperado: 'CPF ja cadastrado.' },
      {
        caso: 'JSON de validação',
        error: { message: 'Os dados enviados sao invalidos.', status: 400 },
        esperado: 'Os dados enviados sao invalidos.',
      },
    ];

    errosDoServidor.forEach(({ caso, error, esperado }) => {
      it(`mostra no toast a mensagem do servidor em 400 com corpo ${caso}`, () => {
        authServiceSpy.signup.and.returnValue(
          throwError(() => new HttpErrorResponse({ status: 400, error })),
        );
        spyOn(console, 'error');
        fillValid();

        component.onSubmit();

        expect(toastServiceSpy.error).toHaveBeenCalledWith('Erro', 'Verifique os dados informados e se o CPF ou e-mail já está cadastrado.');
        expect(routerSpy.navigate).not.toHaveBeenCalled();
      });
    });

    it('400 com corpo vazio (duplicidade) mostra a mensagem padrao e nao navega', () => {
      authServiceSpy.signup.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 400, error: null })),
      );
      spyOn(console, 'error');
      fillValid();

      component.onSubmit();

      expect(toastServiceSpy.error).toHaveBeenCalledWith(
        'Erro',
        jasmine.stringMatching(/Verifique os dados/),
      );
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });
});