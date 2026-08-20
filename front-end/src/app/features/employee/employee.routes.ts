import { Routes } from '@angular/router';

import { AdministrativePlaceholderPageComponent } from './pages/administrative-placeholder-page/administrative-placeholder-page.component';

export const employeeRoutes: Routes = [
  {
    path: 'employees-list',
    component: AdministrativePlaceholderPageComponent
  },
  {
    path: 'categories',
    component: AdministrativePlaceholderPageComponent
  }
];
