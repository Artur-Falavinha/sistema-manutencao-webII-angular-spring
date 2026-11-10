import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';

import { BudgetDeliveryComponent } from './budget-delivery.component';
import { mockApiInterceptor } from '../../../../core/interceptors/mock-api.interceptor';
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
      component.request.set({ status: { id: 0, nome, cor: '' } } as EmployeeRequestDetailDTO);
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
      component.request.set({
        status: { id: 0, nome: 'ORÇADA', cor: '' },
        budgets: [{ total: 100 }],
      } as EmployeeRequestDetailDTO);
      expect(component.permitidoCriarManutencao()).toBeFalse();
    });
  });

  describe('responsável e redirecionamento (RF014/RF015)', () => {
    beforeEach(() => {
      spyOnProperty(TestBed.inject(AuthService), 'currentUserValue', 'get').and.returnValue({
        id: 2, name: 'Maria', userAccess: 'employee', token: 't',
      });
    });

    it('reconhece o responsável pelo id do funcionário logado', () => {
      component.responsavel.set({ id: 2, name: 'Maria' });
      expect(component.souResponsavel()).toBeTrue();

      component.responsavel.set({ id: 3, name: 'Maria' });
      expect(component.souResponsavel()).toBeFalse();
    });

    it('não oferece o próprio funcionário nem inativos como destino', () => {
      component.funcionariosDisponiveis.set([
        { id: 2, name: 'Maria', active: true },
        { id: 3, name: 'Mário', active: true },
        { id: 4, name: 'Inativo', active: false },
      ] as Employee[]);

      expect(component.funcionariosParaRedirecionar().map((f) => f.id)).toEqual([3]);
    });
  });
});
