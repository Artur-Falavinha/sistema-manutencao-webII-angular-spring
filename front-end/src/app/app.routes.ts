import { Routes } from '@angular/router';

import { FoundationPageComponent } from './foundation-page/foundation-page.component';
import { EmployeeListComponent } from './features/employee/pages/employee-list/employee-list.component';
import { ManageCategoriesPageComponent } from './features/employee/pages/manage-categories-page/manage-categories-page.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'employees',
    pathMatch: 'full'
  },
  {
    path: 'employees',
    component: EmployeeListComponent
  },
  {
    path: 'categories',
    component: ManageCategoriesPageComponent
  },
  {
    path: 'employee',
    loadChildren: () => import('./features/employee/employee.routes').then((module) => module.employeeRoutes)
  },
  {
    path: '**',
    redirectTo: 'employees'
  }
];
