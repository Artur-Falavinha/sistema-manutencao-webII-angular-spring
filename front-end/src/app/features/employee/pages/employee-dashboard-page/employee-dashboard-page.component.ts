import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RequestCardComponent } from '../view-requets-page/components/request-card/request-card.component';
import { MaintenanceRequestResponseDTO as Request } from '../../../../shared/models/maintenance-request.models';
import { MaintenanceRequestService } from '../../../../core/services/maintenance-request.service';

@Component({
  selector: 'app-employee-dashboard-page',
  standalone: true,
  imports: [CommonModule, RequestCardComponent, MatIconModule, MatButtonModule],
  templateUrl: './employee-dashboard-page.component.html',
  styleUrl: './employee-dashboard-page.component.css',
})
export class EmployeeDashboardPageComponent {
  private router = inject(Router);

  requests = toSignal(inject(MaintenanceRequestService).getAllEmployeeRequests(), { initialValue: [] });
  getOpenRequestCount = computed(() => this.requests().filter(req => req.statusName === 'ABERTA').length);

  // Cards ainda sem cálculo: a tela mostra 0 fixo.
  overdueRequests = 0;
  noResponsible = 0;
  createdToday = 0;

  makeQuote(request: Request) {
    this.router.navigate(['/employee/budget-delivery', request.id]);
  }

}
