import { Component, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { NewRequestPageComponent } from '../new-request-page/new-request-page.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MaintenanceRequestService as RequestService } from '../../../core/services/maintenance-request.service';
import { MaintenanceRequestResponseDTO as Request } from '../../../shared/models/maintenance-request.models';
import { CommonModule } from '@angular/common';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { ToastService } from '../../../core/services/toast.service';
import {
  BudgetRescueConfirmDialogComponent,
} from '../request-detail-page/components/approve-reject-panel/budget-rescue-confirm-dialog.component';


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
  ],
  templateUrl: './client-dashboard-page.component.html',
  styleUrl: './client-dashboard-page.component.css',
})
export class ClientDashboardPageComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'equipmentName',
    'categoryId',
    'requestDate',
    'status',
    'description',
    'acoes',
  ];
  dataSource = new MatTableDataSource<Request>();
  private toast = inject(ToastService);

  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private requestService: RequestService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests() {
    this.requestService.getAllClientRequests().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
      },
      error: (err) => {
        console.error('Erro ao buscar solicitações', err);
        this.toast.error('Erro', 'Falha ao carregar solicitações.');
      },
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;

    setTimeout(() => {
      this.sort.active = 'requestDate';
      this.sort.direction = 'asc';
      this.sort.sortChange.emit();
    });
  }

  openNewRequest() {
    const dialogRef = this.dialog.open(NewRequestPageComponent, {
      width: '565px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRequests();
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement)?.value || '';
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  verServico(id: number) {
    this.router.navigate(['/client/request-detail', id]);
  }

  openRescueConfirmDialog(request: Request): void {
    if (request.statusName !== 'REJEITADA') {
      this.toast.warn('Atenção', 'Esta solicitação não está disponível para resgate.');
      return;
    }

    const dialogRef = this.dialog.open(BudgetRescueConfirmDialogComponent, {
      width: '32rem',
      maxWidth: '95vw',
      data: {
        equipmentName: request.equipmentName,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.requestService.rescueRequest(request.id).subscribe({
        next: () => {
          this.toast.success('Resgatado', 'Serviço resgatado com sucesso.');
          this.loadRequests();
        },
        error: (err) => {
          console.error(err);
          const message = err?.error?.message ?? 'Falha ao resgatar serviço.';
          this.toast.error('Erro', message);
        },
      });
    });
  }
}
