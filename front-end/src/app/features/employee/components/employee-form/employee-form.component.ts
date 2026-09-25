import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CustomValidators } from '../../../../shared/utils/cpf-validator';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';

import { EmployeService } from '../../services/employe.service';
import { Employee } from '../../../../shared/models/employee';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNgxMask, NgxMaskDirective } from 'ngx-mask';
import { DialogShellComponent } from '../../../../shared/components/dialog-shell/dialog-shell.component';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { formatBrazilianPhone } from '../../../../shared/utils/phone-format';
import {
  dateToIso,
  isoToDate,
} from '../../../../shared/utils/birth-date-format';

@Component({
  selector: 'app-employee-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogShellComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatStepperModule,
    MatDatepickerModule,
    MatIconModule,
    NgxMaskDirective
],
    providers: [
    provideNgxMask()
  ],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.css']
})
export class EmployeeFormComponent implements OnInit {
  personalInfoForm: FormGroup;
  professionalInfoForm: FormGroup;

  isEdit = false;
  private authService = inject(AuthService);

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeService,
    private dialogref: MatDialogRef<EmployeeFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Employee,
    private snackBar: MatSnackBar
  ) {
    this.personalInfoForm = this.fb.group({
      nome: ['', Validators.required],
      cpf: ['', [Validators.required, CustomValidators.useExistingCpfValidator()]],
      dataNascimento: [null, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      celular: ['', Validators.required],
    });

    this.professionalInfoForm = this.fb.group({
      salario: ['', [Validators.required, Validators.min(0.01)]],
      senha: ['', [Validators.required]]
    });
  }

ngOnInit(): void {
    if (this.data) {
      this.isEdit = true;
      
      this.personalInfoForm.patchValue({
        nome: this.data.name,
        cpf: this.data.cpf,
        dataNascimento: isoToDate(this.data.birthDate),
        email: this.data.email,
        celular: this.data.phone
      });

      this.professionalInfoForm.patchValue({
        salario: this.data.wage
      });

      const senhaControl = this.professionalInfoForm.get('senha');
      if (senhaControl) {
        senhaControl.clearValidators();
        senhaControl.updateValueAndValidity();
      }
    }
  }

onSubmit(): void {
  if (this.personalInfoForm.invalid || this.professionalInfoForm.invalid) {
    this.personalInfoForm.markAllAsTouched();
    this.professionalInfoForm.markAllAsTouched();
    return;
  }

  const employeeData: Employee = {
    id: this.data?.id,
    name: this.personalInfoForm.value.nome,
    email: this.personalInfoForm.value.email,
    cpf: this.personalInfoForm.value.cpf,
    phone: formatBrazilianPhone(this.personalInfoForm.value.celular),
    birthDate: dateToIso(this.personalInfoForm.value.dataNascimento),
    wage: this.professionalInfoForm.value.salario,
    password: this.professionalInfoForm.value.senha,
    active: true
  };

  const request$ = this.isEdit 
    ? this.employeeService.updateEmployee(employeeData) 
    : this.employeeService.addEmployee(employeeData);

  request$.subscribe({
    next: () => {
      if (
        this.isEdit
        && employeeData.id === this.authService.currentUserValue?.id
      ) {
        this.authService.updateCurrentUser({
          name: employeeData.name,
          email: employeeData.email,
        });
      }

      this.dialogref.close(true);
    },
    error: (err) => {
      console.error('Objeto de erro completo:', err); 
      let errorMessage = 'Ocorreu um erro ao salvar.';

      if (err.error && typeof err.error === 'string') {
        errorMessage = err.error;
      } else if (err.error && err.error.message) {
        errorMessage = err.error.message;
      }

      this.snackBar.open(errorMessage, 'Fechar', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    }
  });
}

  onCancel(): void {
    this.dialogref.close(false);
  }
}
