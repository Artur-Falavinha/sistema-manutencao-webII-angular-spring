import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';

import { ApproveRejectPanelComponent } from './approve-reject-panel.component';

describe('ApproveRejectPanelComponent', () => {
  let component: ApproveRejectPanelComponent;
  let fixture: ComponentFixture<ApproveRejectPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApproveRejectPanelComponent],
      providers: [provideRouter([]), provideHttpClient(), provideToastr()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApproveRejectPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
