import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewRequestsPageComponent } from './view-requests-page.component';
import { MaintenanceRequestResponseDTO } from '../../../../shared/models/maintenance-request.models';

describe('ViewRequetsPageComponent', () => {
  let component: ViewRequestsPageComponent;
  let fixture: ComponentFixture<ViewRequestsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewRequestsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewRequestsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('actionLabel (RF013)', () => {
    const comStatus = (statusName: string) =>
      component.actionLabel({ statusName } as MaintenanceRequestResponseDTO);

    it('mostra Efetuar Orçamento para ABERTA', () => {
      expect(comStatus('ABERTA')).toBe('Efetuar Orçamento');
    });

    it('mostra Efetuar Manutenção para APROVADA e REDIRECIONADA', () => {
      expect(comStatus('APROVADA')).toBe('Efetuar Manutenção');
      expect(comStatus('REDIRECIONADA')).toBe('Efetuar Manutenção');
    });

    it('mostra Finalizar Solicitação para PAGA', () => {
      expect(comStatus('PAGA')).toBe('Finalizar Solicitação');
    });

    it('não mostra ação para os demais estados', () => {
      ['ORÇADA', 'REJEITADA', 'ARRUMADA', 'FINALIZADA'].forEach((status) =>
        expect(comStatus(status)).toBeNull(),
      );
    });
  });
});
