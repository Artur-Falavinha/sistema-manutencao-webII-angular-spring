import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { RequestCardComponent } from './request-card.component';
import { mockApiInterceptor } from '../../../../../../core/interceptors/mock-api.interceptor';

describe('RequestCardComponent', () => {
  let component: RequestCardComponent;
  let fixture: ComponentFixture<RequestCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestCardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([mockApiInterceptor]))
      ]
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
