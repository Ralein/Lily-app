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
    <div class="settings-page">
      <div class="page-header animate-fade-in">
        <h1 class="page-header__title">Settings</h1>
        <p class="page-header__subtitle">Manage your profile and application preferences</p>
      </div>

      <div class="settings-layout">
        <!-- Main Configuration Area -->
        <div class="settings-main">
          <!-- Income Sources Section -->
          <div class="lily-card section-card animate-slide-up">
            <div class="section-header">
              <div class="section-title">
                <div class="section-icon emerald"><svg lucideWallet [size]="18"></svg></div>
                <div class="section-text">
                  <h3>Income Streams</h3>
                  <span>Recurring and one-time inflows</span>
                </div>
              </div>
              <button class="btn btn--primary btn--sm" (click)="addNewSource()">
                <svg lucidePlus [size]="14"></svg> New Stream
              </button>
            </div>

            <div class="income-manager">
              @if (store.incomeSources().length > 0) {
                <div class="income-list">
                  @for (source of store.incomeSources(); track source.id) {
                    <div class="income-item" [class.editing]="editingSourceId() === source.id" [class.inactive]="!source.isActive">
                      @if (editingSourceId() === source.id) {
                        <div class="income-edit-form">
                          <input class="input input--sm" type="text" [(ngModel)]="editName" placeholder="Name" />
                          <div class="input-wrap">
                            <span class="symbol">{{ store.currencySymbol() }}</span>
                            <input class="input input--sm" type="number" [(ngModel)]="editAmount" />
                          </div>
                          <select class="input input--sm" [(ngModel)]="editFrequency">
                            <option value="monthly">Monthly</option>
                            <option value="biweekly">Bi-weekly</option>
                            <option value="weekly">Weekly</option>
                            <option value="one-time">One-time</option>
                          </select>
                          <div class="edit-actions">
                            <button class="btn btn--primary btn--icon btn--sm" (click)="saveEditSource(source.id)"><svg lucideCheck [size]="14"></svg></button>
                            <button class="btn btn--ghost btn--icon btn--sm" (click)="editingSourceId.set(null)"><svg lucideX [size]="14"></svg></button>
                          </div>
                        </div>
                      } @else {
                        <div class="income-info">
                          <div class="income-primary">
                            <span class="name">{{ source.name }}</span>
                            <span class="amount">{{ source.amount | currencyDisplay }}</span>
                          </div>
                          <div class="income-secondary">
                            <span class="freq">{{ source.frequency }}</span>
                            <span class="status" [class.active]="source.isActive">{{ source.isActive ? 'Active' : 'Paused' }}</span>
                          </div>
                        </div>
                        <div class="income-actions">
                          <label class="toggle-switch">
                            <input type="checkbox" [checked]="source.isActive" (change)="toggleSource(source)" />
                            <span class="slider"></span>
                          </label>
                          <button class="btn btn--secondary btn--icon btn--sm" (click)="startEditSource(source)"><svg lucidePencil [size]="14"></svg></button>
                          <button class="btn btn--secondary btn--icon btn--sm" (click)="deleteSource(source.id)"><svg lucideTrash2 [size]="14"></svg></button>
                        </div>
                      }
                    </div>
                  }
                </div>
                <div class="income-footer">
                  <span class="label">Total Monthly Estim.</span>
                  <span class="value">{{ store.totalMonthlyIncome() | currencyDisplay }}</span>
                </div>
              } @else {
                <div class="empty-section">
                  <p>No income streams defined. Start by adding your salary or dividends.</p>
                </div>
              }

              <div class="settings-row mt-6">
                <div class="row-info">
                  <span class="row-label">Auto-log Income</span>
                  <span class="row-desc">Automatically post transactions on the 1st of each month</span>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" [checked]="store.settings().autoLogIncome" (change)="toggleAutoLog()" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- Preferences Section -->
          <div class="lily-card section-card animate-slide-up" style="animation-delay: 0.1s">
            <div class="section-header">
              <div class="section-title">
                <div class="section-icon violet"><svg lucidePalette [size]="18"></svg></div>
                <div class="section-text">
                  <h3>Preferences</h3>
                  <span>Appearance and localization</span>
                </div>
              </div>
            </div>

            <div class="preferences-form">
              <div class="settings-row vertical">
                <span class="row-label">Display Theme</span>
                <div class="theme-grid">
                  @for (theme of themes; track theme.value) {
                    <button class="theme-card" [class.active]="store.settings().theme === theme.value" (click)="setTheme(theme.value)">
                      <div class="theme-preview" [style.background]="theme.bg">
                        <div class="preview-accent" [style.background]="theme.value === 'light' ? '#8b5cf6' : '#c084fc'"></div>
                      </div>
                      <span class="theme-label">{{ theme.label }}</span>
                    </button>
                  }
                </div>
              </div>

              <div class="settings-row mt-4">
                <div class="row-info">
                  <span class="row-label">Primary Currency</span>
                  <span class="row-desc">Applied to all amounts across the app</span>
                </div>
                <select class="input select-input" [ngModel]="store.settings().currency.code" (ngModelChange)="setCurrency($event)">
                  @for (cur of currencies; track cur.code) {
                    <option [value]="cur.code">{{ cur.symbol }} {{ cur.code }} ({{ cur.name }})</option>
                  }
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Actions -->
        <div class="settings-side">
          <!-- Data Control -->
          <div class="lily-card side-card animate-slide-up" style="animation-delay: 0.2s">
            <h3 class="side-title"><svg lucideDatabase [size]="16"></svg> Data Control</h3>
            <div class="side-actions">
              <button class="btn btn--secondary btn--full" (click)="exportJSON()">
                <svg lucideDownload [size]="14"></svg> Export JSON
              </button>
              <label class="btn btn--secondary btn--full cursor-pointer" for="import-file">
                <svg lucideUpload [size]="14"></svg> Import Backup
                <input type="file" id="import-file" accept=".json" (change)="importJSON($event)" style="display: none">
              </label>
              <button class="btn btn--secondary btn--full" (click)="loadDemoData()">
                <svg lucideActivity [size]="14"></svg> Load Demo
              </button>
              <div class="danger-zone">
                <button class="btn btn--danger btn--full" (click)="confirmReset()">
                  <svg lucideTrash2 [size]="14"></svg> Factory Reset
                </button>
              </div>
            </div>
          </div>

          <!-- Application Info -->
          <div class="lily-card side-card animate-slide-up" style="animation-delay: 0.3s">
            <h3 class="side-title"><svg lucideFlower2 [size]="16"></svg> Lily Finance</h3>
            <div class="app-info">
              <div class="info-row"><span>Version</span> <span class="val">1.2.0</span></div>
              <div class="info-row"><span>Records</span> <span class="val">{{ store.transactions().length }}</span></div>
              <div class="info-row"><span>Goals</span> <span class="val">{{ store.goals().length }}</span></div>
            </div>
            <p class="app-desc">Lily is a secure, local-first finance companion. Your data stays in your browser.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset Modal -->
    @if (showResetConfirm()) {
      <div class="overlay" (click)="showResetConfirm.set(false)">
        <div class="lily-card modal-card animate-slide-up" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-icon"><svg lucideTriangleAlert [size]="24"></svg></div>
            <h3 class="modal-title">Purge All Data?</h3>
          </div>
          <p class="modal-desc">This action will permanently remove all your transactions, budgets, goals, and settings. This cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn btn--danger" (click)="resetAll()">Delete Everything</button>
            <button class="btn btn--ghost" (click)="showResetConfirm.set(false)">Cancel</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .settings-page { display: flex; flex-direction: column; gap: var(--space-6); padding-bottom: var(--space-12); }
    .settings-layout { display: grid; grid-template-columns: 1fr 300px; gap: var(--space-6); }

    .section-card { padding: 0; overflow: hidden; }
    .section-header { 
      padding: var(--space-6); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; 
      .section-title { display: flex; align-items: center; gap: var(--space-4); }
      .section-icon { 
        width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--color-bg-input); 
        &.emerald { color: var(--color-emerald); background: rgba(16, 185, 129, 0.1); }
        &.violet { color: var(--color-violet); background: rgba(139, 92, 246, 0.1); }
      }
      h3 { font-size: var(--fs-lg); font-weight: 800; color: var(--color-text-primary); margin: 0; }
      span { font-size: var(--fs-xs); color: var(--color-text-tertiary); font-weight: 600; text-transform: uppercase; }
    }

    .income-manager { 
      padding: var(--space-6); 
      .income-list { display: flex; flex-direction: column; gap: var(--space-2); }
    }

    .income-item {
      padding: var(--space-4); background: var(--color-bg-input); border-radius: var(--radius-xl); border: 1px solid transparent; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s;
      &:hover { border-color: var(--color-border-hover); background: var(--color-bg-secondary); }
      &.editing { border-color: var(--color-violet); background: var(--color-bg-secondary); }
      &.inactive { opacity: 0.6; }
      
      .income-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
      .income-primary { display: flex; align-items: center; gap: var(--space-3); }
      .name { font-weight: 700; color: var(--color-text-primary); }
      .amount { font-family: var(--font-mono); font-weight: 700; color: var(--color-text-secondary); font-size: var(--fs-sm); }
      .income-secondary { display: flex; align-items: center; gap: var(--space-3); font-size: 11px; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; }
      .status.active { color: var(--color-emerald); }
      
      .income-actions { display: flex; align-items: center; gap: var(--space-2); }
      .income-edit-form { flex: 1; display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: var(--space-2); align-items: center; }
      .input-wrap { position: relative; display: flex; align-items: center; .symbol { position: absolute; left: 8px; font-size: 11px; font-weight: 800; color: var(--color-text-tertiary); pointer-events: none; } input { padding-left: 20px; } }
      .edit-actions { display: flex; gap: 4px; }
    }

    .income-footer { margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; .label { font-size: 11px; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; } .value { font-size: var(--fs-lg); font-weight: 800; color: var(--color-emerald); } }

    .preferences-form { padding: var(--space-6); }
    .settings-row { 
      display: flex; justify-content: space-between; align-items: center; 
      &.vertical { flex-direction: column; align-items: flex-start; gap: var(--space-4); }
      .row-info { display: flex; flex-direction: column; gap: 2px; }
      .row-label { font-weight: 700; color: var(--color-text-primary); }
      .row-desc { font-size: var(--fs-xs); color: var(--color-text-tertiary); }
      .select-input { width: 220px; }
    }

    .theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); width: 100%; }
    .theme-card {
      background: var(--color-bg-input); border: 2px solid var(--color-border); border-radius: var(--radius-xl); padding: var(--space-4); cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
      &:hover { border-color: var(--color-border-hover); }
      &.active { border-color: var(--color-violet); background: var(--color-violet-glow); }
      .theme-preview { width: 100%; height: 60px; border-radius: 8px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
      .preview-accent { position: absolute; bottom: 8px; right: 8px; width: 16px; height: 16px; border-radius: 4px; }
      .theme-label { font-size: var(--fs-sm); font-weight: 700; color: var(--color-text-secondary); }
    }

    .side-card { 
      padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-4);
      .side-title { font-size: var(--fs-base); font-weight: 800; color: var(--color-text-primary); display: flex; align-items: center; gap: var(--space-2); margin: 0; }
      .side-actions { display: flex; flex-direction: column; gap: var(--space-2); }
      .danger-zone { margin-top: var(--space-2); padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    }

    .app-info { display: flex; flex-direction: column; gap: var(--space-2); .info-row { display: flex; justify-content: space-between; font-size: var(--fs-sm); font-weight: 600; color: var(--color-text-tertiary); .val { color: var(--color-text-primary); font-weight: 700; } } }
    .app-desc { font-size: 11px; color: var(--color-text-tertiary); line-height: 1.5; margin: 0; }

    .toggle-switch {
      position: relative; width: 44px; height: 24px;
      input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; cursor: pointer; inset: 0; background-color: var(--color-border); border-radius: 34px; transition: .4s; &:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: .4s; } }
      input:checked + .slider { background-color: var(--color-violet); &:before { transform: translateX(20px); } }
    }

    .overlay { position: fixed; inset: 0; background: var(--color-bg-overlay); z-index: var(--z-modal); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); }
    .modal-card { 
      max-width: 400px; width: 90%; padding: var(--space-8); display: flex; flex-direction: column; gap: var(--space-6); text-align: center;
      .modal-icon { width: 64px; height: 64px; border-radius: 50%; background: rgba(244, 63, 94, 0.1); color: var(--color-rose); display: flex; align-items: center; justify-content: center; margin: 0 auto; }
      .modal-title { font-size: var(--fs-xl); font-weight: 800; color: var(--color-text-primary); margin: 0; }
      .modal-desc { font-size: var(--fs-base); color: var(--color-text-secondary); line-height: 1.6; margin: 0; }
      .modal-actions { display: flex; flex-direction: column; gap: var(--space-2); }
    }

    @media (max-width: 900px) {
      .settings-layout { grid-template-columns: 1fr; }
      .settings-side { order: -1; display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    }
    @media (max-width: 640px) {
      .settings-side { grid-template-columns: 1fr; }
      .income-edit-form { grid-template-columns: 1fr 1fr; }
      .edit-actions { grid-column: span 2; justify-content: flex-end; }
    }
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
