import { Component, inject, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { toSignal } from '@angular/core/rxjs-interop';
import { MaintenanceRequestResponseDTO as Request } from '../../../../shared/models/maintenance-request.models';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MaintenanceRequestService } from '../../../../core/services/maintenance-request.service';
import { MatSort } from '@angular/material/sort';
import { MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-view-requests-page',
  imports: [
    MatIcon,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    CommonModule,
    MatTableModule,
    MatSortModule,
  ],
  templateUrl: './view-requests-page.component.html',
  styleUrl: './view-requests-page.component.css',
})
export class ViewRequestsPageComponent {
  @ViewChild(MatSort) sort!: MatSort;

  private requestService = inject(MaintenanceRequestService);

  requests = toSignal(this.requestService.getAllEmployeeRequests(), { initialValue: [] as Request[] });

  dataSource = new MatTableDataSource<Request>();

  constructor() {
    effect(() => {
      this.dataSource.data = this.requests();
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

}
