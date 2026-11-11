import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { NewRequestPageComponent } from '../new-request-page/new-request-page.component';
import { MaintenanceRequestService as RequestService } from '../../../core/services/maintenance-request.service';
import { MaintenanceRequestResponseDTO as Request } from '../../../shared/models/maintenance-request.models';
import { ToastService } from '../../../core/services/toast.service';
import { clientHttpErrorMessage } from '../client-http-error';
import {
  BudgetRescueConfirmDialogComponent,
} from '../request-detail-page/components/approve-reject-panel/budget-rescue-confirm-dialog.component';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';

/**
 * Página inicial do cliente (RF003).
 *
 * Lista as solicitações do cliente logado (GET /requests/client) da mais antiga
 * para a mais recente. Cada linha mostra o botão que corresponde ao status:
 * ORÇADA → aprovar/recusar, REJEITADA → resgatar, ARRUMADA → pagar e os demais → ver.
 */
@Component({
  selector: 'app-client-dashboard-page',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    CommonModule,
    MatIcon,
    MatSortModule,
    MatButtonModule,
    TruncatePipe,
  ],
  templateUrl: './client-dashboard-page.component.html',
  styleUrl: './client-dashboard-page.component.css',
})
export class ClientDashboardPageComponent implements OnInit {
  private dialog = inject(MatDialog);
  private requestService = inject(RequestService);
  private router = inject(Router);
  private toast = inject(ToastService);

  displayedColumns: string[] = [
    'equipmentName',
    'categoryId',
    'requestDate',
    'status',
    'description',
    'acoes',
  ];

  /** Solicitações como vieram do backend. */
  requests = signal<Request[]>([]);

  /** Texto digitado no campo de pesquisa. */
  searchText = signal('');

  /** Ordem da coluna "Data de Criação". Começa crescente, como pede o RF003. */
  dateOrder = signal<'asc' | 'desc'>('asc');

  /** Linhas exibidas na tabela: filtradas pela pesquisa e ordenadas pela data. */
  visibleRequests = computed(() => {
    const text = this.searchText().trim().toLowerCase();
    const direction = this.dateOrder() === 'asc' ? 1 : -1;

    return this.requests()
      .filter((request) => matchesSearch(request, text))
      .sort((a, b) => direction * (toTime(a.requestDate) - toTime(b.requestDate)));
  });

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.requestService.getAllClientRequests().subscribe({
      next: (data) => this.requests.set(data),
      error: (err) => {
        console.error('Erro ao buscar solicitações', err);
        this.toast.error('Erro', clientHttpErrorMessage(err, 'Falha ao carregar solicitações.'));
      },
    });
  }

  /** Clique no cabeçalho "Data de Criação": alterna entre crescente e decrescente. */
  orderByDate(sort: Sort): void {
    this.dateOrder.set(sort.direction === 'desc' ? 'desc' : 'asc');
  }

  /** RF004: abre o diálogo de nova solicitação e recarrega a lista se ela foi criada. */
  openNewRequest(): void {
    this.dialog
      .open(NewRequestPageComponent, { width: '565px', disableClose: true })
      .afterClosed()
      .subscribe((created) => {
        if (created) {
          this.loadRequests();
        }
      });
  }

  /** RF005, RF008 e RF010 começam pelo detalhe da solicitação. */
  openDetail(id: number): void {
    this.router.navigate(['/client/request-detail', id]);
  }

  /** RF009: resgata uma solicitação REJEITADA direto da home. */
  openRescueConfirmDialog(request: Request): void {
    this.dialog
      .open(BudgetRescueConfirmDialogComponent, {
        width: '32rem',
        maxWidth: '95vw',
        data: { equipmentName: request.equipmentName },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        // Se o status já tiver mudado, o backend responde 409 e o toast explica.
        this.requestService.rescueRequest(request.id).subscribe({
          next: () => {
            this.toast.success('Resgatado', 'Serviço resgatado com sucesso.');
            this.loadRequests();
          },
          error: (err) => {
            console.error(err);
            this.toast.error('Erro', clientHttpErrorMessage(err, 'Falha ao resgatar serviço.'));
          },
        });
      });
  }
}

/** A pesquisa procura nos textos que aparecem na tabela. */
function matchesSearch(request: Request, text: string): boolean {
  if (!text) {
    return true;
  }

  return [request.equipmentName, request.categoryName, request.statusName, request.defectDescription]
    .join(' ')
    .toLowerCase()
    .includes(text);
}

function toTime(date: string): number {
  return new Date(date).getTime();
}
