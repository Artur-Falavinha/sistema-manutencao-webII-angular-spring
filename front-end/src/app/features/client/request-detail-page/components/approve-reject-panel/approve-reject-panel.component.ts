import { Component, Input, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentType } from '@angular/cdk/portal';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { ClientRequestDetailDTO } from '../../../../../shared/models/maintenance-request.models';
import { MaintenanceRequestService } from '../../../../../core/services/maintenance-request.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { clientHttpErrorMessage } from '../../../client-http-error';
import { BudgetApproveConfirmDialogComponent } from './budget-approve-confirm-dialog.component';
import { BudgetRejectDialogComponent } from './budget-reject-dialog.component';
import { BudgetRescueConfirmDialogComponent } from './budget-rescue-confirm-dialog.component';

/**
 * Orçamento da solicitação e as ações do cliente sobre ele.
 *
 * - RF005: mostra o valor quando o status é ORÇADA;
 * - RF006: aprovar → "Serviço Aprovado no Valor R$ ..." e volta para a home;
 * - RF007: recusar com motivo obrigatório → "Serviço Rejeitado";
 * - RF009: resgatar uma REJEITADA.
 * Quem decide se a ação vale é o backend: fora do status certo ele responde 409.
 */
@Component({
  selector: 'app-approve-reject-panel',
  templateUrl: './approve-reject-panel.component.html',
  styleUrls: ['./approve-reject-panel.component.css'],
  imports: [CommonModule, MatButtonModule],
})
export class ApproveRejectPanelComponent {
  private requestService = inject(MaintenanceRequestService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  @Input() request!: ClientRequestDetailDTO;

  /** Avisa a página de detalhe para recarregar depois de recusar ou resgatar. */
  statusChanged = output<number>();

  openApproveConfirmDialog(): void {
    this.openDialog(BudgetApproveConfirmDialogComponent, () => this.approve());
  }

  openRejectDialog(): void {
    this.openDialog(BudgetRejectDialogComponent, (reason: string) => this.reject(reason));
  }

  openRescueConfirmDialog(): void {
    this.openDialog(BudgetRescueConfirmDialogComponent, () => this.rescue());
  }

  /**
   * Abre um dos diálogos de confirmação com o equipamento e o valor do orçamento.
   * Se o usuário confirmar, chama onConfirm com o que o diálogo devolveu
   * (true nos diálogos de confirmação, o motivo no de recusa).
   */
  private openDialog<T>(dialog: ComponentType<unknown>, onConfirm: (result: T) => void): void {
    this.dialog
      .open(dialog, {
        width: '32rem',
        maxWidth: '95vw',
        data: {
          equipmentName: this.request.equipmentName,
          total: this.request.budgets[0]?.total,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          onConfirm(result);
        }
      });
  }

  private approve(): void {
    const total = this.request.budgets[0]?.total ?? 0;

    this.requestService.approveBudget(this.request.id).subscribe({
      next: () => {
        const valor = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        this.toast.success('Sucesso', `Serviço Aprovado no Valor ${valor}`);
        this.router.navigate(['/client/dashboard']);
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erro', clientHttpErrorMessage(err, 'Não foi possível aprovar o orçamento.'));
      },
    });
  }

  private reject(rejectionReason: string): void {
    this.requestService.rejectBudget(this.request.id, rejectionReason).subscribe({
      next: () => {
        this.toast.success('Recusado', 'Serviço Rejeitado');
        this.statusChanged.emit(this.request.id);
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erro', clientHttpErrorMessage(err, 'Falha ao recusar orçamento.'));
      },
    });
  }

  private rescue(): void {
    this.requestService.rescueRequest(this.request.id).subscribe({
      next: () => {
        this.toast.success('Resgatado', 'Serviço resgatado com sucesso.');
        this.statusChanged.emit(this.request.id);
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erro', clientHttpErrorMessage(err, 'Falha ao resgatar serviço.'));
      },
    });
  }
}
