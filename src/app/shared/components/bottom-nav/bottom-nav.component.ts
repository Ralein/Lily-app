import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LilyIconComponent } from '../../icons/lily-icon.component';

@Component({
  selector: 'lily-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LilyIconComponent],
  template: `
    <nav class="bottom-nav">
      @for (item of navItems; track item.path) {
        @if (item.action) {
          <button (click)="item.action()" class="bottom-nav__item">
            <lily-icon [name]="item.icon" [size]="22" class="bottom-nav__icon" />
            <span class="bottom-nav__label">{{ item.label }}</span>
          </button>
        } @else {
          <a [routerLink]="item.path" routerLinkActive="active" class="bottom-nav__item">
            <lily-icon [name]="item.icon" [size]="22" class="bottom-nav__icon" />
            <span class="bottom-nav__label">{{ item.label }}</span>
          </a>
        }
      }
    </nav>
  `,
  styles: [`
    .bottom-nav {
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: 100%;
      padding: 0 var(--space-2);
      padding-bottom: env(safe-area-inset-bottom);
      background: transparent;
    }
    .bottom-nav__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: var(--space-2) var(--space-1);
      border-radius: var(--radius-xl);
      color: var(--color-text-muted);
      text-decoration: none;
      transition: all var(--duration-fast) var(--ease-spring);
      min-width: 64px;
      background: transparent;
      border: none;
      cursor: pointer;

      &:active {
        transform: scale(0.92);
      }

      &.active, &:hover {
        color: var(--color-text-primary);
        
        .bottom-nav__icon {
          color: var(--color-violet);
          transform: translateY(-2px) scale(1.1);
        }
      }
    }
    .bottom-nav__icon {
      transition: all var(--duration-fast) var(--ease-spring);
    }
    .bottom-nav__label {
      font-size: 10px;
      font-weight: var(--fw-semibold);
      letter-spacing: 0.2px;
    }
  `],
})
export class BottomNavComponent {
  navItems = [
    { path: '/dashboard', icon: 'layout-dashboard', label: 'Home' },
    { path: '/budgets', icon: 'target', label: 'Budget' },
    { action: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true })), icon: 'search', label: 'Search' },
    { path: '/goals', icon: 'trophy', label: 'Goals' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
  ];
}
