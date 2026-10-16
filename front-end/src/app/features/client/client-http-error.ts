import { HttpErrorResponse } from '@angular/common/http';

/**
 * Mensagens em pt-BR para as falhas da API REST na jornada do cliente (RF003-RF010).
 *
 * Com o mock-api.interceptor fora das rotas do cliente, os erros chegam direto do
 * MaintenanceRequestController. Enquanto o backend não tiver tratamento global de
 * erros, o corpo padrão do Spring não traz mensagem legível; por isso a mensagem do
 * backend só é usada quando vem preenchida, e o restante é traduzido pelo status.
 */
const CLIENT_HTTP_STATUS_MESSAGES: Record<number, string> = {
  0: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
  400: 'Os dados enviados são inválidos. Revise as informações e tente novamente.',
  401: 'Sua sessão expirou. Faça login novamente.',
  403: 'Você não tem permissão para acessar esta solicitação.',
  404: 'Solicitação não encontrada.',
  409: 'A solicitação mudou de estado. Atualize a página e tente novamente.',
};

interface SpringValidationError {
  defaultMessage?: string;
}

export function clientHttpErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) {
    return fallback;
  }

  const backendMessage = extractBackendMessage(err.error);
  if (backendMessage) {
    return backendMessage;
  }

  return CLIENT_HTTP_STATUS_MESSAGES[err.status] ?? fallback;
}

function extractBackendMessage(body: unknown): string | null {
  if (typeof body === 'string') {
    const text = body.trim();
    return text && !text.startsWith('<') ? text : null;
  }

  if (!body || typeof body !== 'object') {
    return null;
  }

  const { message, error, errors } = body as {
    message?: unknown;
    error?: unknown;
    errors?: SpringValidationError[];
  };

  if (Array.isArray(errors)) {
    const firstValidation = errors.find((item) => item?.defaultMessage)?.defaultMessage;
    if (firstValidation) {
      return firstValidation;
    }
  }

  if (typeof message !== 'string' || !message.trim()) {
    return null;
  }

  // O corpo padrão do Spring repete a frase HTTP em inglês ("Forbidden", "Not Found")
  // quando a exceção não traz mensagem própria; nesse caso vale a tradução por status.
  const text = message.trim();
  return text === error || text === 'No message available' ? null : text;
}
