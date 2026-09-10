import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestCardComponent } from './request-card.component';

describe('RequestCardComponent', () => {
  let component: RequestCardComponent;
  let fixture: ComponentFixture<RequestCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestCardComponent);
    component = fixture.componentInstance;
    component.request = {
      id: 1,
      equipmentName: 'Notebook',
      defectDescription: 'Não liga',
      requestDate: '2026-09-01T09:00:00',
      statusName: 'ABERTA',
      statusColor: '#6b7280',
      categoryName: 'Informática',
      clientName: 'Cliente'
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
