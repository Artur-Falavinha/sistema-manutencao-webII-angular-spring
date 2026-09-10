import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';

import { PaymentPanelComponent } from './payment-panel.component';

describe('PaymentPanelComponent', () => {
  let component: PaymentPanelComponent;
  let fixture: ComponentFixture<PaymentPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentPanelComponent],
      providers: [provideRouter([]), provideHttpClient(), provideToastr()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
