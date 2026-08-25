import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { API_URL } from '../../../../core/configs/api.token';
import { provideToastr } from 'ngx-toastr';

import { ManageCategoriesPageComponent } from './manage-categories-page.component';

describe('ManageCategoriesPageComponent', () => {
  let component: ManageCategoriesPageComponent;
  let fixture: ComponentFixture<ManageCategoriesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageCategoriesPageComponent, MatDialogModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideToastr(),
        { provide: API_URL, useValue: 'http://localhost:8080/api' },
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
