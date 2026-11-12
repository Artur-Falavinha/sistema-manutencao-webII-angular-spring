import { MatButtonModule } from '@angular/material/button';
import { ToastService } from '../../../services/toast.service';
import { Component, inject } from '@angular/core';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ViaCepService, Endereco } from '../../../services/viacep.service';
import { AuthService } from '../../services/auth.service';
import { AppSuccessModalComponent } from '../../../../shared/components/modal-mensagem/app-success-modal';
import { RegisterRequest } from '../../../../shared/models/register-request';
import { CustomValidators } from '../../../../shared/utils/cpf-validator';

@Component({
  selector: 'app-signup-page',
  imports: [
    InputPrimaryComponent,
    ReactiveFormsModule,
    MatStepperModule,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    AppSuccessModalComponent,
  ],
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css'],
})
export class SignupPageComponent {
  firstFormGroup!: FormGroup;
  secondFormGroup!: FormGroup;
  endereco?: Endereco;
  showModal = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private viaCepService: ViaCepService,
    private toast: ToastService
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
  if (this.isSubmitting || this.showModal) return;
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
        state: addressData.state
      };

      this.isSubmitting = true;
      this.authService.signup(requestData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showModal = true;
        },
        error: (err) => {
          console.error('Erro no cadastro:', err);
          this.isSubmitting = false;
          this.toast.error('Erro', err.status === 400 ? 'Verifique os dados informados e se o CPF ou e-mail já está cadastrado.' : 'Não foi possível concluir o cadastro. Tente novamente.');
        }
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
    const cep = this.secondFormGroup.get('cep')?.value as string | null;
    if (!cep) return;

    this.viaCepService.buscarCep(cep).subscribe({
      next: (res) => {
        if ((res as { erro?: boolean }).erro) {
          this.toast.warn('CEP não encontrado', 'Verifique o CEP informado.');
          return;
        }
        this.endereco = res;
        this.secondFormGroup.patchValue({
          address: res.logradouro || '',
          neighborhood: res.bairro || '',
          city: res.localidade || '',
          state: res.uf || '',
        });
      },
      error: (err) => this.toast.error('Erro', 'Não foi possível consultar o CEP. Tente novamente.'),
    });
  }

  get isCepValid(): boolean {
    const cep = this.secondFormGroup.get('cep')?.value as string | null;
    if (!cep) return false;
    const digits = cep.replace(/\D/g, '');
    return digits.length === 8;
  }
}
