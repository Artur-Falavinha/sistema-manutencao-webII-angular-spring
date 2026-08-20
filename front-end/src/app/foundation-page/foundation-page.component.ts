import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-foundation-page',
  standalone: true,
  templateUrl: './foundation-page.component.html',
  styleUrl: './foundation-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FoundationPageComponent {}
