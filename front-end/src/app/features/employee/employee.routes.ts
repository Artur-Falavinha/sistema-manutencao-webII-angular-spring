import { Routes } from '@angular/router';

import { AdministrativePlaceholderPageComponent } from './pages/administrative-placeholder-page/administrative-placeholder-page.component';
import { EmployeeDashboardPlaceholderPageComponent } from './pages/employee-dashboard-placeholder-page/employee-dashboard-placeholder-page.component';

export const employeeRoutes: Routes = [
  {
    path: 'dashboard',
    component: EmployeeDashboardPlaceholderPageComponent
  },
  {
    path: 'employees-list',
    component: AdministrativePlaceholderPageComponent
  },
  {
    path: 'categories',
    component: AdministrativePlaceholderPageComponent
  },
];
