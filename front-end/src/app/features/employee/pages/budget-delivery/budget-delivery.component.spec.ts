import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';

import { BudgetDeliveryComponent } from './budget-delivery.component';
import { mockApiInterceptor } from '../../../../core/interceptors/mock-api.interceptor';

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
});
