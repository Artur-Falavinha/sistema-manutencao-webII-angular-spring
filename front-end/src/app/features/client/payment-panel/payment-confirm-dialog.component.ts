import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DialogShellComponent } from '../../../shared/components/dialog-shell/dialog-shell.component';

export interface PaymentConfirmDialogData {
  paymentMethodLabel: string;
  total: number;
  equipmentName: string;
}

@Component({
  selector: 'app-payment-confirm-dialog',
  imports: [CommonModule, MatButtonModule, DialogShellComponent],
  templateUrl: './payment-confirm-dialog.component.html',
  styleUrl: './payment-confirm-dialog.component.css',
})
export class PaymentConfirmDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<PaymentConfirmDialogComponent>>(MatDialogRef);
  readonly data = inject<PaymentConfirmDialogData>(MAT_DIALOG_DATA);

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
