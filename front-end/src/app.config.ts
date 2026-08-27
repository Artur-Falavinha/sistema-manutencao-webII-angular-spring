import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // mockApiInterceptor é scaffold temporário — remover junto com o
    // interceptor quando o backend real for integrado (ver core/interceptors).
    provideHttpClient(withInterceptors([mockApiInterceptor])),
  ],
};
