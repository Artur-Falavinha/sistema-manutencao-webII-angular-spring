import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { NewCategoryModalComponent } from './new-category-modal.component';

describe('NewCategoryModalComponent', () => {
  let component: NewCategoryModalComponent;
  let fixture: ComponentFixture<NewCategoryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewCategoryModalComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MatDialogRef, useValue: { close: () => undefined } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewCategoryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
