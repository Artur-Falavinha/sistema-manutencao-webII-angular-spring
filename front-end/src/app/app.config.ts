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
import { environment } from '../environments/environment';
import { API_URL } from './core/configs/api.token';
import { apiInterceptor } from './core/interceptors/api.interceptor';
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
    ...(environment.useMock
      ? [
          {
            provide: APP_INITIALIZER,
            useFactory: initializeMockApi,
            multi: true,
          },
        ]
      : []),
    provideRouter(routes),
    { provide: API_URL, useValue: environment.apiUrl },
    provideHttpClient(
      withInterceptors(
        environment.useMock
          ? [mockApiInterceptor, loadingInterceptor]
          : [apiInterceptor, loadingInterceptor],
      ),
    ),
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
