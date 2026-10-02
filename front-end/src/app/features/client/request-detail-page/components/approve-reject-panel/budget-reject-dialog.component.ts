import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DialogShellComponent } from '../../../../../shared/components/dialog-shell/dialog-shell.component';

export interface BudgetRejectDialogData {
  equipmentName: string;
  total: number;
}

@Component({
  selector: 'app-budget-reject-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    DialogShellComponent,
  ],
  templateUrl: './budget-reject-dialog.component.html',
  styleUrl: './budget-reject-dialog.component.css',
})
export class BudgetRejectDialogComponent {
  rejectionReason = '';

  constructor(
    private readonly dialogRef: MatDialogRef<BudgetRejectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: BudgetRejectDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    const reason = this.rejectionReason.trim();
    if (!reason) {
      return;
    }

    this.dialogRef.close(reason);
  }
}
