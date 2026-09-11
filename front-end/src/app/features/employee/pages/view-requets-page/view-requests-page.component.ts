import { Component, computed, effect, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { toSignal } from '@angular/core/rxjs-interop';
import { MaintenanceRequestResponseDTO as Request } from '../../../../shared/models/maintenance-request.models';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MaintenanceRequestService } from '../../../../core/services/maintenance-request.service';
import { MatSort, MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-view-requests-page',
  imports: [
    CommonModule,
    MatButtonModule,
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

  requests = toSignal(this.requestService.getAllEmployeeRequests(), { initialValue: [] as Request[] });
  searchTerm = signal('');
  isFiltersOpen = signal(false);
  selectedCategory = signal<string | null>(null);

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
        .filter((request) => this.matchesCategory(request, this.selectedCategory()));
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
}
