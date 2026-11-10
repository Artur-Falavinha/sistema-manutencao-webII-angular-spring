import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DialogShellComponent } from '../../../../../shared/components/dialog-shell/dialog-shell.component';

export interface BudgetRescueConfirmDialogData {
  equipmentName: string;
  total?: number;
}

@Component({
  selector: 'app-budget-rescue-confirm-dialog',
  imports: [CommonModule, MatButtonModule, DialogShellComponent],
  templateUrl: './budget-rescue-confirm-dialog.component.html',
  styleUrl: './budget-rescue-confirm-dialog.component.css',
})
export class BudgetRescueConfirmDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<BudgetRescueConfirmDialogComponent>>(MatDialogRef);
  readonly data = inject<BudgetRescueConfirmDialogData>(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
