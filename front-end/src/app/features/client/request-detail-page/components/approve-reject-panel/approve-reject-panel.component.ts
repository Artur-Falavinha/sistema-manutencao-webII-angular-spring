import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BudgetApproveConfirmDialogComponent } from './budget-approve-confirm-dialog.component';
import { BudgetRejectDialogComponent } from './budget-reject-dialog.component';
import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClientRequestDetailDTO } from '../../../../../shared/models/maintenance-request.models';
import { RejectModalComponent } from '../../../../../shared/components/reject-modal/reject-modal.component';
import Swal from 'sweetalert2';
import { MaintenanceRequestService } from '../../../../../core/services/maintenance-request.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-approve-reject-panel',
  templateUrl: './approve-reject-panel.component.html',
  styleUrls: ['./approve-reject-panel.component.css'],
  imports: [CommonModule, RejectModalComponent, MatButtonModule, MatDialogModule],
})
export class ApproveRejectPanelComponent {
  @Input() request!: ClientRequestDetailDTO;
  @Output() statusChanged = new EventEmitter<number>();

  showRejectModal = false;
  rejectionReason = '';
  isSubmitting = false;

  constructor(private dialog: MatDialog, private router: Router, private requestService: MaintenanceRequestService, 
    private toast: ToastService,
  ) {}


  onApprove() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.requestService.approveBudget(this.request.id).subscribe({
      next: () => {
        this.dialog.open(BudgetApproveConfirmDialogComponent, {
          width: '560px',
          maxWidth: 'calc(100vw - 32px)',
          disableClose: true,
          data: { equipmentName: this.request.equipmentName, total: this.request.budgets[0]?.total ?? 0 },
        }).afterClosed().subscribe(() => this.router.navigate(['/client/dashboard']));
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        this.toast.error('Erro', 'Não foi possível aprovar o orçamento.');
      }
    });
  }

  openRejectModal() {
    this.rejectionReason = '';
    this.showRejectModal = true;
    this.dialog.open(BudgetRejectDialogComponent, {
      width: '560px',
      maxWidth: 'calc(100vw - 32px)',
      data: { equipmentName: this.request.equipmentName, total: this.request.budgets[0]?.total ?? 0 },
    }).afterClosed().subscribe(reason => {
      if (reason) this.confirmRejection(reason);
      else this.onRejectCancel();
    });
  }

  confirmRejection(rejectionReason: string) {
    if (this.isSubmitting) return;
    this.rejectionReason = rejectionReason;
    if (!this.rejectionReason.trim()) {
      this.toast.warn('Atenção', 'Informe o motivo da recusa.');
      return;
    }

    this.isSubmitting = true;
    this.requestService.rejectBudget(this.request.id, this.rejectionReason).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toast.success('Recusado', 'Serviço Rejeitado');
        this.showRejectModal = false;
        this.statusChanged.emit(this.request.id); 
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        this.toast.error('Erro', 'Falha ao recusar orçamento.');
      }
    });
  }

  resgatarServico() {
    if (!this.request || this.isSubmitting) return;
    this.isSubmitting = true;
    
    this.requestService.rescueRequest(this.request.id).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toast.success('Resgatado', 'Serviço resgatado com sucesso.');
        this.statusChanged.emit(this.request.id);
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
        this.toast.error('Erro', 'Falha ao resgatar serviço.');
      }
    });
  }

  onRejectCancel() {
    this.showRejectModal = false;
  }

}
