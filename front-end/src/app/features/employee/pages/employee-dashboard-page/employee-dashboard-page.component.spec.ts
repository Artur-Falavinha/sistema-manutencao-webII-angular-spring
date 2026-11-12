import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeDashboardPageComponent } from './employee-dashboard-page.component';

describe('EmployeeDashboardPageComponent', () => {
  let component: EmployeeDashboardPageComponent;
  let fixture: ComponentFixture<EmployeeDashboardPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeDashboardPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeDashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lista só as solicitações ABERTA com o botão Efetuar Orçamento (RF011)', () => {
    const base = { defectDescription: '', requestDate: '2026-11-07T10:00:00', statusColor: '', categoryName: 'Notebook', clientName: 'João' };
    component.requests = signal([
      { ...base, id: 1, equipmentName: 'Notebook Dell', statusName: 'ABERTA' },
      { ...base, id: 2, equipmentName: 'Impressora HP', statusName: 'ORÇADA' },
    ]);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(component.getOpenRequestCount()).toBe(1);
    expect(element.querySelectorAll('app-request-card').length).toBe(1);
    expect(element.querySelector('app-request-card button')?.textContent).toContain('Efetuar Orçamento');
  });

  it('avisa quando não há solicitação aberta', () => {
    component.requests = signal([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty-state')?.textContent).toContain('Nenhuma solicitação aberta');
  });
});
