import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DialogShellComponent } from '../../../../../shared/components/dialog-shell/dialog-shell.component';

export interface BudgetApproveConfirmDialogData {
  equipmentName: string;
  total: number;
}

@Component({
  selector: 'app-budget-approve-confirm-dialog',
  imports: [CommonModule, MatButtonModule, DialogShellComponent],
  templateUrl: './budget-approve-confirm-dialog.component.html',
  styleUrl: './budget-approve-confirm-dialog.component.css',
})
export class BudgetApproveConfirmDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<BudgetApproveConfirmDialogComponent>>(MatDialogRef);
  readonly data = inject<BudgetApproveConfirmDialogData>(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
