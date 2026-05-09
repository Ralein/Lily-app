import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LilyStore } from '../../core/store/lily.store';
import { ExportService } from '../../core/services/export.service';
import { DemoDataService } from '../../core/services/demo-data.service';
import { ToastService } from '../../core/services/toast.service';
import { CurrencyDisplayPipe } from '../../shared/pipes/currency-display.pipe';
import { CURRENCIES } from '../../core/models/settings.model';
import { IncomeSource } from '../../core/models/income.model';
import { LilyIconComponent } from '../../shared/icons/lily-icon.component';

@Component({
  selector: 'lily-settings',
  standalone: true,
  imports: [
    FormsModule, CurrencyDisplayPipe, LilyIconComponent
  ],
  template: `
    <div class="settings-page">
      <div class="page-header" anim="fadeIn">
        <div class="header-content">
          <h1 class="page-header__title">Control Center</h1>
          <p class="page-header__subtitle">Configure your financial workspace and preferences</p>
        </div>
        <div class="header-actions">
          <div class="status-pill security">
            <lily-icon name="shield-check" [size]="14" />
            <span class="status-pill__text">Vault Encrypted</span>
          </div>
        </div>
      </div>

      <div class="settings-layout">
        <!-- Main Configuration Area -->
        <div class="settings-main">
          
          <!-- Income Streams Section -->
          <div class="lily-card glass section-card" anim="slideUp">
            <div class="section-header">
              <div class="section-title">
                <div class="icon-orb emerald">
                  <lily-icon name="wallet" [size]="20" />
                </div>
                <div class="section-text">
                  <h3>Income Streams</h3>
                  <p>Manage your recurring revenue and cash inflows</p>
                </div>
              </div>
              <button class="glass-btn primary" (click)="addNewSource()">
                <lily-icon name="plus" [size]="16" />
                <span>Add Stream</span>
              </button>
            </div>

            <div class="income-manager">
              @if (store.incomeSources().length > 0) {
                <div class="income-grid">
                  @for (source of store.incomeSources(); track source.id; let i = $index) {
                    <div class="income-card glass" 
                         [class.editing]="editingSourceId() === source.id" 
                         [class.inactive]="!source.isActive"
                         anim="slideUp"
                         [style.--anim-delay]="(i * 40) + 'ms'">
                      
                      @if (editingSourceId() === source.id) {
                        <div class="edit-mode" anim="fadeIn">
                          <div class="edit-inputs">
                            <div class="field">
                              <label>Source Name</label>
                              <input type="text" [(ngModel)]="editName" placeholder="e.g. Salary">
                            </div>
                            <div class="field">
                              <label>Amount ({{ store.currencySymbol() }})</label>
                              <input type="number" [(ngModel)]="editAmount">
                            </div>
                            <div class="field">
                              <label>Interval</label>
                              <div class="glass-select">
                                <select [(ngModel)]="editFrequency">
                                  <option value="monthly">Monthly</option>
                                  <option value="biweekly">Bi-weekly</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="one-time">One-time</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <div class="edit-actions">
                            <button class="commit-btn" (click)="saveEditSource(source.id)">
                              <lily-icon name="check" [size]="16" />
                            </button>
                            <button class="cancel-btn" (click)="editingSourceId.set(null)">
                              <lily-icon name="x" [size]="16" />
                            </button>
                          </div>
                        </div>
                      } @else {
                        <div class="view-mode">
                          <div class="source-info">
                            <div class="top">
                              <span class="name">{{ source.name }}</span>
                              <span class="status-tag" [class.active]="source.isActive">
                                {{ source.isActive ? 'Active' : 'Paused' }}
                              </span>
                            </div>
                            <div class="amount-wrap">
                              <span class="val">{{ source.amount | currencyDisplay }}</span>
                              <span class="freq">/ {{ source.frequency }}</span>
                            </div>
                          </div>
                          
                          <div class="source-controls">
                            <button class="icon-btn edit" (click)="startEditSource(source)" title="Edit Source">
                            <lily-icon name="pencil" [size]="14" />
                            </button>
                            <button class="icon-btn delete" (click)="deleteSource(source.id)" title="Delete Source">
                            <lily-icon name="trash-2" [size]="14" />
                            </button>
                            <div class="toggle-wrap">
                              <label class="premium-toggle">
                                <input type="checkbox" [checked]="source.isActive" (change)="toggleSource(source)" />
                                <span class="slider"></span>
                              </label>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
                
                <div class="income-summary glass">
                  <div class="summary-item">
                    <span class="label">Projected Monthly Volume</span>
                    <span class="value">{{ store.totalMonthlyIncome() | currencyDisplay }}</span>
                  </div>
                  <div class="summary-toggle">
                    <div class="text">
                      <span class="label">Auto-log Engine</span>
                      <p>Post entries automatically on the 1st</p>
                    </div>
                    <label class="premium-toggle">
                      <input type="checkbox" [checked]="store.settings().autoLogIncome" (change)="toggleAutoLog()" />
                      <span class="slider"></span>
                    </label>
                  </div>
                </div>
              } @else {
                <div class="empty-list" anim="fadeIn">
                  <div class="empty-icon"><lily-icon name="activity" [size]="32" /></div>
                  <p>No revenue streams detected. Initialize your first inflow to begin projections.</p>
                </div>
              }
            </div>
          </div>

          <!-- Preferences Section -->
          <div class="lily-card glass section-card" anim="slideUp" style="--anim-delay: 100ms">
            <div class="section-header">
              <div class="section-title">
                <div class="icon-orb violet">
                  <lily-icon name="palette" [size]="20" />
                </div>
                <div class="section-text">
                  <h3>Preferences</h3>
                  <p>Interface aesthetics and localization settings</p>
                </div>
              </div>
            </div>

            <div class="preferences-content">
              <div class="preference-group">
                <label class="group-label">Visual Interface</label>
                <div class="theme-selector">
                  @for (theme of themes; track theme.value) {
                    <button class="theme-option glass" 
                            [class.active]="store.settings().theme === theme.value" 
                            (click)="setTheme(theme.value)">
                      <div class="preview" [style.background]="theme.bg">
                        <div class="glow" [style.background]="theme.accent"></div>
                      </div>
                      <span class="label">{{ theme.label }}</span>
                      @if (store.settings().theme === theme.value) {
                        <div class="active-check"><lily-icon name="check" [size]="12" /></div>
                      }
                    </button>
                  }
                </div>
              </div>

              <div class="preference-group">
                <div class="horizontal-setting glass">
                  <div class="setting-info">
                    <div class="icon"><lily-icon name="globe" [size]="18" /></div>
                    <div class="text">
                      <span class="label">Regional Currency</span>
                      <p>Primary unit for all valuations</p>
                    </div>
                  </div>
                  <div class="setting-action">
                    <div class="glass-select">
                      <select [ngModel]="store.settings().currency.code" (ngModelChange)="setCurrency($event)">
                        @for (cur of currencies; track cur.code) {
                          <option [value]="cur.code">{{ cur.symbol }} {{ cur.code }} - {{ cur.name }}</option>
                        }
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Actions -->
        <div class="settings-side">
          <!-- System Intelligence -->
          <div class="lily-card glass side-card" anim="slideUp" style="--anim-delay: 200ms">
            <div class="side-header">
              <lily-icon name="cpu" [size]="18" />
              <span>System Metadata</span>
            </div>
            <div class="system-stats">
              <div class="stat-row">
                <span class="key">Architecture</span>
                <span class="val">Local-First</span>
              </div>
              <div class="stat-row">
                <span class="key">Version</span>
                <span class="val">1.2.4</span>
              </div>
              <div class="stat-row">
                <span class="key">Data Points</span>
                <span class="val">{{ store.transactions().length }}</span>
              </div>
            </div>
            <p class="system-note">Lily stores all data locally in your browser's persistent storage. No data ever leaves your device.</p>
          </div>

          <!-- Maintenance Controls -->
          <div class="lily-card glass side-card" anim="slideUp" style="--anim-delay: 300ms">
            <div class="side-header">
              <lily-icon name="database" [size]="18" />
              <span>Data Operations</span>
            </div>
            <div class="action-stack">
              <button class="side-btn glass" (click)="exportJSON()">
                <lily-icon name="download" [size]="16" />
                <span>Export Vault</span>
              </button>
              <label class="side-btn glass clickable" for="import-file">
                <lily-icon name="upload" [size]="16" />
                <span>Restore Backup</span>
                <input type="file" id="import-file" accept=".json" (change)="importJSON($event)" style="display: none">
              </label>
              <button class="side-btn glass" (click)="loadDemoData()">
                <lily-icon name="activity" [size]="16" />
                <span>Simulate Activity</span>
              </button>
              <div class="danger-zone">
                <button class="side-btn danger" (click)="confirmReset()">
                  <lily-icon name="trash-2" [size]="16" />
                  <span>Purge Intelligence</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Security Override Modal (Reset) -->
    @if (showResetConfirm()) {
      <div class="overlay" (click)="showResetConfirm.set(false)" anim="fadeIn">
        <div class="lily-card glass modal-card" (click)="$event.stopPropagation()" anim="slideUp">
          <div class="modal-header">
            <div class="modal-icon"><lily-icon name="triangle-alert" [size]="32" /></div>
            <h3 class="modal-title">Confirm Data Purge</h3>
          </div>
          <p class="modal-desc">This operation will permanently eliminate all financial records, goals, and customized logic. This state transition is irreversible.</p>
          <div class="modal-actions">
            <button class="btn-purge" (click)="resetAll()">Eliminate All Records</button>
            <button class="btn-abort" (click)="showResetConfirm.set(false)">Abort Operation</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .settings-page { display: flex; flex-direction: column; gap: var(--space-8); padding-bottom: var(--space-20); }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-end;
      .page-header__title { font-size: 32px; font-weight: 900; letter-spacing: -0.04em; color: var(--color-text-primary); margin: 0; }
      .page-header__subtitle { font-size: var(--fs-base); color: var(--color-text-tertiary); font-weight: 500; }
      
      .status-pill {
        display: flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.1); padding: 8px 16px; border-radius: var(--radius-full); border: 1px solid rgba(16, 185, 129, 0.2);
        color: var(--color-emerald); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
        &.security { background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.2); color: var(--color-violet-light); }
      }
    }

    .settings-layout { display: grid; grid-template-columns: 1fr 320px; gap: var(--space-8); }

    .section-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; gap: 0; margin-bottom: var(--space-8); }

    .section-header { 
      padding: var(--space-6) var(--space-8); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; 
      .section-title { display: flex; align-items: center; gap: var(--space-4); }
      .icon-orb { 
        width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center;
        &.emerald { color: var(--color-emerald); background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.1); }
        &.violet { color: var(--color-violet); background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.1); }
      }
      .section-text {
        h3 { font-size: 18px; font-weight: 800; color: var(--color-text-primary); margin: 0; }
        p { font-size: 13px; color: var(--color-text-tertiary); margin: 4px 0 0; }
      }
    }

    .glass-btn {
      display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05); color: var(--color-text-primary); font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.3s;
      &:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
      &.primary { background: var(--color-violet); border: none; color: white; box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3); }
    }

    .income-manager { padding: var(--space-8); }
    .income-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-4); }

    .income-card {
      padding: 20px; transition: all 0.3s;
      &.editing { border-color: var(--color-violet); background: rgba(139, 92, 246, 0.05); }
      &.inactive { opacity: 0.5; filter: grayscale(0.5); }
      
      .view-mode { display: flex; justify-content: space-between; align-items: flex-start; }
      .source-info { display: flex; flex-direction: column; gap: 12px;
        .top { display: flex; align-items: center; gap: 10px;
          .name { font-size: 16px; font-weight: 800; color: var(--color-text-primary); }
          .status-tag { font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; background: rgba(255,255,255,0.05); color: var(--color-text-tertiary);
            &.active { background: rgba(16, 185, 129, 0.1); color: var(--color-emerald); }
          }
        }
        .amount-wrap { display: flex; align-items: baseline; gap: 6px;
          .val { font-size: 20px; font-weight: 900; font-family: var(--font-mono); color: var(--color-text-primary); }
          .freq { font-size: 11px; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; }
        }
      }
      
      .source-controls { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
      .icon-btn { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); color: var(--color-text-tertiary); cursor: pointer; transition: all 0.2s;
        &:hover { color: white; background: rgba(255,255,255,0.1); }
        &.delete:hover { color: var(--color-rose); background: rgba(244, 63, 94, 0.1); }
      }

      .edit-mode { display: flex; flex-direction: column; gap: 20px;
        .edit-inputs { display: flex; flex-direction: column; gap: 12px;
          .field { display: flex; flex-direction: column; gap: 6px;
            label { font-size: 10px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 1px; }
            input { height: 40px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0 12px; color: white; font-size: 14px; outline: none; &:focus { border-color: var(--color-violet); } }
          }
        }
        .edit-actions { display: flex; gap: 10px;
          button { flex: 1; height: 40px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
          .commit-btn { background: var(--color-violet); color: white; }
          .cancel-btn { background: rgba(255,255,255,0.1); color: var(--color-text-tertiary); }
        }
      }
    }

    .income-summary {
      margin-top: var(--space-8); padding: 24px; display: flex; justify-content: space-between; align-items: center;
      .summary-item { display: flex; flex-direction: column; gap: 4px;
        .label { font-size: 11px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 1px; }
        .value { font-size: 28px; font-weight: 900; color: var(--color-emerald); font-family: var(--font-mono); }
      }
      .summary-toggle { display: flex; align-items: center; gap: 24px;
        .text { text-align: right;
          .label { font-size: 13px; font-weight: 800; color: var(--color-text-primary); }
          p { font-size: 11px; color: var(--color-text-tertiary); margin: 2px 0 0; }
        }
      }
    }

    .preferences-content { padding: var(--space-8); display: flex; flex-direction: column; gap: 32px; }
    .preference-group { display: flex; flex-direction: column; gap: 16px;
      .group-label { font-size: 12px; font-weight: 900; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 2px; }
    }

    .theme-selector { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    .theme-option {
      position: relative; padding: 12px; border-radius: 16px; transition: all 0.3s; cursor: pointer; text-align: left;
      &:hover { transform: translateY(-4px); background: rgba(255,255,255,0.05); }
      &.active { border-color: var(--color-violet); background: rgba(139, 92, 246, 0.05); }
      
      .preview { width: 100%; height: 80px; border-radius: 10px; position: relative; overflow: hidden; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.05);
        .glow { position: absolute; bottom: -20px; right: -20px; width: 60px; height: 60px; filter: blur(30px); opacity: 0.6; }
      }
      .label { font-size: 14px; font-weight: 800; color: var(--color-text-primary); }
      .active-check { position: absolute; top: 8px; right: 8px; width: 20px; height: 20px; background: var(--color-violet); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(139, 92, 246, 0.4); }
    }

    .horizontal-setting {
      padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-radius: 20px;
      .setting-info { display: flex; align-items: center; gap: 16px;
        .icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: var(--color-text-secondary); }
        .text {
          .label { font-size: 15px; font-weight: 800; color: var(--color-text-primary); }
          p { font-size: 12px; color: var(--color-text-tertiary); margin: 2px 0 0; }
        }
      }
    }

    .glass-select {
      position: relative; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden;
      select { background: transparent; border: none; color: white; font-size: 13px; font-weight: 700; height: 40px; padding: 0 32px 0 16px; outline: none; appearance: none; }
      &::after { content: '↓'; position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 10px; color: var(--color-text-tertiary); pointer-events: none; }
    }

    .side-card { padding: 24px; display: flex; flex-direction: column; gap: 20px; margin-bottom: var(--space-4); }
    .side-header { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 900; color: var(--color-text-primary); text-transform: uppercase; letter-spacing: 1px; }

    .system-stats { display: flex; flex-direction: column; gap: 10px;
      .stat-row { display: flex; justify-content: space-between; font-size: 13px;
        .key { color: var(--color-text-tertiary); font-weight: 600; }
        .val { color: var(--color-text-primary); font-weight: 800; font-family: var(--font-mono); }
      }
    }
    .system-note { font-size: 11px; color: var(--color-text-muted); line-height: 1.6; margin: 0; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); }

    .action-stack { display: flex; flex-direction: column; gap: 10px; }
    .side-btn {
      width: 100%; height: 44px; border-radius: 12px; display: flex; align-items: center; gap: 12px; padding: 0 16px;
      font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.1);
      &.glass { background: rgba(255,255,255,0.05); color: var(--color-text-secondary); &:hover { background: rgba(255,255,255,0.1); color: white; transform: translateX(4px); } }
      &.danger { background: rgba(244, 63, 94, 0.05); color: var(--color-rose); border-color: rgba(244, 63, 94, 0.1); &:hover { background: var(--color-rose); color: white; transform: scale(1.02); } }
      &.clickable { cursor: pointer; }
    }

    .premium-toggle {
      position: relative; width: 44px; height: 24px;
      input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; cursor: pointer; inset: 0; background-color: rgba(255,255,255,0.1); border-radius: 34px; transition: .4s; &:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: .4s; } }
      input:checked + .slider { background-color: var(--color-violet); &:before { transform: translateX(20px); } }
    }

    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(12px); }
    .modal-card { 
      max-width: 440px; padding: 40px; text-align: center;
      .modal-icon { width: 80px; height: 80px; border-radius: 30px; background: rgba(244, 63, 94, 0.1); color: var(--color-rose); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
      .modal-title { font-size: 24px; font-weight: 900; color: var(--color-text-primary); margin: 0 0 16px; }
      .modal-desc { font-size: 16px; color: var(--color-text-tertiary); line-height: 1.6; margin: 0 0 40px; }
      .modal-actions { display: flex; flex-direction: column; gap: 12px;
        button { height: 52px; border-radius: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
        .btn-purge { background: var(--color-rose); color: white; border: none; &:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(244, 63, 94, 0.3); } }
        .btn-abort { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--color-text-tertiary); &:hover { color: white; background: rgba(255,255,255,0.05); } }
      }
    }

    @media (max-width: 900px) {
      .settings-layout { grid-template-columns: 1fr; }
      .settings-side { order: 1; display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    }
    @media (max-width: 640px) {
      .settings-side { grid-template-columns: 1fr; }
      .income-grid { grid-template-columns: 1fr; }
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

  editName = '';
  editAmount = 0;
  editFrequency: IncomeSource['frequency'] = 'monthly';

  themes = [
    { value: 'dark' as const, label: 'Obsidian', bg: '#0f172a', accent: '#8b5cf6', accentName: 'Violet' },
    { value: 'light' as const, label: 'Pure', bg: '#f8fafc', accent: '#6366f1', accentName: 'Indigo' },
    { value: 'amoled' as const, label: 'Deep', bg: '#000000', accent: '#d946ef', accentName: 'Fuchsia' },
  ];

  addNewSource(): void {
    const source: IncomeSource = {
      id: crypto.randomUUID(),
      name: 'New Revenue',
      amount: 0,
      frequency: 'monthly',
      categoryId: 'salary',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.store.addIncomeSource(source);
    this.startEditSource(source);
    this.toast.info('New stream initialized');
  }

  startEditSource(source: IncomeSource): void {
    this.editingSourceId.set(source.id);
    this.editName = source.name;
    this.editAmount = source.amount;
    this.editFrequency = source.frequency;
  }

  saveEditSource(id: string): void {
    if (!this.editName.trim()) { this.toast.warning('Identity required for source'); return; }
    this.store.updateIncomeSource(id, {
      name: this.editName.trim(),
      amount: this.editAmount,
      frequency: this.editFrequency,
    });
    this.editingSourceId.set(null);
    this.toast.success('Source parameters updated');
  }

  toggleSource(source: IncomeSource): void {
    this.store.updateIncomeSource(source.id, { isActive: !source.isActive });
  }

  deleteSource(id: string): void {
    this.store.deleteIncomeSource(id);
    this.toast.success('Source purged');
  }

  toggleAutoLog(): void {
    this.store.updateSettings({ autoLogIncome: !this.store.settings().autoLogIncome });
    this.toast.info(this.store.settings().autoLogIncome ? 'Autonomous logging active' : 'Manual logging required');
  }

  setTheme(theme: 'dark' | 'light' | 'amoled'): void {
    this.store.updateSettings({ theme });
    this.toast.success(`Theme transitioned to ${theme}`);
  }

  setCurrency(code: string): void {
    const cur = CURRENCIES.find(c => c.code === code);
    if (cur) {
      this.store.updateSettings({ currency: cur });
      this.toast.success(`Currency synchronized to ${cur.code}`);
    }
  }

  exportJSON(): void {
    this.exportService.exportJSON();
    this.toast.success('Vault backup generated');
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
    this.toast.success('Activity simulation complete');
  }

  confirmReset(): void { this.showResetConfirm.set(true); }

  resetAll(): void {
    this.store.resetAll();
    this.showResetConfirm.set(false);
    this.toast.success('Global purge complete');
  }
}
