import { Component, Inject } from '@angular/core';
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
  constructor(
    private readonly dialogRef: MatDialogRef<PaymentConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: PaymentConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
