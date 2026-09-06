import { InjectionToken } from '@angular/core';

/**
 * URL base da API. Neutro para o protótipo: nenhuma chamada real sai daqui
 * enquanto o MockApiInterceptor estiver ativo (ver core/interceptors).
 * Valor real de produção entra na migração de 08/10.
 */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:8080/api',
});
