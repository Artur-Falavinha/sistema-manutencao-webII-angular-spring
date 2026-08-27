import { Routes } from '@angular/router';

import { FoundationPageComponent } from './foundation-page/foundation-page.component';

export const routes: Routes = [
  {
    path: '',
    component: FoundationPageComponent
  },
  {
    path: 'employee',
    loadChildren: () => import('./features/employee/employee.routes').then((module) => module.employeeRoutes)
  },
  {
    path: 'client',
    loadChildren: () => import('./features/client/client.routes').then((module) => module.clientRoutes)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
