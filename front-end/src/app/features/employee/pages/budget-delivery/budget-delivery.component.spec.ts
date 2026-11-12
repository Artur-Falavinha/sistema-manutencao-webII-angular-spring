import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { MaintenanceRequestService } from '../../../../core/services/maintenance-request.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';

import { BudgetDeliveryComponent } from './budget-delivery.component';
import { mockApiInterceptor } from '../../../../../testing/core/interceptors/mock-api.interceptor';
import { EmployeeRequestDetailDTO } from '../../../../shared/models/maintenance-request.models';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { Employee } from '../../../../shared/models/employee';

describe('BudgetDeliveryComponent', () => {
  let component: BudgetDeliveryComponent;
  let fixture: ComponentFixture<BudgetDeliveryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetDeliveryComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([mockApiInterceptor])),
        provideToastr()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BudgetDeliveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('permitidoCriarManutencao (RF014)', () => {
    // Sem orçamento carregado, a decisão depende só do nome do status
    // vindo do back-end (StatusEnum: APROVADA, REDIRECIONADA...).
    const comStatus = (nome: string) => {
      component.request = { status: { id: 0, nome, cor: '' } } as EmployeeRequestDetailDTO;
    };

    it('permite registrar manutenção quando a solicitação está APROVADA', () => {
      comStatus('APROVADA');
      expect(component.permitidoCriarManutencao()).toBeTrue();
    });

    it('permite registrar manutenção quando a solicitação está REDIRECIONADA', () => {
      comStatus('REDIRECIONADA');
      expect(component.permitidoCriarManutencao()).toBeTrue();
    });

    it('bloqueia o registro de manutenção em solicitação ABERTA sem orçamento', () => {
      comStatus('ABERTA');
      expect(component.permitidoCriarManutencao()).toBeFalse();
    });

    it('bloqueia o registro de manutenção em solicitação ORÇADA, mesmo com orçamento', () => {
      component.request = {
        status: { id: 0, nome: 'ORÇADA', cor: '' },
        budgets: [{ total: 100 }],
      } as EmployeeRequestDetailDTO;
      expect(component.permitidoCriarManutencao()).toBeFalse();
    });
  });

  it('mantém o formulário obrigatório sem impor a faixa de 10 a 500', () => {
    component.manutencaoDescricaoInput = ' '; component.manutencaoOrientacaoInput = 'OK';
    expect(component.isManutencaoFormValid()).toBeFalse();
    component.manutencaoDescricaoInput = 'OK';
    expect(component.isManutencaoFormValid()).toBeTrue();
    component.manutencaoDescricaoInput = 'A'.repeat(501);
    expect(component.isManutencaoFormValid()).toBeTrue();
  });
  it('não reexecuta uma manutenção já registrada', () => {
    component.request = { status: { nome: 'APROVADA' } } as EmployeeRequestDetailDTO;
    component.temManutencao = true;
    expect(component.permitidoCriarManutencao()).toBeFalse();
  });
  it('não registra sucesso quando a API recusa o funcionário', () => {
    component.request = { id: 1, status: { nome: 'APROVADA' }, assignedEmployeeId: 2 } as EmployeeRequestDetailDTO;
    component.responsavel = { id: 2, name: 'Maria Silva' } as Employee;
    spyOnProperty(TestBed.inject(AuthService), 'currentUserValue').and.returnValue({
      id: 2, name: 'Maria', userAccess: 'employee', token: 'token',
    });
    component.manutencaoDescricaoInput = 'Reparo'; component.manutencaoOrientacaoInput = 'OK';
    const service = TestBed.inject(MaintenanceRequestService);
    spyOn(service, 'executeMaintenance').and.returnValue(throwError(() => new HttpErrorResponse({status: 403})));
    const success = spyOn(TestBed.inject(ToastService), 'success');
    component.confirmarManutencao();
    expect(service.executeMaintenance).toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
    expect(component.temManutencao).toBeFalse();
  });
  it('impede o envio quando o nome coincide e o ID é diferente', () => {
    component.request = { id: 1, status: { nome: 'APROVADA' }, assignedEmployeeId: 2 } as EmployeeRequestDetailDTO;
    component.responsavel = { id: 2, name: 'Maria' } as Employee;
    component.manutencaoDescricaoInput = 'Reparo';
    component.manutencaoOrientacaoInput = 'OK';
    spyOnProperty(TestBed.inject(AuthService), 'currentUserValue').and.returnValue({
      id: 3, name: 'Maria', userAccess: 'employee', token: 'token',
    });
    const executeMaintenance = spyOn(TestBed.inject(MaintenanceRequestService), 'executeMaintenance');

    component.confirmarManutencao();

    expect(executeMaintenance).not.toHaveBeenCalled();
  });
  it('preserva o responsável quando o servidor recusa um destinatário inativo', () => {
    component.request = { id: 1 } as EmployeeRequestDetailDTO;
    component.responsavel = { id: 2, name: 'Maria' } as Employee;
    component.selectedFuncionario = { id: 3, name: 'Mário' } as Employee;
    spyOn(TestBed.inject(MaintenanceRequestService), 'redirectMaintenance').and.returnValue(throwError(() => new HttpErrorResponse({status: 409})));
    const success = spyOn(TestBed.inject(ToastService), 'success');
    component.atribuirResponsavel();
    expect(component.responsavel.id).toBe(2);
    expect(success).not.toHaveBeenCalled();
  });
});
