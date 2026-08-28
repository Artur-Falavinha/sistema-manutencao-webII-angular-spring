import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { provideToastr } from 'ngx-toastr';
import { provideHttpClient } from '@angular/common/http';

import { NewRequestPageComponent } from './new-request-page.component';

describe('NewRequestPageComponent', () => {
  let component: NewRequestPageComponent;
  let fixture: ComponentFixture<NewRequestPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewRequestPageComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: () => {} } },
        provideToastr(),
        provideHttpClient(),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewRequestPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
