import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';

import { BudgetDeliveryComponent } from './budget-delivery.component';
import { mockApiInterceptor } from '../../../../core/interceptors/mock-api.interceptor';
import { EmployeeRequestDetailDTO } from '../../../../shared/models/maintenance-request.models';

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
      component.temOrcamento = false;
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
  });
});
