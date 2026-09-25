import { MOCK_EMPLOYEES } from '../../shared/mocks/employee.mock';
import { MOCK_CLIENTS } from '../../shared/mocks/client.mock';
import { Budget } from '../../shared/models/budget.model';
import { Category } from '../../shared/models/category';
import { Client } from '../../shared/models/client';
import { Employee } from '../../shared/models/employee';
import { MaintenanceRecordDTO } from '../../shared/models/maintenance-record.model';
import { Request } from '../../shared/models/request';
import { RequestHistory } from '../../shared/models/request-history';

export interface MockApiPersistedState {
  mockRequests: Request[];
  mockCategories: Category[];
  mockEmployees: Employee[];
  mockBudgets: Budget[];
  mockMaintenanceRecords: Record<number, MaintenanceRecordDTO>;
  mockRequestHistory: Record<number, RequestHistory[]>;
}

const STATE_KEY = 'mant-mock-api-state';
const DEV_BUNDLE_KEY = 'mant-mock-api-dev-bundle';
const REGISTERED_CLIENTS_KEY = 'mant-mock-registered-clients';
export const MOCK_AUTH_SESSION_KEY = 'mock-auth-session';

interface SerializedRequest extends Omit<Request, 'requestDate'> {
  requestDate: string;
}

interface SerializedState {
  mockRequests: SerializedRequest[];
  mockCategories: Category[];
  mockEmployees: Employee[];
  mockBudgets: Budget[];
  mockMaintenanceRecords: Record<number, MaintenanceRecordDTO>;
  mockRequestHistory: Record<number, RequestHistory[]>;
}

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function serializeState(state: MockApiPersistedState): SerializedState {
  return {
    mockRequests: state.mockRequests.map((request) => ({
      ...request,
      requestDate: request.requestDate instanceof Date
        ? request.requestDate.toISOString()
        : new Date(request.requestDate).toISOString(),
    })),
    mockCategories: state.mockCategories,
    mockEmployees: state.mockEmployees,
    mockBudgets: state.mockBudgets,
    mockMaintenanceRecords: state.mockMaintenanceRecords,
    mockRequestHistory: state.mockRequestHistory,
  };
}

function deserializeState(serialized: SerializedState): MockApiPersistedState {
  return {
    mockRequests: serialized.mockRequests.map((request) => ({
      ...request,
      requestDate: new Date(request.requestDate),
    })),
    mockCategories: serialized.mockCategories,
    mockEmployees: serialized.mockEmployees,
    mockBudgets: serialized.mockBudgets,
    mockMaintenanceRecords: serialized.mockMaintenanceRecords,
    mockRequestHistory: serialized.mockRequestHistory ?? {},
  };
}

export function loadMockApiState(): MockApiPersistedState | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  const raw = sessionStorage.getItem(STATE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return deserializeState(JSON.parse(raw) as SerializedState);
  } catch {
    sessionStorage.removeItem(STATE_KEY);
    return null;
  }
}

export function saveMockApiState(state: MockApiPersistedState): void {
  if (!canUseSessionStorage()) {
    return;
  }

  sessionStorage.setItem(STATE_KEY, JSON.stringify(serializeState(state)));
}

export function resetAllMockDataToSeed(): void {
  if (!canUseSessionStorage()) {
    return;
  }

  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(REGISTERED_CLIENTS_KEY);
  sessionStorage.removeItem(MOCK_AUTH_SESSION_KEY);
}

export function clearMockApiStateStorage(): void {
  resetAllMockDataToSeed();
}

export function loadRegisteredClients(): Client[] {
  if (!canUseSessionStorage()) {
    return [];
  }

  const raw = sessionStorage.getItem(REGISTERED_CLIENTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Client[];
  } catch {
    sessionStorage.removeItem(REGISTERED_CLIENTS_KEY);
    return [];
  }
}

export function saveRegisteredClient(client: Client): void {
  if (!canUseSessionStorage()) {
    return;
  }

  const clients = loadRegisteredClients();
  sessionStorage.setItem(
    REGISTERED_CLIENTS_KEY,
    JSON.stringify([...clients, client]),
  );
}

/** Fonte de clientes para login e rotas do perfil cliente (mock persistido ou fixtures). */
export function getClientsForAuth(): Client[] {
  const clientsById = new Map<number, Client>(
    MOCK_CLIENTS.map((client) => [client.id, { ...client }]),
  );

  for (const client of loadRegisteredClients()) {
    clientsById.set(client.id, { ...client });
  }

  return Array.from(clientsById.values());
}

export function getLoggedInClientId(): number | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  const raw = sessionStorage.getItem(MOCK_AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const user = JSON.parse(raw) as { id?: number; userAccess?: string };
    return user.userAccess === 'client' && typeof user.id === 'number'
      ? user.id
      : null;
  } catch {
    return null;
  }
}

/** Fonte de funcionários para login e sincronização da sessão (mock persistido ou fixtures). */
export function getEmployeesForAuth(): Employee[] {
  const persisted = loadMockApiState();
  if (persisted?.mockEmployees?.length) {
    return persisted.mockEmployees;
  }

  return MOCK_EMPLOYEES.map((employee) => ({ ...employee }));
}

export function getLoggedInEmployeeId(): number | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  const raw = sessionStorage.getItem(MOCK_AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const user = JSON.parse(raw) as { id?: number; userAccess?: string };
    return user.userAccess === 'employee' && typeof user.id === 'number'
      ? user.id
      : null;
  } catch {
    return null;
  }
}

async function getDevBundleToken(): Promise<string | null> {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const script = document.querySelector('script[src*="main"]') as HTMLScriptElement | null;
    const src = script?.src || `${window.location.origin}/main.js`;
    const response = await fetch(src, { method: 'HEAD', cache: 'no-store' });

    return response.headers.get('etag')
      ?? response.headers.get('last-modified')
      ?? src;
  } catch {
    return null;
  }
}

/**
 * Limpa o estado persistido quando o bundle do ng serve muda (reinício do dev server).
 * Mantém os dados no F5 dentro da mesma sessão do servidor.
 */
export async function syncMockApiWithDevServer(): Promise<void> {
  if (!canUseSessionStorage()) {
    return;
  }

  const bundleToken = await getDevBundleToken();
  if (!bundleToken) {
    return;
  }

  const storedToken = sessionStorage.getItem(DEV_BUNDLE_KEY);
  if (storedToken !== bundleToken) {
    resetAllMockDataToSeed();
    sessionStorage.setItem(DEV_BUNDLE_KEY, bundleToken);
  }
}
