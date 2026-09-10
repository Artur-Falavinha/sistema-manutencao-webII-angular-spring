import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { RequestDescriptionComponent } from './request-description.component';

describe('RequestDescriptionComponent', () => {
  let component: RequestDescriptionComponent;
  let fixture: ComponentFixture<RequestDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestDescriptionComponent],
      providers: [provideHttpClient()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestDescriptionComponent);
    component = fixture.componentInstance;
    component.request = {
      id: 1,
      equipmentName: 'Notebook Dell',
      defectDescription: 'Não liga',
      requestDate: new Date(),
      status: 'ABERTA',
      categoryName: 'Informática'
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
