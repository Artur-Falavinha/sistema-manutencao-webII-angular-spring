import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-shell',
  imports: [MatDialogModule],
  templateUrl: './dialog-shell.component.html',
  styleUrl: './dialog-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogShellComponent {
  readonly title = input.required<string>();
  readonly description = input<string>();
}
