import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideNgxMask } from 'ngx-mask';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';

registerLocaleData(localePt, 'pt-BR');

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideRouter(routes),
    // mockApiInterceptor é scaffold temporário — remover junto com o
    // interceptor quando o backend real for integrado (ver core/interceptors).
    provideHttpClient(withInterceptors([mockApiInterceptor])),
    provideNgxMask(),
    provideAnimationsAsync(),
    provideToastr(),
  ],
};
