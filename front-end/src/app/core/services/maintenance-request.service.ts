import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MaintenanceRequestCreateDTO, MaintenanceRequestResponseDTO } from '../../shared/models/maintenance-request.models';
import { Request } from '../../shared/models/request';
import { MOCK_REQUESTS } from '../../shared/mocks/request.mock';
import { MOCK_CATEGORIES } from '../../shared/mocks/category.mock';
import { MOCK_STATUSES } from '../../shared/mocks/status.mock';
import { MOCK_CLIENTS } from '../../shared/mocks/client.mock';

const LOGGED_IN_CLIENT_ID = 1;

@Injectable({
  providedIn: 'root'
})
export class MaintenanceRequestService {
  private requests: Request[] = [...MOCK_REQUESTS];

  getAllClientRequests(): Observable<MaintenanceRequestResponseDTO[]> {
    const responses = this.requests
      .filter((request) => request.clientId === LOGGED_IN_CLIENT_ID)
      .map((request) => this.toResponseDTO(request));

    return of(responses);
  }

  create(data: MaintenanceRequestCreateDTO): Observable<MaintenanceRequestResponseDTO> {
    const created: Request = {
      id: Math.max(0, ...this.requests.map((request) => request.id)) + 1,
      equipmentName: data.equipmentName,
      equipmentDescription: data.defectDescription,
      requestDate: new Date(),
      category: MOCK_CATEGORIES.find((category) => category.id === data.categoryId)?.name ?? '',
      categoryId: data.categoryId,
      statusId: 1,
      status: 'ABERTA',
      clientId: LOGGED_IN_CLIENT_ID,
      employeeId: 0,
    };

    this.requests = [created, ...this.requests];

    return of(this.toResponseDTO(created));
  }

  private toResponseDTO(request: Request): MaintenanceRequestResponseDTO {
    const status = MOCK_STATUSES.find((s) => s.id === request.statusId);
    const category = MOCK_CATEGORIES.find((c) => c.id === request.categoryId);
    const client = MOCK_CLIENTS.find((c) => c.id === request.clientId);

    return {
      id: request.id,
      equipmentName: request.equipmentName,
      defectDescription: request.equipmentDescription,
      requestDate: request.requestDate.toISOString(),
      statusName: status?.nome ?? '',
      statusColor: status?.cor ?? '',
      categoryName: category?.name ?? '',
      clientName: client?.name ?? '',
    };
  }
}
