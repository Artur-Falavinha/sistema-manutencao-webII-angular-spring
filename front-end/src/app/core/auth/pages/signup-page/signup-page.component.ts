import { Component } from '@angular/core';
import { InputPrimaryComponent } from '../../../../shared/components/input-primary/input-primary.component';
import {
  FormBuilder,
  Validators,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { RegisterRequest } from '../../../../shared/models/register-request';
import { CustomValidators } from '../../../../shared/utils/cpf-validator';

@Component({
  selector: 'app-signup-page',
  imports: [
    InputPrimaryComponent,
    ReactiveFormsModule,
    MatStepperModule,
    MatIconModule,
  ],
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css'],
})
export class SignupPageComponent {
  firstFormGroup!: FormGroup;
  secondFormGroup!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
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

  searchCep() {
    this.secondFormGroup.get('cep')?.markAsTouched();
  }

  get isCepValid(): boolean {
    const cep = this.secondFormGroup.get('cep')?.value as string | null;
    if (!cep) return false;
    const digits = cep.replace(/\D/g, '');
    return digits.length === 8;
  }
}
