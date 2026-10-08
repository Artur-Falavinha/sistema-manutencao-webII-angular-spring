import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideToastr } from 'ngx-toastr';

import { ReportsPageComponent } from './reports-page.component';
import { provideBrazilianMaterialDate } from '../../../../shared/providers/material-date.providers';

describe('ReportsPageComponent', () => {
  let component: ReportsPageComponent;
  let fixture: ComponentFixture<ReportsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsPageComponent],
      providers: [provideToastr(), ...provideBrazilianMaterialDate()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
