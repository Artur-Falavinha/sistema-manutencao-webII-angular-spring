import { Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ClientRequestDetailDTO } from '../../../../../shared/models/maintenance-request.models';
import { MaintenanceRequestService } from '../../../../../core/services/maintenance-request.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { BudgetApproveConfirmDialogComponent } from './budget-approve-confirm-dialog.component';
import { BudgetRejectDialogComponent } from './budget-reject-dialog.component';
import { BudgetRescueConfirmDialogComponent } from './budget-rescue-confirm-dialog.component';

@Component({
  selector: 'app-approve-reject-panel',
  templateUrl: './approve-reject-panel.component.html',
  styleUrls: ['./approve-reject-panel.component.css'],
  imports: [CommonModule, MatButtonModule],
})
export class ApproveRejectPanelComponent {
  @Input() request!: ClientRequestDetailDTO;
  @Output() statusChanged = new EventEmitter<number>();

  constructor(
    private requestService: MaintenanceRequestService,
    private toast: ToastService,
    private dialog: MatDialog
  ) {}

  openApproveConfirmDialog(): void {
    const budget = this.request.budgets[0];
    if (!budget) {
      return;
    }

    const dialogRef = this.dialog.open(BudgetApproveConfirmDialogComponent, {
      width: '32rem',
      maxWidth: '95vw',
      data: {
        equipmentName: this.request.equipmentName,
        total: budget.total,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.processApprove();
      }
    });
  }

  openRejectDialog(): void {
    const budget = this.request.budgets[0];
    if (!budget) {
      return;
    }

    const dialogRef = this.dialog.open(BudgetRejectDialogComponent, {
      width: '32rem',
      maxWidth: '95vw',
      data: {
        equipmentName: this.request.equipmentName,
        total: budget.total,
      },
    });

    dialogRef.afterClosed().subscribe((rejectionReason) => {
      if (rejectionReason) {
        this.processRejection(rejectionReason);
      }
    });
  }

  openRescueConfirmDialog(): void {
    if (this.request.status.nome !== 'REJEITADA') {
      this.toast.warn('Atenção', 'Esta solicitação não está disponível para resgate.');
      return;
    }

    const budget = this.request.budgets[0];

    const dialogRef = this.dialog.open(BudgetRescueConfirmDialogComponent, {
      width: '32rem',
      maxWidth: '95vw',
      data: {
        equipmentName: this.request.equipmentName,
        total: budget?.total,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.processRescue();
      }
    });
  }

  private processApprove(): void {
    this.requestService.approveBudget(this.request.id).subscribe({
      next: () => {
        this.toast.success('Sucesso', 'Orçamento aprovado! O técnico iniciará o serviço em breve.');
        this.statusChanged.emit(this.request.id);
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erro', 'Não foi possível aprovar o orçamento.');
      },
    });
  }

  private processRejection(rejectionReason: string): void {
    this.requestService.rejectBudget(this.request.id, rejectionReason).subscribe({
      next: () => {
        this.toast.success('Recusado', 'Orçamento recusado com sucesso.');
        this.statusChanged.emit(this.request.id);
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erro', 'Falha ao recusar orçamento.');
      },
    });
  }

  private processRescue(): void {
    this.requestService.rescueRequest(this.request.id).subscribe({
      next: () => {
        this.toast.success('Resgatado', 'Serviço resgatado com sucesso.');
        this.statusChanged.emit(this.request.id);
      },
      error: (err) => {
        console.error(err);
        const message = err?.error?.message ?? 'Falha ao resgatar serviço.';
        this.toast.error('Erro', message);
      },
    });
  }
}
