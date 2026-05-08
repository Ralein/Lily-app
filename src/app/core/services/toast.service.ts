import { Injectable, signal, inject } from '@angular/core';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: ToastMessage['type'] = 'success', duration = 3000): void {
    const toast: ToastMessage = {
      id: crypto.randomUUID(),
      message,
      type,
      duration,
    };

    this._toasts.update(t => [...t, toast]);

    setTimeout(() => {
      this.dismiss(toast.id);
    }, duration);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error', 5000);
  }

  warning(message: string): void {
    this.show(message, 'warning', 4000);
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  dismiss(id: string): void {
    this._toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
