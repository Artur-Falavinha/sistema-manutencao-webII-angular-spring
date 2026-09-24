import { Component, OnDestroy, OnInit } from '@angular/core';
import { InputPrimaryComponent } from '../../../../shared/components/input-primary/input-primary.component';
import {
  FormBuilder,
  Validators,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { ViaCepService } from '../../../services/viacep.service';
import { RegisterRequest } from '../../../../shared/models/register-request';
import { CustomValidators } from '../../../../shared/utils/cpf-validator';

@Component({
  selector: 'app-signup-page',
  imports: [
    InputPrimaryComponent,
    ReactiveFormsModule,
    MatStepperModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css'],
})
export class SignupPageComponent implements OnInit, OnDestroy {
  firstFormGroup!: FormGroup;
  secondFormGroup!: FormGroup;
  private cepLookupSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
    private viaCepService: ViaCepService,
  ) {}

  ngOnInit(): void {
    this.firstFormGroup = this.fb.group({
      nameUser: ['', [Validators.required, Validators.minLength(3)]],
      cpfUser:['', [Validators.required, CustomValidators.useExistingCpfValidator()]],
      phoneUser: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
    });
    this.secondFormGroup = this.fb.group({
      cep: ['', [Validators.required]],
      address: ['', [Validators.required]],
      number: ['', [Validators.required]],
      complement: [''],
      neighborhood: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
    });

    this.setupCepAutoLookup();
  }

  ngOnDestroy(): void {
    this.cepLookupSub?.unsubscribe();
  }

  private setupCepAutoLookup(): void {
    const cepControl = this.secondFormGroup.get('cep');
    if (!cepControl) {
      return;
    }

    this.cepLookupSub = cepControl.valueChanges
      .pipe(
        map((value) => (value ?? '').replace(/\D/g, '')),
        distinctUntilChanged(),
        filter((digits) => digits.length === 8),
      )
      .subscribe((digits) => this.fetchAddressByCep(digits));
  }

  onSubmit(): void {
    if (this.firstFormGroup.valid && this.secondFormGroup.valid) {
      const personalData = this.firstFormGroup.value;
      const addressData = this.secondFormGroup.value;

      const removeNonDigits = (value: string) => value.replace(/\D/g, '');

      const requestData: RegisterRequest = {
        name: personalData.nameUser,
        cpf: removeNonDigits(personalData.cpfUser),
        email: personalData.email,
        phoneNumber: removeNonDigits(personalData.phoneUser),
        zipCode: removeNonDigits(addressData.cep),
        street: addressData.address,
        number: addressData.number,
        complement: addressData.complement,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
      };

      this.authService.signup(requestData).subscribe({
        next: () => {
          this.toast.success(
            'Cadastro concluído',
            'Conta criada com sucesso. Faça login com a senha enviada ao seu e-mail.',
          );
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Erro no cadastro:', err);
          const message =
            typeof err?.error === 'string'
              ? err.error
              : err?.error?.message ?? 'Não foi possível concluir o cadastro. Verifique os dados informados.';
          this.toast.error('Erro', message);
        },
      });
    } else {
      this.firstFormGroup.markAllAsTouched();
      this.secondFormGroup.markAllAsTouched();
    }
  }

  navigate() {
    this.router.navigate(['/login']);
  }

  searchCep(): void {
    const cep = this.secondFormGroup.get('cep')?.value as string | null;
    this.secondFormGroup.get('cep')?.markAsTouched();

    if (!cep) {
      return;
    }

    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      this.toast.warn('CEP inválido', 'Informe um CEP com 8 dígitos.');
      return;
    }

    this.fetchAddressByCep(digits);
  }

  private fetchAddressByCep(digits: string): void {
    this.viaCepService.buscarCep(digits).subscribe({
      next: (res) => {
        if ((res as { erro?: boolean | string }).erro) {
          this.toast.warn('CEP não encontrado', 'Verifique o CEP informado.');
          return;
        }

        const patch: Record<string, string> = {
          address: res.logradouro || '',
          neighborhood: res.bairro || '',
          city: res.localidade || '',
          state: res.uf || '',
        };

        if (res.complemento) {
          patch['complement'] = res.complemento;
        }

        this.secondFormGroup.patchValue(patch);
      },
      error: () => {
        this.toast.error('Erro', 'Não foi possível consultar o CEP. Tente novamente.');
      },
    });
  }

  get isCepValid(): boolean {
    const cep = this.secondFormGroup.get('cep')?.value as string | null;
    if (!cep) return false;
    const digits = cep.replace(/\D/g, '');
    return digits.length === 8;
  }
}
