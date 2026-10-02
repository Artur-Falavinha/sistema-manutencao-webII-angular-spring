import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MaintenanceRequestService } from '../../../core/services/maintenance-request.service';
import { ToastService } from '../../../core/services/toast.service';
import { ClientRequestDetailDTO } from '../../../shared/models/maintenance-request.models';
import { PaymentConfirmDialogComponent } from './payment-confirm-dialog.component';

@Component({
  selector: 'app-payment-panel',
  templateUrl: './payment-panel.component.html',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIcon,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDialogModule,
  ],
  styleUrls: ['./payment-panel.component.css'],
})
export class PaymentPanelComponent implements OnInit {
  requests: ClientRequestDetailDTO | undefined;
  currentRequestId!: number;

  isLoading = true;
  selectedMethod: 'cartao' | 'pix' | null = null;
  isProcessingPayment = false;

  constructor(
    private requestService: MaintenanceRequestService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.currentRequestId = Number(id);
      this.loadRequestDetails(this.currentRequestId);
    }
  }

  get canPay(): boolean {
    return this.requests?.status.nome === 'ARRUMADA';
  }

  loadRequestDetails(id: number): void {
    this.requestService.getRequestByIdForClient(id).subscribe({
      next: (data) => {
        this.requests = data;
        this.isLoading = false;

        if (data.status.nome === 'PAGA') {
          this.router.navigate(['/client/request-detail', this.currentRequestId]);
        }
      },
      error: (err) => {
        console.error('Error loading request details:', err);
        this.toast.error('Erro', 'Falha ao carregar detalhes da solicitação!');
        this.isLoading = false;
      },
    });
  }

  openPaymentConfirmDialog(): void {
    if (!this.canPay) {
      this.toast.warn('Atenção', 'Esta solicitação não está disponível para pagamento.');
      return;
    }

    if (!this.selectedMethod) {
      this.toast.warn('Atenção', 'Selecione uma forma de pagamento antes de continuar.');
      return;
    }

    if (!this.requests?.budgets.length) {
      this.toast.error('Erro', 'Não há orçamento disponível para pagamento.');
      return;
    }

    const total = this.requests.budgets[0].total;
    const paymentMethodLabel = this.selectedMethod === 'cartao' ? 'Cartão' : 'Pix';

    const dialogRef = this.dialog.open(PaymentConfirmDialogComponent, {
      width: '32rem',
      maxWidth: '95vw',
      data: {
        paymentMethodLabel,
        total,
        equipmentName: this.requests.equipmentName,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.processPayment();
      }
    });
  }

  private processPayment(): void {
    if (!this.canPay || this.isProcessingPayment) {
      return;
    }

    this.isProcessingPayment = true;

    this.requestService.payRequest(this.currentRequestId).subscribe({
      next: () => {
        this.toast.success('Sucesso', 'Solicitação paga com sucesso!');
        this.router.navigate(['/client/request-detail', this.currentRequestId]);
      },
      error: (err) => {
        console.error('Error paying request:', err);
        const message = err?.error?.message ?? 'Falha ao processar o pagamento da solicitação!';
        this.toast.error('Erro', message);
        this.isProcessingPayment = false;
      },
    });
  }
}
