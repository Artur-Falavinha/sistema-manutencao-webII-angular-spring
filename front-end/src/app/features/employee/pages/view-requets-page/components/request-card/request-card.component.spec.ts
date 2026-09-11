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
      equipmentName: 'Notebook Dell Inspiron 15',
      defectDescription: 'Não liga.',
      requestDate: '2026-08-10T09:15:00',
      statusName: 'ABERTA',
      statusColor: '#777777',
      categoryName: 'Informática',
      clientName: 'Ana Souza'
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
