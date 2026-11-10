import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { clientHttpErrorMessage } from '../client-http-error';
import { ClientRequestDetailDTO } from '../../../shared/models/maintenance-request.models';
import { PaymentConfirmDialogComponent } from './payment-confirm-dialog.component';

/**
 * Pagamento da solicitação (RF010).
 *
 * Só permite pagar quando o status é ARRUMADA. Depois da confirmação chama
 * POST /requests/client/{id}/pay; o backend muda o status para PAGA e grava
 * a data/hora do pagamento no histórico.
 */
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
  private requestService = inject(MaintenanceRequestService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  /** Detalhe vindo do backend; fica null enquanto carrega ou se a busca falhar. */
  request = signal<ClientRequestDetailDTO | null>(null);
  isLoading = signal(true);
  isProcessingPayment = signal(false);

  /** Forma escolhida no toggle (ligada por ngModel). */
  selectedMethod: 'cartao' | 'pix' | null = null;

  canPay = computed(() => this.request()?.status.nome === 'ARRUMADA');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRequestDetails(Number(id));
    }
  }

  loadRequestDetails(id: number): void {
    this.requestService.getRequestByIdForClient(id).subscribe({
      next: (data) => {
        // Solicitação já paga não tem o que pagar: volta para o detalhe.
        if (data.status.nome === 'PAGA') {
          this.goToDetail(id);
          return;
        }

        this.request.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading request details:', err);
        this.toast.error('Erro', clientHttpErrorMessage(err, 'Falha ao carregar detalhes da solicitação!'));
        this.isLoading.set(false);
      },
    });
  }

  openPaymentConfirmDialog(): void {
    const request = this.request();

    if (!request || !this.canPay()) {
      this.toast.warn('Atenção', 'Esta solicitação não está disponível para pagamento.');
      return;
    }

    if (!this.selectedMethod) {
      this.toast.warn('Atenção', 'Selecione uma forma de pagamento antes de continuar.');
      return;
    }

    const budget = request.budgets[0];
    if (!budget) {
      this.toast.error('Erro', 'Não há orçamento disponível para pagamento.');
      return;
    }

    this.dialog
      .open(PaymentConfirmDialogComponent, {
        width: '32rem',
        maxWidth: '95vw',
        data: {
          paymentMethodLabel: this.selectedMethod === 'cartao' ? 'Cartão' : 'Pix',
          total: budget.total,
          equipmentName: request.equipmentName,
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.pay(request.id);
        }
      });
  }

  private pay(id: number): void {
    if (this.isProcessingPayment()) {
      return;
    }

    this.isProcessingPayment.set(true);

    this.requestService.payRequest(id).subscribe({
      next: () => {
        this.toast.success('Sucesso', 'Solicitação paga com sucesso!');
        this.goToDetail(id);
      },
      error: (err) => {
        console.error('Error paying request:', err);
        this.toast.error('Erro', clientHttpErrorMessage(err, 'Falha ao processar o pagamento da solicitação!'));
        this.isProcessingPayment.set(false);
      },
    });
  }

  private goToDetail(id: number): void {
    this.router.navigate(['/client/request-detail', id]);
  }
}
