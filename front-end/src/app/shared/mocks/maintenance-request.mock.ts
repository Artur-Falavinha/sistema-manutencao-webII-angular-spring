import { MaintenanceRequestResponseDTO } from '../models/maintenance-request.models';

/**
 * SCAFFOLD TEMPORÁRIO — dados simulados no shape real de MaintenanceRequestResponseDTO.
 * Consumido apenas pelo MockApiInterceptor. Remover quando o backend
 * de solicitações for integrado (marco 08/10, RF011-RF016).
 */
export const MOCK_EMPLOYEE_REQUESTS: MaintenanceRequestResponseDTO[] = [
  {
    id: 1,
    equipmentName: 'Notebook Dell Inspiron 15',
    defectDescription: 'Não liga após queda de energia.',
    requestDate: '2026-08-10T09:15:00',
    statusName: 'ABERTA',
    statusColor: '#6c757d',
    categoryName: 'Informática',
    clientName: 'Ana Souza',
  },
  {
    id: 2,
    equipmentName: 'Smart TV Samsung 50"',
    defectDescription: 'Tela com listras verticais.',
    requestDate: '2026-08-12T14:30:00',
    statusName: 'ORÇADA',
    statusColor: '#856404',
    categoryName: 'Eletrônicos',
    clientName: 'Ana Souza',
  },
  {
    id: 3,
    equipmentName: 'Geladeira Brastemp Frost Free',
    defectDescription: 'Não está gelando e faz ruído no compressor.',
    requestDate: '2026-08-05T11:00:00',
    statusName: 'APROVADA',
    statusColor: '#25A46B',
    categoryName: 'Eletrodomésticos',
    clientName: 'Carlos Lima',
  },
  {
    id: 4,
    equipmentName: 'Roteador TP-Link Archer C6',
    defectDescription: 'Sinal de Wi-Fi caindo constantemente.',
    requestDate: '2026-08-01T16:45:00',
    statusName: 'REJEITADA',
    statusColor: '#FF5E5B',
    categoryName: 'Redes',
    clientName: 'Carlos Lima',
  },
  {
    id: 5,
    equipmentName: 'Console PlayStation 5',
    defectDescription: 'Superaquecimento e desligamento automático.',
    requestDate: '2026-07-20T10:00:00',
    statusName: 'FINALIZADA',
    statusColor: '#198754',
    categoryName: 'Eletrônicos',
    clientName: 'Ana Souza',
  },
];
