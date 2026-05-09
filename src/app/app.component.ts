import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { CommandPaletteComponent } from './shared/components/command-palette/command-palette.component';
import { LilyStore } from './core/store/lily.store';

@Component({
  selector: 'lily-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, BottomNavComponent, ToastContainerComponent, CommandPaletteComponent],
  template: `
    <lily-command-palette />
    <lily-toast-container />
    @if (showShell()) {
      <div class="app-shell">
        <aside class="app-sidebar">
          <lily-sidebar />
        </aside>
        <main class="app-main">
          <div class="content-container">
            <router-outlet />
          </div>
        </main>
        <div class="app-bottom-nav">
          <lily-bottom-nav />
        </div>
      </div>
    } @else {
      <router-outlet />
    }
  `,
  styleUrl: './app.component.scss',
})
export class App {
  private store = inject(LilyStore);
  private router = inject(Router);

  showShell = computed(() => this.store.onboardingComplete());
}
