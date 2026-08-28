import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { WarningDialogComponent } from './warning-dialog.component';

describe('WarningDialogComponent', () => {
  let component: WarningDialogComponent;
  let fixture: ComponentFixture<WarningDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarningDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { title: 'Teste', message: 'Teste' } },
        { provide: MatDialogRef, useValue: { close: () => undefined } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarningDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});