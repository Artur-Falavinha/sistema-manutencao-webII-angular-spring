import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNgxMask } from 'ngx-mask';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // mockApiInterceptor é scaffold temporário — remover junto com o
    // interceptor quando o backend real for integrado (ver core/interceptors).
    provideHttpClient(withInterceptors([mockApiInterceptor])),
    provideNgxMask(),
    provideAnimationsAsync(),
    provideToastr(),
  ],
};
