import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LilyIconComponent } from '../../icons/lily-icon.component';

@Component({
  selector: 'lily-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LilyIconComponent],
  template: `
    <div class="bottom-nav-container">
      <nav class="bottom-nav">
        @for (item of navItems; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active" #rla="routerLinkActive" class="bottom-nav__item">
            <div class="icon-wrapper">
              <lily-icon [name]="item.icon" [size]="20" class="bottom-nav__icon" />
            </div>
            @if (rla.isActive) {
              <span class="bottom-nav__label">{{ item.label }}</span>
            }
          </a>
        }
      </nav>
    </div>
  `,
  styles: [`
    .bottom-nav-container {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: var(--space-4);
      padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
      z-index: 1000;
      pointer-events: none;
    }

    .bottom-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 440px;
      margin: 0 auto;
      height: 64px;
      background: var(--color-bg-secondary);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid var(--color-border);
      border-radius: 32px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
      padding: 0 6px;
      pointer-events: auto;
    }

    .bottom-nav__item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      height: 48px;
      border-radius: 24px;
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      flex: 0 1 auto;
      min-width: 40px;
      justify-content: center;

      .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      &:active {
        transform: scale(0.92);
      }

      &.active {
        color: var(--color-violet-light);
        background: var(--color-bg-tertiary);
        border-color: var(--color-border);
        flex: 2 1 auto;
        box-shadow: var(--shadow-sm);
        padding: 8px 16px;
        
        .icon-wrapper {
          color: var(--color-violet);
          transform: scale(1.1);
        }
        
        .bottom-nav__label {
          opacity: 1;
          width: auto;
          font-weight: 700;
          color: var(--color-violet-light);
        }
      }
    }

    .bottom-nav__label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.01em;
      text-transform: uppercase;
      opacity: 0;
      width: 0;
      overflow: hidden;
      white-space: nowrap;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
  `],
})
export class BottomNavComponent {
  navItems = [
    { path: '/dashboard', icon: 'layout-dashboard', label: 'Home' },
    { path: '/transactions', icon: 'credit-card', label: 'Logs' },
    { path: '/analytics', icon: 'chart-line', label: 'Stats' },
    { path: '/budgets', icon: 'target', label: 'Budget' },
    { path: '/goals', icon: 'trophy', label: 'Goals' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
  ];
}
