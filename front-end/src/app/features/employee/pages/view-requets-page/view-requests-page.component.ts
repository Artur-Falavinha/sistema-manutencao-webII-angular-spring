import { Component, computed, effect, inject, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { toSignal } from '@angular/core/rxjs-interop';
import { MaintenanceRequestResponseDTO as Request } from '../../../../shared/models/maintenance-request.models';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MaintenanceRequestService } from '../../../../core/services/maintenance-request.service';
import { MatSort, MatSortModule } from '@angular/material/sort';

type DateFilterMode = 'todos' | 'hoje' | 'periodo';

@Component({
  selector: 'app-view-requests-page',
  imports: [
    CommonModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIcon,
    MatInputModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
  ],
  templateUrl: './view-requests-page.component.html',
  styleUrl: './view-requests-page.component.css',
})
export class ViewRequestsPageComponent {
  @ViewChild(MatSort) sort!: MatSort;

  private requestService = inject(MaintenanceRequestService);
  private router = inject(Router);

  requests = toSignal(this.requestService.getAllEmployeeRequests(), { initialValue: [] as Request[] });
  searchTerm = signal('');
  isFiltersOpen = signal(false);
  selectedCategory = signal<string | null>(null);

  dateFilterMode = signal<DateFilterMode>('todos');
  periodStart = signal<string | null>(null);
  periodEnd = signal<string | null>(null);

  categories = computed(() =>
    Array.from(
      new Set(
        this.requests()
          .map((request) => request.categoryName)
          .filter((category): category is string => Boolean(category)),
      ),
    ).sort(),
  );

  dataSource = new MatTableDataSource<Request>();

  displayedColumns: string[] = [
    'equipmentName',
    'categoryName',
    'clientName',
    'requestDate',
    'status',
  ];

  constructor() {
    effect(() => {
      this.dataSource.data = this.requests()
        .filter((request) => this.matchesSearch(request, this.searchTerm()))
        .filter((request) => this.matchesCategory(request, this.selectedCategory()))
        .filter((request) =>
          this.matchesDate(request, this.dateFilterMode(), this.periodStart(), this.periodEnd()),
        );
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  toggleFilters(): void {
    this.isFiltersOpen.update((isOpen) => !isOpen);
  }

  onCategoryChange(value: string): void {
    this.selectedCategory.set(value || null);
  }

  clearCategoryFilter(): void {
    this.selectedCategory.set(null);
  }

  onDateFilterModeChange(mode: DateFilterMode): void {
    this.dateFilterMode.set(mode);
    if (mode !== 'periodo') {
      this.periodStart.set(null);
      this.periodEnd.set(null);
    }
  }

  onPeriodStartChange(value: string): void {
    this.periodStart.set(value || null);
  }

  onPeriodEndChange(value: string): void {
    this.periodEnd.set(value || null);
  }

  periodoValido(): boolean {
    if (this.dateFilterMode() !== 'periodo') {
      return true;
    }
    const start = this.periodStart();
    const end = this.periodEnd();
    if (!start || !end) {
      return false;
    }
    return new Date(start).getTime() <= new Date(end).getTime();
  }

  openRequest(request: Request): void {
    this.router.navigate(['/employee/budget-delivery', request.id]);
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item: Request, property: string) =>
      property === 'requestDate'
        ? new Date(item.requestDate).getTime()
        : String(item[property as keyof Request] ?? '');
  }

  private matchesSearch(request: Request, term: string): boolean {
    const normalizedTerm = term.trim().toLowerCase();

    return !normalizedTerm || [request.equipmentName, request.categoryName, request.clientName]
      .some((value) => value?.toLowerCase().includes(normalizedTerm));
  }

  private matchesCategory(request: Request, category: string | null): boolean {
    return !category || request.categoryName === category;
  }

  private matchesDate(
    request: Request,
    mode: DateFilterMode,
    periodStart: string | null,
    periodEnd: string | null,
  ): boolean {
    if (mode === 'todos') {
      return true;
    }

    const requestDate = new Date(request.requestDate);

    if (mode === 'hoje') {
      const today = new Date();
      return (
        requestDate.getFullYear() === today.getFullYear() &&
        requestDate.getMonth() === today.getMonth() &&
        requestDate.getDate() === today.getDate()
      );
    }

    if (!this.periodoValido() || !periodStart || !periodEnd) {
      return true;
    }
    const start = new Date(periodStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(periodEnd);
    end.setHours(23, 59, 59, 999);

    return requestDate.getTime() >= start.getTime() && requestDate.getTime() <= end.getTime();
  }
}