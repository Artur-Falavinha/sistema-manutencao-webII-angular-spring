import { Component, inject, computed, signal, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    MatIcon,
    CommonModule,
    StatusColumnComponent,
    MatTableModule,
    MatSortModule,
  ],
  templateUrl: './view-requests-page.component.html',
  styleUrl: './view-requests-page.component.css',
})
export class ViewRequestsPageComponent {
  isKanbanView = true;

  @ViewChild(MatSort) sort!: MatSort;

  private statusService = inject(StatusService);
  private requestService = inject(MaintenanceRequestService);

  statuses = toSignal(this.statusService.getAll(), { initialValue: [] as Status[] });
  requests = toSignal(this.requestService.getAllEmployeeRequests(), { initialValue: [] as Request[] });

  // SCAFFOLD: filtro de busca por equipamento/categoria/cliente. Não existe
  // implementação equivalente na referência (o formControlName="search" lá
  // fica sem lógica por trás) — é código novo do grupo, permanente.
  searchTerm = signal('');

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  // SCAFFOLD: painel de filtro por categoria atrás do botão "Filtros",
  // também sem equivalente na referência.
  isFiltersOpen = signal(false);
  selectedCategory = signal<string | null>(null);

  categories = computed(() => {
    const names = this.requests()
      .map((r) => r.categoryName)
      .filter((c): c is string => !!c);
    return Array.from(new Set(names)).sort();
  });

  toggleFilters(): void {
    this.isFiltersOpen.update((open) => !open);
  }

  onCategoryChange(value: string): void {
    this.selectedCategory.set(value || null);
  }

  clearCategoryFilter(): void {
    this.selectedCategory.set(null);
  }

  private matchesSearch(request: Request, term: string): boolean {
    if (!term) {
      return true;
    }
    const needle = term.trim().toLowerCase();
    return (
      request.equipmentName?.toLowerCase().includes(needle) ||
      request.categoryName?.toLowerCase().includes(needle) ||
      request.clientName?.toLowerCase().includes(needle) ||
      false
    );
  }

  private matchesCategory(request: Request, category: string | null): boolean {
    if (!category) {
      return true;
    }
    return request.categoryName === category;
  }

  groupedRequests = computed(() => {
    const statuses = this.statuses();
    const reqs = this.requests();
    const term = this.searchTerm();
    const category = this.selectedCategory();

    const filtered = reqs
      .filter((r) => this.matchesSearch(r, term))
      .filter((r) => this.matchesCategory(r, category));

    return statuses.map((status) => ({
      status,
      requests: filtered.filter((r) => r.statusName === status.nome)
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

      this.dataSource.data = rows;
    });
  }

  displayedColumns: string[] = [
    'equipmentName',
    'categoryName',
    'clientName',
    'requestDate',
    'status'
  ];

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item: any, property) => {
      switch (property) {
        case 'requestDate': return new Date(item.requestDate); 
        default: return item[property];
      }
    };
  }

  toggleView() {
    this.isKanbanView = !this.isKanbanView;
  }
}