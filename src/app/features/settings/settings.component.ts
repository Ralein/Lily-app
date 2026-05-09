import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LilyStore } from '../../core/store/lily.store';
import { ExportService } from '../../core/services/export.service';
import { DemoDataService } from '../../core/services/demo-data.service';
import { ToastService } from '../../core/services/toast.service';
import { CurrencyDisplayPipe } from '../../shared/pipes/currency-display.pipe';
import { CURRENCIES } from '../../core/models/settings.model';
import { IncomeSource } from '../../core/models/income.model';
import {
  LucidePalette, LucideCircleDollarSign, LucideDatabase,
  LucideFlower2, LucideDownload, LucideUpload,
  LucideTrash2, LucideTriangleAlert, LucideActivity,
  LucideWallet, LucidePlus, LucidePencil, LucideCheck, LucideX,
} from '@lucide/angular';

@Component({
  selector: 'lily-settings',
  standalone: true,
  imports: [
    FormsModule, CurrencyDisplayPipe,
    LucidePalette, LucideCircleDollarSign, LucideDatabase,
    LucideFlower2, LucideDownload, LucideUpload,
    LucideTrash2, LucideTriangleAlert, LucideActivity,
    LucideWallet, LucidePlus, LucidePencil, LucideCheck, LucideX,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-header__title">Settings</h1>
      <p class="page-header__subtitle">Customize your Lily experience</p>
    </div>

    <div class="settings-grid">
      <!-- Income Sources -->
      <div class="lily-card animate-fade-in-up settings-card--wide">
        <div class="lily-card__header">
          <h3 class="lily-card__title settings-title">
            <svg lucideWallet [size]="18" style="color: var(--color-emerald)"></svg> Income Sources
          </h3>
          <button class="btn btn--primary btn--sm" (click)="addNewSource()">
            <svg lucidePlus [size]="14"></svg> Add
          </button>
        </div>

        @if (store.incomeSources().length > 0) {
          <div class="income-list">
            @for (source of store.incomeSources(); track source.id) {
              <div class="income-row" [class.income-row--inactive]="!source.isActive">
                @if (editingSourceId() === source.id) {
                  <input class="income-row__name-input" type="text" [(ngModel)]="editName" placeholder="Source name" />
                  <div class="income-row__amount-wrap">
                    <span class="income-row__symbol">{{ store.currencySymbol() }}</span>
                    <input class="income-row__amount-input" type="number" [(ngModel)]="editAmount" min="0" />
                  </div>
                  <select class="income-row__freq-input" [(ngModel)]="editFrequency">
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="weekly">Weekly</option>
                    <option value="one-time">One-time</option>
                  </select>
                  <button class="btn btn--ghost btn--icon" (click)="saveEditSource(source.id)">
                    <svg lucideCheck [size]="14" style="color: var(--color-emerald)"></svg>
                  </button>
                  <button class="btn btn--ghost btn--icon" (click)="editingSourceId.set(null)">
                    <svg lucideX [size]="14"></svg>
                  </button>
                } @else {
                  <div class="income-row__info">
                    <span class="income-row__name">{{ source.name }}</span>
                    <span class="income-row__meta">{{ source.amount | currencyDisplay }} · {{ source.frequency }}</span>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" [checked]="source.isActive" (change)="toggleSource(source)" />
                    <span class="toggle__track"></span>
                  </label>
                  <button class="btn btn--ghost btn--icon" (click)="startEditSource(source)">
                    <svg lucidePencil [size]="14"></svg>
                  </button>
                  <button class="btn btn--ghost btn--icon" (click)="deleteSource(source.id)">
                    <svg lucideTrash2 [size]="14" style="color: var(--color-rose)"></svg>
                  </button>
                }
              </div>
            }
          </div>
          <div class="income-total">
            <span class="text-sm text-secondary">Total Monthly</span>
            <span class="text-lg font-bold font-mono text-income">{{ store.totalMonthlyIncome() | currencyDisplay }}</span>
          </div>
        } @else {
          <p class="text-sm text-tertiary" style="margin-top: var(--space-3)">No income sources configured. Add your salary or freelance income to get started.</p>
        }

        <!-- Auto-log toggle -->
        <div class="auto-log-row">
          <div>
            <span class="text-sm font-medium">Auto-log monthly income</span>
            <span class="text-xs text-tertiary" style="display: block; margin-top: 2px">Automatically create income transactions on the 1st of each month</span>
          </div>
          <label class="toggle">
            <input type="checkbox" [checked]="store.settings().autoLogIncome" (change)="toggleAutoLog()" />
            <span class="toggle__track"></span>
          </label>
        </div>
      </div>

      <!-- Theme -->
      <div class="lily-card animate-fade-in-up stagger-1">
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
      <div class="lily-card animate-fade-in-up stagger-2">
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
      <div class="lily-card animate-fade-in-up stagger-3">
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
            <svg lucideActivity [size]="14"></svg> Load Sample Data
          </button>
          <div class="divider"></div>
          <button class="btn btn--danger" (click)="confirmReset()">
            <svg lucideTrash2 [size]="14"></svg> Reset All Data
          </button>
        </div>
      </div>

      <!-- About -->
      <div class="lily-card animate-fade-in-up stagger-4">
        <h3 class="lily-card__title settings-title">
          <svg lucideFlower2 [size]="18" style="color: var(--color-violet)"></svg> About Lily
        </h3>
        <div class="about-info">
          <p class="text-sm text-secondary">Lily v1.0.0</p>
          <p class="text-sm text-tertiary">A premium personal finance tracker built with Angular, Chart.js, and GSAP.</p>
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
    .settings-card--wide { grid-column: 1 / -1; }
    .settings-title { display: flex; align-items: center; gap: var(--space-2); }

    // ── Income Sources ──
    .income-list { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-3); }
    .income-row {
      display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3);
      border-radius: var(--radius-md); background: var(--color-bg-input); transition: opacity var(--duration-fast);
      &--inactive { opacity: 0.5; }
      &__info { flex: 1; min-width: 0; }
      &__name { display: block; font-size: var(--fs-sm); font-weight: var(--fw-semibold); }
      &__meta { display: block; font-size: var(--fs-xs); color: var(--color-text-tertiary); margin-top: 2px; }
      &__name-input, &__amount-input, &__freq-input {
        padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
        border: 1px solid var(--color-border); background: var(--color-bg-secondary);
        color: var(--color-text-primary); font-size: var(--fs-sm);
        &:focus { border-color: var(--color-violet); outline: none; }
      }
      &__name-input { flex: 1; min-width: 120px; }
      &__amount-wrap { position: relative; display: flex; align-items: center; }
      &__symbol { position: absolute; left: 10px; color: var(--color-text-muted); font-size: var(--fs-sm); pointer-events: none; }
      &__amount-input { width: 110px; padding-left: var(--space-6) !important; }
      &__freq-input { width: 110px; cursor: pointer; }
    }
    .income-total {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
      background: var(--color-bg-secondary); margin-top: var(--space-3); border: 1px solid var(--color-border);
    }
    .auto-log-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-3) 0; margin-top: var(--space-3); border-top: 1px solid var(--color-border);
    }

    // ── Toggle ──
    .toggle { position: relative; display: inline-flex; cursor: pointer; }
    .toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
    .toggle__track {
      width: 40px; height: 22px; border-radius: var(--radius-full);
      background: var(--color-border); transition: background var(--duration-fast);
      position: relative;
      &::after {
        content: ''; position: absolute; top: 3px; left: 3px;
        width: 16px; height: 16px; border-radius: var(--radius-full);
        background: white; transition: transform var(--duration-fast);
      }
    }
    .toggle input:checked + .toggle__track {
      background: var(--color-violet);
      &::after { transform: translateX(18px); }
    }

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
    input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; }
    input[type="number"] { -moz-appearance: textfield; }
  `],
})
export class SettingsComponent {
  store = inject(LilyStore);
  private exportService = inject(ExportService);
  private demoData = inject(DemoDataService);
  private toast = inject(ToastService);

  currencies = CURRENCIES;
  showResetConfirm = signal(false);
  editingSourceId = signal<string | null>(null);

  // Edit state
  editName = '';
  editAmount = 0;
  editFrequency: IncomeSource['frequency'] = 'monthly';

  themes = [
    { value: 'dark' as const, label: 'Dark', bg: '#0a0e1a' },
    { value: 'light' as const, label: 'Light', bg: '#f8fafc' },
    { value: 'amoled' as const, label: 'AMOLED', bg: '#000000' },
  ];

  // ── Income Source CRUD ──
  addNewSource(): void {
    const source: IncomeSource = {
      id: crypto.randomUUID(),
      name: 'New Income',
      amount: 0,
      frequency: 'monthly',
      categoryId: 'salary',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.store.addIncomeSource(source);
    this.startEditSource(source);
    this.toast.info('Income source added — edit the details');
  }

  startEditSource(source: IncomeSource): void {
    this.editingSourceId.set(source.id);
    this.editName = source.name;
    this.editAmount = source.amount;
    this.editFrequency = source.frequency;
  }

  saveEditSource(id: string): void {
    if (!this.editName.trim()) { this.toast.warning('Enter a name'); return; }
    this.store.updateIncomeSource(id, {
      name: this.editName.trim(),
      amount: this.editAmount,
      frequency: this.editFrequency,
    });
    this.editingSourceId.set(null);
    this.toast.success('Income source updated');
  }

  toggleSource(source: IncomeSource): void {
    this.store.updateIncomeSource(source.id, { isActive: !source.isActive });
  }

  deleteSource(id: string): void {
    this.store.deleteIncomeSource(id);
    this.toast.success('Income source removed');
  }

  toggleAutoLog(): void {
    this.store.updateSettings({ autoLogIncome: !this.store.settings().autoLogIncome });
    this.toast.info(this.store.settings().autoLogIncome ? 'Auto-log enabled' : 'Auto-log disabled');
  }

  // ── Theme & Currency ──
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

  // ── Data ──
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
    this.toast.success('Sample data loaded!');
  }

  confirmReset(): void { this.showResetConfirm.set(true); }

  resetAll(): void {
    this.store.resetAll();
    this.showResetConfirm.set(false);
    this.toast.success('All data reset');
  }
}
