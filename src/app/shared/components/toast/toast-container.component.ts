import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import {
  LucideCircleCheck, LucideCircleX, LucideTriangleAlert, LucideInfo,
} from '@lucide/angular';

@Component({
  selector: 'lily-toast-container',
  standalone: true,
  imports: [LucideCircleCheck, LucideCircleX, LucideTriangleAlert, LucideInfo],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}" (click)="toastService.dismiss(toast.id)">
          <span class="toast__icon">
            @switch (toast.type) {
              @case ('success') { <svg lucideCircleCheck [size]="18"></svg> }
              @case ('error') { <svg lucideCircleX [size]="18"></svg> }
              @case ('warning') { <svg lucideTriangleAlert [size]="18"></svg> }
              @case ('info') { <svg lucideInfo [size]="18"></svg> }
            }
          </span>
          <span class="toast__message">{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: var(--space-4); right: var(--space-4); z-index: var(--z-toast);
      display: flex; flex-direction: column; gap: var(--space-2); max-width: 380px;
    }
    .toast {
      display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg); backdrop-filter: blur(12px); cursor: pointer;
      animation: slideRight 0.3s var(--ease-spring); border: 1px solid;
      &--success { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); color: var(--color-emerald-light); }
      &--error { background: rgba(244, 63, 94, 0.15); border-color: rgba(244, 63, 94, 0.3); color: var(--color-rose-light); }
      &--warning { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); color: var(--color-amber-light); }
      &--info { background: rgba(14, 165, 233, 0.15); border-color: rgba(14, 165, 233, 0.3); color: var(--color-sky-light); }
    }
    .toast__icon { display: inline-flex; flex-shrink: 0; }
    .toast__message { font-size: var(--fs-sm); font-weight: var(--fw-medium); }
    @keyframes slideRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  `],
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
