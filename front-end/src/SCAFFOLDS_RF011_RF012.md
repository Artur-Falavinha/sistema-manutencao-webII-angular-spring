# Scaffolds temporários — RF011/RF012 (semana 27/08, `vinyyyB`)

Migração literal de `view-requests-page` (RF011) da referência (`c6bf109`).
`request-card` e `status-column` batem byte a byte com a referência.
Nenhum service (`status.service.ts`, `maintenance-request.service.ts`,
`category.service.ts`) foi alterado — todos permanecem idênticos à referência.

## O que é scaffold (não vem da referência, é temporário)

1. **`core/configs/api.token.ts`** — token `API_URL` que os services literais
   exigem para compilar. Ausente no projeto antes desta entrega.
2. **`core/interceptors/mock-api.interceptor.ts`** — intercepta as chamadas
   HTTP dos services literais e devolve dados simulados, sem tocar nos
   services em si. Cobre `/status-enum`, `/requests/employee`, `/categories`.
   **Remover junto com a migração de services reais (marco 08/10 e 15/10).**
3. **`shared/mocks/maintenance-request.mock.ts`** — dados simulados no shape
   de `MaintenanceRequestResponseDTO`.
4. **`app.config.ts`** — adiciona `provideHttpClient(withInterceptors([...]))`.
   Ausente no projeto antes desta entrega.
5. **Input de busca em `view-requests-page.component.html`** — trocado
   temporariamente de `<app-input-primary>` (ainda não migrado, é entrega do
   Artur prevista pra 03/09) por um `<input>` nativo. Reverter para o
   componente compartilhado assim que ele estiver na `main`.

## Pendência para PR seguinte (fora do escopo de hoje)

- `budget-delivery` (RF012 completo) ainda não migrado — próxima entrega.
