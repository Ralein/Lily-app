import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LilyStore } from '../../core/store/lily.store';
import { ExportService } from '../../core/services/export.service';
import { DemoDataService } from '../../core/services/demo-data.service';
import { ToastService } from '../../core/services/toast.service';
import { CURRENCIES } from '../../core/models/settings.model';
import {
  LucidePalette, LucideCircleDollarSign, LucideDatabase,
  LucideFlower2, LucideDownload, LucideUpload,
  LucideTrash2, LucideTriangleAlert, LucideActivity,
} from '@lucide/angular';

@Component({
  selector: 'lily-settings',
  standalone: true,
  imports: [
    FormsModule,
    LucidePalette, LucideCircleDollarSign, LucideDatabase,
    LucideFlower2, LucideDownload, LucideUpload,
    LucideTrash2, LucideTriangleAlert, LucideActivity,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-header__title">Settings</h1>
      <p class="page-header__subtitle">Customize your Lily experience</p>
    </div>

    <div class="settings-grid">
      <!-- Theme -->
      <div class="lily-card animate-fade-in-up">
        <h3 class="lily-card__title settings-title">
          <svg lucidePalette [size]="18"></svg> Theme
        </h3>
        <div class="theme-options">
          @for (theme of themes; track theme.value) {
            <button class="theme-option" [class.active]="store.settings().theme === theme.value" (click)="setTheme(theme.value)">
              <div class="theme-option__preview" [style.background]="theme.bg"></div>
              <span class="text-sm font-medium">{{ theme.label }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Currency -->
      <div class="lily-card animate-fade-in-up stagger-1">
        <h3 class="lily-card__title settings-title">
          <svg lucideCircleDollarSign [size]="18"></svg> Currency
        </h3>
        <select class="select" [ngModel]="store.settings().currency.code" (ngModelChange)="setCurrency($event)">
          @for (cur of currencies; track cur.code) {
            <option [value]="cur.code">{{ cur.symbol }} {{ cur.code }} — {{ cur.name }}</option>
          }
        </select>
      </div>

      <!-- Data Management -->
      <div class="lily-card animate-fade-in-up stagger-2">
        <h3 class="lily-card__title settings-title">
          <svg lucideDatabase [size]="18"></svg> Data
        </h3>
        <div class="flex flex-col gap-3">
          <button class="btn btn--secondary" (click)="exportJSON()">
            <svg lucideDownload [size]="14"></svg> Export Backup (JSON)
          </button>
          <div class="file-upload">
            <label class="btn btn--secondary" for="import-file">
              <svg lucideUpload [size]="14"></svg> Import Backup
            </label>
            <input type="file" id="import-file" accept=".json" (change)="importJSON($event)" style="display: none">
          </div>
          <button class="btn btn--secondary" (click)="loadDemoData()">
            <svg lucideActivity [size]="14"></svg> Load Demo Data
          </button>
          <div class="divider"></div>
          <button class="btn btn--danger" (click)="confirmReset()">
            <svg lucideTrash2 [size]="14"></svg> Reset All Data
          </button>
        </div>
      </div>

      <!-- About -->
      <div class="lily-card animate-fade-in-up stagger-3">
        <h3 class="lily-card__title settings-title">
          <svg lucideFlower2 [size]="18" style="color: var(--color-violet)"></svg> About Lily
        </h3>
        <div class="about-info">
          <p class="text-sm text-secondary">Lily v1.0.0</p>
          <p class="text-sm text-tertiary">A premium personal finance tracker built with Angular 20, Chart.js, and GSAP.</p>
          <p class="text-sm text-tertiary" style="margin-top: var(--space-3)">
            {{ store.transactions().length }} transactions · {{ store.categories().length }} categories · {{ store.goals().length }} goals
          </p>
        </div>
      </div>
    </div>

    <!-- Reset Confirm Dialog -->
    @if (showResetConfirm()) {
      <div class="drawer-overlay" (click)="showResetConfirm.set(false)"></div>
      <div class="modal animate-fade-in-up">
        <h3 class="modal-title">
          <svg lucideTriangleAlert [size]="20" style="color: var(--color-amber)"></svg> Reset All Data?
        </h3>
        <p class="text-sm text-secondary" style="margin-bottom: var(--space-4)">This will permanently delete all transactions, budgets, goals, and settings. This cannot be undone.</p>
        <div class="flex gap-2">
          <button class="btn btn--danger" (click)="resetAll()">Yes, Delete Everything</button>
          <button class="btn btn--ghost" (click)="showResetConfirm.set(false)">Cancel</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .settings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-4); }
    .settings-title { display: flex; align-items: center; gap: var(--space-2); }
    .theme-options { display: flex; gap: var(--space-3); flex-wrap: wrap; margin-top: var(--space-3); }
    .theme-option {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-3);
      border-radius: var(--radius-lg); border: 2px solid var(--color-border); cursor: pointer; transition: all var(--duration-fast); min-width: 80px;
      &:hover { border-color: var(--color-border-hover); }
      &.active { border-color: var(--color-violet); background: var(--color-violet-glow); }
    }
    .theme-option__preview { width: 40px; height: 40px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.1); }
    .divider { height: 1px; background: var(--color-border); margin: var(--space-2) 0; }
    .about-info { display: flex; flex-direction: column; gap: var(--space-1); margin-top: var(--space-2); }
    .modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: calc(var(--z-drawer) + 1);
      background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: var(--radius-2xl);
      padding: var(--space-6); max-width: 420px; width: 90%;
    }
    .modal-title { display: flex; align-items: center; gap: var(--space-2); font-size: var(--fs-lg); font-weight: var(--fw-bold); margin-bottom: var(--space-3); }
    .drawer-overlay { position: fixed; inset: 0; background: var(--color-bg-overlay); z-index: var(--z-drawer); }
  `],
})
export class SettingsComponent {
  store = inject(LilyStore);
  private exportService = inject(ExportService);
  private demoData = inject(DemoDataService);
  private toast = inject(ToastService);

  currencies = CURRENCIES;
  showResetConfirm = signal(false);

  themes = [
    { value: 'dark' as const, label: 'Dark', bg: '#0a0e1a' },
    { value: 'light' as const, label: 'Light', bg: '#f8fafc' },
    { value: 'amoled' as const, label: 'AMOLED', bg: '#000000' },
  ];

  setTheme(theme: 'dark' | 'light' | 'amoled'): void {
    this.store.updateSettings({ theme });
    this.toast.success(`Theme set to ${theme}`);
  }

  setCurrency(code: string): void {
    const cur = CURRENCIES.find(c => c.code === code);
    if (cur) {
      this.store.updateSettings({ currency: cur });
      this.toast.success(`Currency set to ${cur.symbol} ${cur.code}`);
    }
  }

  exportJSON(): void {
    this.exportService.exportJSON();
    this.toast.success('Backup exported');
  }

  importJSON(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = this.exportService.importJSON(reader.result as string);
      result.success ? this.toast.success(result.message) : this.toast.error(result.message);
    };
    reader.readAsText(file);
  }

  loadDemoData(): void {
    this.demoData.generateDemoData();
    this.toast.success('Demo data loaded!');
  }

  confirmReset(): void { this.showResetConfirm.set(true); }

  resetAll(): void {
    this.store.resetAll();
    this.showResetConfirm.set(false);
    this.toast.success('All data reset');
  }
}
