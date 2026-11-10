import { Component, Input, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { TruncatePipe } from '../../../../../../shared/pipes/truncate.pipe';
import { MaintenanceRequestResponseDTO as Request } from '../../../../../../shared/models/maintenance-request.models';

@Component({
  selector: 'app-request-card',
  imports: [DatePipe, MatIcon, TruncatePipe],
  templateUrl: './request-card.component.html',
  styleUrl: './request-card.component.css',
})
export class RequestCardComponent {
  @Input({ required: true }) request!: Request;

  private router = inject(Router);

  verServico(id: number) {
    this.router.navigate(['/employee/budget-delivery', id]);
  }
}
