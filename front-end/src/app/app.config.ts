import { ApplicationConfig, APP_INITIALIZER, LOCALE_ID, importProvidersFrom, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideNgxMask } from 'ngx-mask';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideToastr } from 'ngx-toastr';
import { NgxSpinnerModule } from 'ngx-spinner';

import { routes } from './app.routes';
import { mockApiInterceptor, initializeMockApiState } from './core/interceptors/mock-api.interceptor';
import { syncMockApiWithDevServer } from './core/interceptors/mock-api.persistence';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { AuthService } from './core/auth/services/auth.service';
import { provideBrazilianMaterialDate } from './shared/providers/material-date.providers';

function initializeMockApi(): () => Promise<void> {
  const authService = inject(AuthService);

  return async () => {
    await syncMockApiWithDevServer();
    initializeMockApiState();
    authService.syncEmployeeSessionFromMock();
  };
}

registerLocaleData(localePt, 'pt-BR');

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    ...provideBrazilianMaterialDate(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeMockApi,
      multi: true,
    },
    provideRouter(routes),
    // mockApiInterceptor é scaffold temporário — remover junto com o
    // interceptor quando o backend real for integrado (ver core/interceptors).
    provideHttpClient(withInterceptors([mockApiInterceptor, loadingInterceptor])),
    provideNgxMask(),
    provideAnimationsAsync(),
    provideToastr({
      timeOut: 3000,
      closeButton: true,
      easing: 'ease-in',
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
    }),
    importProvidersFrom(NgxSpinnerModule.forRoot({ type: 'ball-scale-multiple' })),
  ],
};
