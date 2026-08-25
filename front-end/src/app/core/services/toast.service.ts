import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastr = inject(ToastrService, { optional: true });

  success(title: string, message: string): void {
    this.toastr?.success(message, title);
  }

  error(title: string, message: string): void {
    this.toastr?.error(message, title);
  }
}