import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RequestDescriptionComponent } from './components/request-description/request-description.component';
import { RequestHistoryComponent } from './components/request-history/request-history.component';
import { ApproveRejectPanelComponent } from './components/approve-reject-panel/approve-reject-panel.component';
import { MaintenanceRequestService } from '../../../core/services/maintenance-request.service';
import { ClientRequestDetailDTO } from '../../../shared/models/maintenance-request.models';
import { ToastService } from '../../../core/services/toast.service';
import { clientHttpErrorMessage } from '../client-http-error';

/**
 * Detalhe da solicitação do cliente (RF008).
 *
 * Busca GET /requests/client/{id} e reparte a tela em três componentes:
 * - request-description: dados do equipamento e status;
 * - approve-reject-panel: orçamento, aprovar, recusar e resgatar (RF005-RF007, RF009);
 * - request-history: linha do tempo com data/hora e responsável.
 * Quando o status é ARRUMADA, o botão "Pagar Solicitação" leva ao pagamento (RF010).
 */
@Component({
  selector: 'app-request-detail-page',
  imports: [
    RequestDescriptionComponent,
    RequestHistoryComponent,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    ApproveRejectPanelComponent,
  ],
  templateUrl: './request-detail-page.component.html',
  styleUrl: './request-detail-page.component.css',
})
export class RequestDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private requestService = inject(MaintenanceRequestService);
  private toast = inject(ToastService);

  /** Detalhe vindo do backend; fica null enquanto carrega ou se a busca falhar. */
  request = signal<ClientRequestDetailDTO | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRequestDetails(Number(id));
    }
  }

  /** Também é chamado pelo approve-reject-panel depois de recusar ou resgatar. */
  loadRequestDetails(id: number): void {
    this.requestService.getRequestByIdForClient(id).subscribe({
      next: (data) => {
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

  goToPaymentPage(id: number): void {
    this.router.navigate(['/client/request-detail', id, 'payment']);
  }
}
