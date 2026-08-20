import { Routes } from '@angular/router';
import { EmployeeDashboardPageComponent } from './pages/employee-dashboard-page/employee-dashboard-page.component';

export const employeeRoutes: Routes = [
  {
    path: 'dashboard',
    component: EmployeeDashboardPageComponent,
  },
];