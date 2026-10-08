import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * URL base da API. O valor vem de environment.apiUrl.
 * app.config também fornece o token, no mesmo contrato da referência.
 * Enquanto useMock estiver ativo, o MockApiInterceptor responde no lugar da rede.
 */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});
