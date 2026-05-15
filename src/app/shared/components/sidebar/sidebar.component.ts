import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LilyIconComponent } from '../../icons/lily-icon.component';
import { LilyStore } from '../../../core/store/lily.store';
@Component({
  selector: 'lily-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LilyIconComponent],
  template: `
    <nav class="sidebar" [class.collapsed]="collapsed()">
      <div class="sidebar__logo" routerLink="/">
        <div class="icon-zone">
          <div class="logo-wrapper">
            <img src="logo.png" alt="Lily Logo" class="sidebar__logo-image">
          </div>
        </div>
        @if (!collapsed()) { 
          <div class="logo-text-wrapper">
            <span class="sidebar__logo-text">Lily</span> 
          </div>
        }
      </div>
      
      <div class="sidebar__nav custom-scrollbar">
        @for (item of navItems; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active" class="sidebar__link" [title]="collapsed() ? item.label : ''">
            <div class="icon-zone">
              <div class="link-icon-wrapper">
                <lily-icon [name]="item.icon" [size]="20" class="sidebar__link-icon" />
                @if (collapsed() && item.path === '/dashboard') {
                  <span class="sidebar__dot"></span>
                }
              </div>
            </div>
            @if (!collapsed()) { 
              <span class="sidebar__link-label">{{ item.label }}</span> 
              @if (item.path === '/dashboard') {
                <span class="sidebar__badge">New</span>
              }
            }
          </a>
        }
      </div>

      <div class="sidebar__footer">
        <div class="sidebar__user" [title]="collapsed() ? 'Jane Doe (Premium)' : ''">
          <div class="icon-zone">
            <div class="user-avatar">JD</div>
          </div>
          @if (!collapsed()) {
            <div class="user-info">
              <span class="user-name">Jane Doe</span>
              <span class="user-plan">Premium Plan</span>
            </div>
          }
        </div>
        
        <button class="sidebar__toggle" (click)="toggle()" [title]="collapsed() ? 'Expand' : 'Collapse'">
          <div class="icon-zone">
            <div class="toggle-icon-wrapper">
              <lily-icon [name]="collapsed() ? 'chevron-right' : 'chevron-left'" [size]="16" />
            </div>
          </div>
          @if (!collapsed()) {
            <span class="toggle-text">Collapse Menu</span>
          }
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .sidebar {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--color-bg-secondary);
      border-right: 1px solid var(--color-border);
      padding: var(--space-6) 0;
      transition: width var(--duration-slow) var(--ease-out);
      position: relative;
      z-index: var(--z-sticky);
      
      &.collapsed {
        width: var(--sidebar-collapsed);
        
        .sidebar__logo, .sidebar__link, .sidebar__user, .sidebar__toggle {
          justify-content: center;
          padding: 0;
        }

        .sidebar__link:hover {
          transform: none;
        }
      }
    }

    .icon-zone {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .sidebar__logo {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 0 var(--space-4);
      margin-bottom: var(--space-10);
      cursor: pointer;
      
      .logo-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        border-radius: var(--radius-xl);
        overflow: hidden;
        transition: all var(--duration-normal) var(--ease-spring);
        
        .sidebar__logo-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .logo-text-wrapper {
        display: flex;
        flex-direction: column;
        line-height: 1;
      }

      .sidebar__logo-text {
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: -0.5px;
        color: var(--color-text-primary);
      }

      .sidebar__logo-tag {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--color-violet-light);
        opacity: 0.8;
      }

      &:hover .logo-wrapper {
        transform: rotate(-5deg) scale(1.05);
        filter: brightness(1.1);
      }
    }

    .sidebar__nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
      padding: 0 var(--space-2);
    }

    .sidebar__link {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 0 var(--space-2);
      height: 48px;
      border-radius: var(--radius-xl);
      color: var(--color-text-secondary);
      transition: all var(--duration-fast) var(--ease-out);
      text-decoration: none;
      font-size: var(--fs-base);
      font-weight: 600;
      position: relative;
      border: 1px solid transparent;
      
      .link-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        position: relative;
      }

      .sidebar__dot {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 6px;
        height: 6px;
        background: var(--color-violet);
        border-radius: var(--radius-full);
        box-shadow: 0 0 8px var(--color-violet);
      }

      &:hover {
        background: var(--color-bg-input);
        color: var(--color-text-primary);
        transform: translateX(4px);
        
        .sidebar__link-icon {
          color: var(--color-violet-light);
        }
      }

      &.active {
        background: var(--color-bg-tertiary);
        color: var(--color-violet-light);
        border-color: var(--color-border);
        box-shadow: var(--shadow-sm);
        
        &::before {
          content: '';
          position: absolute;
          left: -4px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 20px;
          background: var(--color-violet);
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 12px var(--color-violet);
        }

        .sidebar__link-icon {
          color: var(--color-violet);
          transform: scale(1.1);
        }
      }
    }

    .sidebar__badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: var(--color-violet-glow);
      color: var(--color-violet-light);
      border: 1px solid var(--color-violet-dark);
      margin-left: auto;
      margin-right: var(--space-2);
    }

    .sidebar__footer {
      padding: var(--space-4) 0;
      margin: var(--space-4) var(--space-3) 0;
      border-top: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .sidebar__user {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 0 var(--space-1);
      height: 56px;
      border-radius: var(--radius-xl);
      transition: all var(--duration-fast);
      
      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: var(--radius-lg);
        background: var(--gradient-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 800;
        color: white;
      }
      
      .user-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        
        .user-name {
          font-size: var(--fs-base);
          font-weight: 700;
          color: var(--color-text-primary);
          line-height: 1;
        }
        
        .user-plan {
          font-size: 10px;
          font-weight: 600;
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      }
    }

    .sidebar__toggle {
      width: 100%;
      height: 48px;
      border-radius: var(--radius-xl);
      color: var(--color-text-tertiary);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      background: transparent;
      border: 1px solid transparent;
      transition: all var(--duration-fast);
      padding: 0 var(--space-1);
      
      &:hover {
        background: var(--color-bg-input);
        color: var(--color-text-primary);
        border-color: var(--color-border);
      }
      
      .toggle-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
      }
      
      .toggle-text {
        font-size: var(--fs-sm);
        font-weight: 600;
      }
    }

    .custom-scrollbar {
      &::-webkit-scrollbar {
        width: 2px;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: var(--color-border);
        border-radius: var(--radius-full);
      }
    }
  `],
})
export class SidebarComponent {
  private store = inject(LilyStore);
  collapsed = this.store.sidebarCollapsed;

  toggle() {
    this.store.toggleSidebar();
  }

  navItems = [
    { path: '/dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
    { path: '/transactions', icon: 'credit-card', label: 'Transactions' },
    { path: '/analytics', icon: 'chart-line', label: 'Analytics' },
    { path: '/budgets', icon: 'target', label: 'Budgets' },
    { path: '/goals', icon: 'trophy', label: 'Goals' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
  ];
}
