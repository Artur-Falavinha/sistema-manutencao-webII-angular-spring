import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Component, inject, computed, ViewChild, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputPrimaryComponent } from '../../../../shared/components/input-primary/input-primary.component';
import { MatIcon } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { StatusService } from '../../../../core/services/status.service';
import { Status } from '../../../../shared/models/status';
import { MaintenanceRequestResponseDTO as Request } from '../../../../shared/models/maintenance-request.models';
import { StatusColumnComponent } from './components/status-column/status-column.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MaintenanceRequestService } from '../../../../core/services/maintenance-request.service';
import { MatSort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';

interface GroupedRequests {
  status: Status;
  requests: Request[];
}

@Component({
  selector: 'app-view-requests-page',
  imports: [
    InputPrimaryComponent,
    MatIcon,
    CommonModule,
    StatusColumnComponent,
    MatTableModule,
    MatSortModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonToggleModule,
  ],
  templateUrl: './view-requests-page.component.html',
  styleUrl: './view-requests-page.component.css',
})
export class ViewRequestsPageComponent {
  isKanbanView = true;
  router = inject(Router);
  isFiltersOpen = signal(false);
  searchText = signal('');
  selectedCategory = signal('');
  dateFilterMode = signal<'todos' | 'hoje' | 'periodo'>('todos');
  periodStart = signal<Date | null>(null);
  periodEnd = signal<Date | null>(null);
  periodoValido = computed(() => {
    const start = this.periodStart();
    const end = this.periodEnd();
    return !!start && !!end && !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
  });

  @ViewChild(MatSort) sort!: MatSort;

  private statusService = inject(StatusService);
  private requestService = inject(MaintenanceRequestService);

  statuses = toSignal(this.statusService.getAll(), { initialValue: [] as Status[] });
  requests = toSignal(this.requestService.getAllEmployeeRequests(), { initialValue: [] as Request[] });

  categories = computed(() => [...new Set(this.requests().map(request => request.categoryName))].sort());

  groupedRequests = computed(() => {
    const statuses = this.statuses();
    const reqs = this.requests();

    return statuses.map((status) => ({
      status,
      requests: reqs.filter((r) => r.statusName === status.nome)
    }));
  });

  dataSource = new MatTableDataSource<Request>();

  constructor() {
    effect(() => {
      const rows = this.groupedRequests().flatMap((g) =>
        g.requests.map((r) => ({
          ...r,
          status: g.status.nome,
        }))
      );

      const search = this.searchText().trim().toLowerCase();
      const category = this.selectedCategory();
      const mode = this.dateFilterMode();
      const start = mode === 'hoje' ? new Date() : this.periodStart();
      const end = mode === 'hoje' ? start : this.periodEnd();
      const from = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime() : NaN;
      const until = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1).getTime() : NaN;
      this.dataSource.data = rows.filter(request => {
        if (category && request.categoryName !== category) return false;
        if (search && ![request.equipmentName, request.categoryName, request.clientName, request.statusName].some(value => value.toLowerCase().includes(search))) return false;
        if (mode === 'todos') return true;
        if (mode === 'periodo' && !this.periodoValido()) return false;
        const date = new Date(request.requestDate).getTime();
        return date >= from && date < until;
      }).sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime());
    });
  }

  displayedColumns: string[] = [
    'equipmentName',
    'categoryName',
    'clientName',
    'requestDate',
    'status',
    'actions'
  ];

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item: any, property) => {
      switch (property) {
        case 'requestDate': return new Date(item.requestDate).getTime(); 
        default: return item[property];
      }
    };
  }

  toggleView() {
    this.isKanbanView = !this.isKanbanView;
  }
}
