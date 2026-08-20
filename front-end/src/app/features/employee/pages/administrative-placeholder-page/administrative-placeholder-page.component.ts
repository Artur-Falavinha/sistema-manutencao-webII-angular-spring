import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-administrative-placeholder-page',
  standalone: true,
  templateUrl: './administrative-placeholder-page.component.html',
  styleUrl: './administrative-placeholder-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdministrativePlaceholderPageComponent {}
