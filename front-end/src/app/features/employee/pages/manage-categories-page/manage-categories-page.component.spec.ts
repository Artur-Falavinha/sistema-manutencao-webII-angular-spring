import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { provideToastr } from 'ngx-toastr';

import { ManageCategoriesPageComponent } from './manage-categories-page.component';

describe('ManageCategoriesPageComponent', () => {
  let component: ManageCategoriesPageComponent;
  let fixture: ComponentFixture<ManageCategoriesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageCategoriesPageComponent, MatDialogModule],
      providers: [provideToastr(),
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => undefined } }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageCategoriesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
