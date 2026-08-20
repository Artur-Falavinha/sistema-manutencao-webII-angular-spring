import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-employee-dashboard-placeholder-page',
  standalone: true,
  templateUrl: './employee-dashboard-placeholder-page.component.html',
  styleUrl: './employee-dashboard-placeholder-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeDashboardPlaceholderPageComponent {}
