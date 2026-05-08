import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LilyStore } from '../../../core/store/lily.store';

@Component({
  selector: 'lily-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar" [class.collapsed]="collapsed()">
      <div class="sidebar__logo">
        <span class="sidebar__logo-icon">🌸</span>
        @if (!collapsed()) { <span class="sidebar__logo-text">Lily</span> }
      </div>
      <div class="sidebar__nav">
        @for (item of navItems; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active" class="sidebar__link">
            <span class="sidebar__link-icon">{{ item.icon }}</span>
            @if (!collapsed()) { <span class="sidebar__link-label">{{ item.label }}</span> }
          </a>
        }
      </div>
      <div class="sidebar__footer">
        <button class="sidebar__toggle" (click)="collapsed.set(!collapsed())">
          {{ collapsed() ? '→' : '←' }}
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .sidebar {
      height: 100%; display: flex; flex-direction: column;
      background: var(--color-bg-secondary); border-right: 1px solid var(--color-border);
      padding: var(--space-6) var(--space-4); transition: width var(--duration-slow) var(--ease-out);
      &.collapsed { width: var(--sidebar-collapsed); }
    }
    .sidebar__logo {
      display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-2);
      margin-bottom: var(--space-8);
    }
    .sidebar__logo-icon { font-size: 1.75rem; }
    .sidebar__logo-text {
      font-size: var(--fs-2xl); font-weight: var(--fw-bold);
      background: var(--gradient-primary); -webkit-background-clip: text;
      -webkit-text-fill-color: transparent; background-clip: text;
    }
    .sidebar__nav { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); }
    .sidebar__link {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-3); border-radius: var(--radius-lg);
      color: var(--color-text-secondary); transition: all var(--duration-fast) var(--ease-out);
      text-decoration: none; font-size: var(--fs-base); font-weight: var(--fw-medium);
      &:hover { background: var(--color-bg-input); color: var(--color-text-primary); }
      &.active {
        background: var(--color-violet-glow); color: var(--color-violet-light);
        .sidebar__link-icon { transform: scale(1.1); }
      }
    }
    .sidebar__link-icon { font-size: 1.25rem; flex-shrink: 0; transition: transform var(--duration-fast) var(--ease-spring); }
    .sidebar__footer { padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .sidebar__toggle {
      width: 100%; padding: var(--space-2); border-radius: var(--radius-md);
      color: var(--color-text-tertiary); font-size: var(--fs-base);
      &:hover { background: var(--color-bg-input); color: var(--color-text-primary); }
    }
  `],
})
export class SidebarComponent {
  collapsed = signal(false);

  navItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/transactions', icon: '💳', label: 'Transactions' },
    { path: '/analytics', icon: '📈', label: 'Analytics' },
    { path: '/budgets', icon: '🎯', label: 'Budgets' },
    { path: '/goals', icon: '🏆', label: 'Goals' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];
}
