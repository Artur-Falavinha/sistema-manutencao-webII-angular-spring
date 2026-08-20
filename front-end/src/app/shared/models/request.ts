export interface Request {
  id: number;
  equipmentName: string;
  equipmentDescription: string;
  requestDate: Date;
  category: string;
  statusId: number;
  status?: 'APROVADA' | 'REJEITADA' | string;
  categoryId: number;
  clientId: number;
  employeeId: number;
  rejectionReason?: string;
}
