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
        @for (item of navItems; track item.path || item.label) {
          @if (item.action) {
            <button (click)="item.action()" class="bottom-nav__item">
              <div class="icon-wrapper">
                <lily-icon [name]="item.icon" [size]="20" class="bottom-nav__icon" />
              </div>
              <span class="bottom-nav__label">{{ item.label }}</span>
            </button>
          } @else {
            <a [routerLink]="item.path" routerLinkActive="active" class="bottom-nav__item">
              <div class="icon-wrapper">
                <lily-icon [name]="item.icon" [size]="20" class="bottom-nav__icon" />
                <div class="active-indicator"></div>
              </div>
              <span class="bottom-nav__label">{{ item.label }}</span>
            </a>
          }
        }
      </nav>
    </div>
  `,
  styles: [`
    .bottom-nav-container {
      padding: 0 var(--space-4) var(--space-4);
      padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
    }

    .bottom-nav {
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: var(--bottom-nav-height);
      background: var(--color-bg-card);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--color-bg-glass-border);
      border-radius: var(--radius-3xl);
      box-shadow: var(--shadow-glass);
      padding: 0 var(--space-2);
    }

    .bottom-nav__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      flex: 1;
      height: 100%;
      justify-content: center;
      color: var(--color-text-muted);
      text-decoration: none;
      transition: all var(--duration-fast) var(--ease-out);
      background: transparent;
      border: none;
      cursor: pointer;
      position: relative;

      .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: var(--radius-lg);
        position: relative;
        transition: all var(--duration-fast) var(--ease-spring);
      }

      .active-indicator {
        position: absolute;
        bottom: -6px;
        width: 4px;
        height: 4px;
        background: var(--color-violet);
        border-radius: var(--radius-full);
        opacity: 0;
        transform: scale(0);
        transition: all var(--duration-normal) var(--ease-spring);
        box-shadow: 0 0 10px var(--color-violet);
      }

      &:active {
        transform: scale(0.95);
      }

      &.active {
        color: var(--color-violet-light);
        
        .icon-wrapper {
          color: var(--color-violet);
          transform: translateY(-2px);
        }
        
        .active-indicator {
          opacity: 1;
          transform: scale(1);
        }
        
        .bottom-nav__label {
          color: var(--color-text-primary);
          font-weight: 700;
        }
      }
    }

    .bottom-nav__icon {
      transition: all var(--duration-fast) var(--ease-out);
    }

    .bottom-nav__label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
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
