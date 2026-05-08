import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'lily-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      @for (item of navItems; track item.path) {
        <a [routerLink]="item.path" routerLinkActive="active" class="bottom-nav__item">
          <span class="bottom-nav__icon">{{ item.icon }}</span>
          <span class="bottom-nav__label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    .bottom-nav {
      display: flex; align-items: center; justify-content: space-around;
      height: 100%; padding: 0 var(--space-2);
    }
    .bottom-nav__item {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: var(--space-1) var(--space-2); border-radius: var(--radius-lg);
      color: var(--color-text-tertiary); text-decoration: none;
      transition: all var(--duration-fast) var(--ease-out); min-width: 56px;
      &:hover, &.active { color: var(--color-violet-light); }
      &.active .bottom-nav__icon { transform: scale(1.15); }
    }
    .bottom-nav__icon { font-size: 1.25rem; transition: transform var(--duration-fast) var(--ease-spring); }
    .bottom-nav__label { font-size: 0.625rem; font-weight: var(--fw-medium); }
  `],
})
export class BottomNavComponent {
  navItems = [
    { path: '/dashboard', icon: '📊', label: 'Home' },
    { path: '/transactions', icon: '💳', label: 'Txns' },
    { path: '/analytics', icon: '📈', label: 'Stats' },
    { path: '/budgets', icon: '🎯', label: 'Budget' },
    { path: '/goals', icon: '🏆', label: 'Goals' },
  ];
}
