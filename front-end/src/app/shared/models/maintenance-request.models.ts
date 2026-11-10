import { Budget } from "./budget.model";
import { MaintenanceRecordDTO } from "./maintenance-record.model";
import { RequestHistory } from "./request-history";
import { Status } from "./status";

export interface MaintenanceRequestCreateDTO {
  equipmentName: string;
  defectDescription: string;
  categoryId: number; 
}

export interface MaintenanceRequestResponseDTO {
  id: number;
  equipmentName: string;
  defectDescription: string;
  requestDate: string; 
  statusName: string;  
  statusColor: string; 
  categoryName: string;
  clientName: string;
}

export interface ClientRequestDetailDTO {
  id: number;
  equipmentName: string;
  defectDescription: string;
  requestDate: string; 
  status: Status; 
  categoryName: string;
  rejectionReason?: string; 

  budgets: Budget[];
  history: RequestHistory[];
}


// Dados completos do cliente enviados pelo back (ClientDTO) no detalhe do funcionário (RF012/RF014).
export interface EmployeeRequestClientDTO {
  id: number;
  name: string;
  email: string;
  cpf: string;
  phoneNumber: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

export interface EmployeeRequestDetailDTO {
  id: number;
  equipmentName: string;
  defectDescription: string;
  requestDate: string;
  status: Status;
  categoryName: string;

  client: EmployeeRequestClientDTO;
  assignedEmployeeId?: number;
  assignedEmployeeName?: string;

  budgets: Budget[];
  maintenanceRecord?: MaintenanceRecordDTO; 
}

export interface RejectionDTO {
  rejectionReason: string;
}