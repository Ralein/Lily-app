import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LilyIconComponent } from '../../icons/lily-icon.component';
import {
  LucideFlower2, LucideChevronLeft, LucideChevronRight,
} from '@lucide/angular';

@Component({
  selector: 'lily-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LilyIconComponent, LucideFlower2, LucideChevronLeft, LucideChevronRight],
  template: `
    <nav class="sidebar" [class.collapsed]="collapsed()">
      <div class="sidebar__logo">
        <svg lucideFlower2 [size]="28" class="sidebar__logo-icon"></svg>
        @if (!collapsed()) { <span class="sidebar__logo-text">Lily</span> }
      </div>
      <div class="sidebar__nav">
        @for (item of navItems; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active" class="sidebar__link">
            <lily-icon [name]="item.icon" [size]="20" class="sidebar__link-icon" />
            @if (!collapsed()) { <span class="sidebar__link-label">{{ item.label }}</span> }
          </a>
        }
      </div>
      <div class="sidebar__footer">
        <button class="sidebar__toggle" (click)="collapsed.set(!collapsed())">
          @if (collapsed()) { <svg lucideChevronRight [size]="18"></svg> }
          @else { <svg lucideChevronLeft [size]="18"></svg> }
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
      svg { color: var(--color-violet); }
    }
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
    .sidebar__link-icon { flex-shrink: 0; transition: transform var(--duration-fast) var(--ease-spring); }
    .sidebar__footer { padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .sidebar__toggle {
      width: 100%; padding: var(--space-2); border-radius: var(--radius-md);
      color: var(--color-text-tertiary); display: flex; align-items: center; justify-content: center;
      &:hover { background: var(--color-bg-input); color: var(--color-text-primary); }
    }
  `],
})
export class SidebarComponent {
  collapsed = signal(false);

  navItems = [
    { path: '/dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
    { path: '/transactions', icon: 'credit-card', label: 'Transactions' },
    { path: '/analytics', icon: 'chart-line', label: 'Analytics' },
    { path: '/budgets', icon: 'target', label: 'Budgets' },
    { path: '/goals', icon: 'trophy', label: 'Goals' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
  ];
}
