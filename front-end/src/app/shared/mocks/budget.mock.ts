import { Budget } from '../models/budget.model';
import { ServiceItemDTO } from '../models/service-item.model';

export const MOCK_SERVICE_ITEMS: ServiceItemDTO[] = [
  { id: 1, nome: 'Diagnóstico técnico completo', valorServico: 80 },
  { id: 2, nome: 'Limpeza interna', valorServico: 60 },
  { id: 3, nome: 'Substituição de componente', valorServico: 250 },
  { id: 4, nome: 'Mão de obra especializada', valorServico: 120 },
  { id: 5, nome: 'Troca de compressor', valorServico: 480 },
];

export const MOCK_BUDGETS: Budget[] = [
  {
    id: 1,
    requestId: 2,
    employeeId: 1,
    total: 340,
    services: 'Diagnóstico técnico completo, Limpeza interna',
    serviceIds: [1, 2],
    createdAt: '2026-08-13T09:00:00',
    updatedAt: '2026-08-13T09:00:00',
  },
  {
    id: 2,
    requestId: 3,
    employeeId: 2,
    total: 730,
    services: 'Diagnóstico técnico completo, Troca de compressor, Mão de obra especializada',
    serviceIds: [1, 5, 4],
    createdAt: '2026-08-06T13:20:00',
    updatedAt: '2026-08-06T15:00:00',
  },
  {
    id: 3,
    requestId: 4,
    employeeId: 2,
    total: 330,
    services: 'Diagnóstico técnico completo, Substituição de componente',
    serviceIds: [1, 3],
    createdAt: '2026-08-02T10:10:00',
    updatedAt: '2026-08-03T08:00:00',
  },
];
