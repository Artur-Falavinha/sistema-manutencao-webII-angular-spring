import { Routes } from '@angular/router';
import { ClientDashboardPageComponent } from './client-dashboard-page/client-dashboard-page.component';
import { RequestDetailPageComponent } from './request-detail-page/request-detail-page.component';
import { ApproveRejectPanelComponent } from './request-detail-page/components/approve-reject-panel/approve-reject-panel.component';

export const clientRoutes: Routes = [
  {
    path: 'dashboard',
    component: ClientDashboardPageComponent,
  },
  {
    path: 'request-detail/:id',
    component: RequestDetailPageComponent,
  },
  {
    path: 'approve-reject-panel',
    component: ApproveRejectPanelComponent,
  },
];
