import { Routes } from '@angular/router';

import { FoundationPageComponent } from './foundation-page/foundation-page.component';

export const routes: Routes = [
  {
    path: '',
    component: FoundationPageComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
