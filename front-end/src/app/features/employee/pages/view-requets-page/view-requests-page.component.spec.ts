import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, of } from 'rxjs';
import { ViewRequestsPageComponent } from './view-requests-page.component';
import { MaintenanceRequestResponseDTO } from '../../../../shared/models/maintenance-request.models';
import { MaintenanceRequestService } from '../../../../core/services/maintenance-request.service';
import { StatusService } from '../../../../core/services/status.service';

describe('ViewRequestsPageComponent', () => {
  let component: ViewRequestsPageComponent;
  let fixture: ComponentFixture<ViewRequestsPageComponent>;
  let requests: BehaviorSubject<MaintenanceRequestResponseDTO[]>;
  const statuses = ['ABERTA', 'ORÇADA', 'APROVADA', 'REJEITADA', 'REDIRECIONADA', 'ARRUMADA', 'PAGA', 'FINALIZADA'];
  function request(id: number, statusName = 'ABERTA', requestDate = '2026-11-11T10:00:00'): MaintenanceRequestResponseDTO {
    return { id, statusName, requestDate, equipmentName: `Equipamento ${id}`, categoryName: 'Notebook', clientName: 'João', defectDescription: 'Não liga', statusColor: '#333333' };
  }
  beforeEach(async () => {
    requests = new BehaviorSubject<MaintenanceRequestResponseDTO[]>([]);
    await TestBed.configureTestingModule({ imports: [ViewRequestsPageComponent], providers: [
      provideRouter([]),
      { provide: MaintenanceRequestService, useValue: { getAllEmployeeRequests: () => requests } },
      { provide: StatusService, useValue: { getAll: () => of(statuses.map((nome, id) => ({ id, nome, cor: '#333333' }))) } },
    ] }).compileComponents();
    fixture = TestBed.createComponent(ViewRequestsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('mostra apenas as quatro ações aplicáveis e direciona ao contexto correto', () => {
    requests.next(statuses.map((status, id) => request(id + 1, status)));
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.directive(RouterLink));
    expect(buttons.map(button => button.nativeElement.textContent.trim())).toEqual(['Efetuar Orçamento', 'Efetuar Manutenção', 'Efetuar Manutenção', 'Finalizar Solicitação']);
    const router = TestBed.inject(Router);
    expect(buttons.map(button => router.serializeUrl(button.injector.get(RouterLink).urlTree!))).toEqual([
      '/employee/budget-delivery/1?acao=orcamento', '/employee/budget-delivery/3?acao=manutencao',
      '/employee/budget-delivery/5?acao=manutencao', '/employee/budget-delivery/7?acao=finalizacao',
    ]);
  });
  it('ordena da mais antiga para a mais recente', () => {
    requests.next([request(3, 'PAGA', '2026-11-13T00:00:00'), request(1), request(2, 'APROVADA', '2026-11-12T00:00:00')]);
    fixture.detectChanges();
    expect(component.dataSource.data.map(item => item.id)).toEqual([1, 2, 3]);
    expect(component.sort.direction).toBe('asc');
  });
  it('inclui os limites civis do período sem incluir a meia-noite do dia seguinte', () => {
    requests.next([request(1, 'ABERTA', '2026-11-10T23:59:59.999'), request(2, 'ABERTA', '2026-11-11T00:00:00'), request(3, 'ABERTA', '2026-11-12T23:59:59.999'), request(4, 'ABERTA', '2026-11-13T00:00:00')]);
    component.dateFilterMode.set('periodo');
    component.periodStart.set(new Date(2026, 10, 11));
    component.periodEnd.set(new Date(2026, 10, 12));
    fixture.detectChanges();
    expect(component.dataSource.data.map(item => item.id)).toEqual([2, 3]);
  });
  it('rejeita período incompleto ou invertido', () => {
    requests.next([request(1)]);
    component.dateFilterMode.set('periodo');
    component.periodStart.set(new Date(2026, 10, 12));
    fixture.detectChanges();
    expect(component.periodoValido()).toBeFalse();
    expect(component.dataSource.data).toHaveSize(0);
    component.periodEnd.set(new Date(2026, 10, 11));
    fixture.detectChanges();
    expect(component.periodoValido()).toBeFalse();
    expect(component.dataSource.data).toHaveSize(0);
  });
  it('HOJE usa o dia local e TODOS restaura os demais dias', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 10, 11, 12));
    try {
      requests.next([request(1, 'ABERTA', '2026-11-10T23:59:59'), request(2, 'ABERTA', '2026-11-11T00:00:00'), request(3, 'ABERTA', '2026-11-11T23:59:59'), request(4, 'ABERTA', '2026-11-12T00:00:00')]);
      component.dateFilterMode.set('hoje'); fixture.detectChanges();
      expect(component.dataSource.data.map(item => item.id)).toEqual([2, 3]);
      component.dateFilterMode.set('todos'); fixture.detectChanges();
      expect(component.dataSource.data).toHaveSize(4);
    } finally { jasmine.clock().uninstall(); }
  });
});
