import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MaintenanceRequestCreateDTO } from '../../../shared/models/maintenance-request.models';
import { MaintenanceRequestService } from '../../../core/services/maintenance-request.service';
import { CategoryService } from '../../employee/services/category.service';
import { Category } from '../../../shared/models/category';
import { ToastService } from '../../../core/services/toast.service';
import { clientHttpErrorMessage } from '../client-http-error';

/**
 * Diálogo de nova solicitação (RF004).
 *
 * Formulário template-driven: os três campos têm `required` e o botão fica
 * desabilitado enquanto o formulário é inválido. O backend cria a solicitação
 * como ABERTA, com data/hora e o primeiro registro do histórico.
 */
@Component({
  selector: 'app-new-request-page',
  standalone: true,
  imports: [FormsModule, CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './new-request-page.component.html',
  styleUrl: './new-request-page.component.css',
})
export class NewRequestPageComponent implements OnInit {
  private dialogRef = inject<MatDialogRef<NewRequestPageComponent>>(MatDialogRef);
  private requestService = inject(MaintenanceRequestService);
  private categoryService = inject(CategoryService);
  private toast = inject(ToastService);

  @ViewChild('formRequest') formRequest!: NgForm;

  /** Opções do select de categoria, vindas do backend. */
  categories = signal<Category[]>([]);

  /** Modelo do formulário (ngModel). categoryId começa null para mostrar "Selecione a categoria". */
  request: MaintenanceRequestCreateDTO = {
    equipmentName: '',
    defectDescription: '',
    categoryId: null as unknown as number,
  };

  ngOnInit(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err) => this.toast.error('Erro', clientHttpErrorMessage(err, 'Falha ao carregar categorias.')),
    });
  }

  confirmCloseRequest(): void {
    if (!this.formRequest.dirty || confirm('Tem certeza que deseja cancelar? Os dados serão perdidos.')) {
      this.dialogRef.close();
    }
  }

  send(): void {
    if (this.formRequest.invalid) {
      return;
    }

    this.requestService.create(this.request).subscribe({
      next: () => {
        this.toast.success('Sucesso', 'Solicitação criada com sucesso!');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Erro ao criar solicitação:', err);
        this.toast.error('Erro', clientHttpErrorMessage(err, 'Falha ao criar solicitação.'));
      },
    });
  }
}
