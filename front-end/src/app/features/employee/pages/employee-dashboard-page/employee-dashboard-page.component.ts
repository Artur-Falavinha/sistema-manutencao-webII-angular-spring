import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RequestCardComponent } from './components/request-card/request-card.component';
import { MaintenanceRequestResponseDTO as Request } from '../../../../shared/models/maintenance-request.models';
import { MaintenanceRequestService } from '../../../../core/services/maintenance-request.service';

@Component({
  selector: 'app-employee-dashboard-page',
  standalone: true,
  imports: [CommonModule, RequestCardComponent, MatIconModule, MatButtonModule],
  templateUrl: './employee-dashboard-page.component.html',
  styleUrl: './employee-dashboard-page.component.css',
})
export class EmployeeDashboardPageComponent implements OnInit {
  private router = inject(Router);
  private requestService = inject(MaintenanceRequestService);

  requests = signal<Request[]>([]);
  // RF011: só as ABERTA, na ordem em que o back envia
  openRequests = computed(() => this.requests().filter(req => req.statusName === 'ABERTA'));

  ngOnInit(): void {
    this.requestService.getAllEmployeeRequests().subscribe(data => this.requests.set(data));
  }

  makeQuote(request: Request) {
    this.router.navigate(['/employee/budget-delivery', request.id]);
  }
}
