import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dialog-shell',
  imports: [MatDialogModule, MatIconModule],
  templateUrl: './dialog-shell.component.html',
  styleUrl: './dialog-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogShellComponent {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly showWarningIcon = input(false);
}
