import { Routes } from '@angular/router';
import { ClientDashboardPageComponent } from './client-dashboard-page/client-dashboard-page.component';

export const clientRoutes: Routes = [
  {
    path: 'dashboard',
    component: ClientDashboardPageComponent,
  },
];
