import { Routes } from '@angular/router';

import { EmployeeDashboardPageComponent } from './pages/employee-dashboard-page/employee-dashboard-page.component';
import { EmployeeListComponent } from './pages/employee-list/employee-list.component';
import { ManageCategoriesPageComponent } from './pages/manage-categories-page/manage-categories-page.component';
import { ReportsPageComponent } from './pages/reports-page/reports-page.component';
import { ViewRequestsPageComponent } from './pages/view-requets-page/view-requests-page.component';

export const employeeRoutes: Routes = [
  {
    path: 'dashboard',
    component: EmployeeDashboardPageComponent
  },
  {
    path: 'employees-list',
    component: EmployeeListComponent
  },
  {
    path: 'categories',
    component: ManageCategoriesPageComponent
  },
  {
    path: 'view-requests',
    component: ViewRequestsPageComponent
  },
  {
    path: 'reports',
    component: ReportsPageComponent
  },
];
