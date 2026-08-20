import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoundationPageComponent } from './foundation-page.component';

describe('FoundationPageComponent', () => {
  let fixture: ComponentFixture<FoundationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoundationPageComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FoundationPageComponent);
    fixture.detectChanges();
  });

  it('should create the temporary foundation page', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should present the three technical foundation stages', () => {
    const element: HTMLElement = fixture.nativeElement;
    const stages = element.querySelectorAll('[data-foundation-stage]');

    expect(element.querySelector('h1')?.textContent).toContain('Sistema de manutenção');
    expect(stages.length).toBe(3);
    expect(stages[0].textContent).toContain('Base migrada');
    expect(stages[1].textContent).toContain('Identidade aplicada');
    expect(stages[2].textContent).toContain('Validação técnica');
  });
});
