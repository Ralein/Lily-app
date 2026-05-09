import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LilyStore } from '../../core/store/lily.store';
import { ExportService } from '../../core/services/export.service';
import { ToastService } from '../../core/services/toast.service';
import { Transaction, TransactionFilter } from '../../core/models/transaction.model';
import { CurrencyDisplayPipe } from '../../shared/pipes/currency-display.pipe';
import { RelativeDatePipe } from '../../shared/pipes/relative-date.pipe';
import { LilyIconComponent } from '../../shared/icons/lily-icon.component';
@Component({
  selector: 'lily-transactions',
  standalone: true,
  imports: [
    FormsModule, CurrencyDisplayPipe, RelativeDatePipe, LilyIconComponent,
  ],
  template: `
    <div class="transactions-page">
      <div class="page-header" anim="fadeIn">
        <div class="header-content">
          <h1 class="page-header__title">History</h1>
          <p class="page-header__subtitle">{{ filteredTxns().length }} transactions recorded</p>
        </div>
        <div class="header-actions">
          <div class="status-pill">
            <span class="status-pill__dot"></span>
            <span class="status-pill__text">Activity Verified</span>
          </div>
        </div>
      </div>

      <!-- Premium Glass Toolbar -->
      <div class="glass-toolbar" anim="slideUp">
        <div class="glass-toolbar__inner">
          <div class="search-field">
            <lily-icon name="search" [size]="18" class="icon" />
            <input type="text" 
                   placeholder="Search financial records..." 
                   [(ngModel)]="searchQuery" 
                   (ngModelChange)="onSearchChange()">
          </div>
          
          <div class="actions">
            <button class="tool-btn" 
                    [class.active]="showFilters()"
                    (click)="showFilters.set(!showFilters())">
              <lily-icon name="filter" [size]="18" />
              @if (activeFilterCount() > 0) {
                <span class="count-badge">{{ activeFilterCount() }}</span>
              }
            </button>
            <button class="tool-btn" (click)="exportCSV()" title="Export CSV">
              <lily-icon name="download" [size]="18" />
            </button>
          </div>
        </div>
      </div>

      <!-- Refined Filters Panel -->
      @if (showFilters()) {
        <div class="lily-card glass filter-panel" anim="slideUp">
          <div class="filter-panel__header">
            <h3 class="panel-title">Refine Results</h3>
            <button class="close-panel" (click)="showFilters.set(false)">
              <lily-icon name="x" [size]="16" />
            </button>
          </div>

          <div class="filter-panel__grid">
            <div class="filter-box">
              <label>Flow Type</label>
              <div class="glass-toggle">
                <button [class.active]="!filter().type" (click)="setFilterType(undefined)">All</button>
                <button [class.active]="filter().type === 'expense'" (click)="setFilterType('expense')">Outflow</button>
                <button [class.active]="filter().type === 'income'" (click)="setFilterType('income')">Inflow</button>
              </div>
            </div>

            <div class="filter-box">
              <label>Temporal Range</label>
              <div class="date-group">
                <input type="date" [ngModel]="filter().dateFrom" (ngModelChange)="updateFilter({dateFrom: $event})">
                <span class="sep">to</span>
                <input type="date" [ngModel]="filter().dateTo" (ngModelChange)="updateFilter({dateTo: $event})">
              </div>
            </div>

            <div class="filter-box">
              <label>Ordering</label>
              <div class="glass-select">
                <select [ngModel]="filter().sortBy" (ngModelChange)="updateFilter({sortBy: $event})">
                  <option value="date">Most Recent First</option>
                  <option value="amount">Highest Magnitude</option>
                  <option value="category">Category Index</option>
                </select>
                <lily-icon name="chevron-down" [size]="14" />
              </div>
            </div>
          </div>

          <div class="filter-panel__categories">
            <label>Category Filter</label>
            <div class="cat-scroller">
              @for (cat of store.categories(); track cat.id) {
                <button class="glass-pill" 
                        [class.active]="isCategorySelected(cat.id)" 
                        (click)="toggleCategory(cat.id)"
                        [style.--cat-color]="cat.color">
                  <lily-icon [name]="cat.icon" [size]="14" />
                  <span>{{ cat.name }}</span>
                </button>
              }
            </div>
          </div>

          <div class="filter-panel__footer">
            <button class="reset-btn" (click)="clearFilters()">Reset to Default</button>
          </div>
        </div>
      }

      <!-- Bulk Selection Overlay -->
      @if (selectedIds().size > 0) {
        <div class="selection-overlay" anim="slideUp">
          <div class="selection-card glass">
            <div class="selection-info">
              <span class="count-orb">{{ selectedIds().size }}</span>
              <span class="label">selected entries</span>
            </div>
            <div class="selection-actions">
              <button class="btn-delete-bulk" (click)="bulkDelete()">
                <lily-icon name="trash-2" [size]="16" />
                <span>Remove Selection</span>
              </button>
              <button class="btn-cancel-bulk" (click)="clearSelection()">Deselect All</button>
            </div>
          </div>
        </div>
      }

      <!-- High-End Transactions List -->
      <div class="transactions-list">
        @for (txn of filteredTxns(); track txn.id; let i = $index) {
          <div class="lily-card glass transaction-item" 
               [class.selected]="selectedIds().has(txn.id)"
               [class.editing]="editingId() === txn.id"
               anim="slideUp"
               [style.--anim-delay]="(i * 30) + 'ms'">
            
            <div class="transaction-item__main" (click)="toggleEdit(txn.id)">
              <div class="main-left">
                <div class="checkbox-wrapper" (click)="$event.stopPropagation()">
                  <input type="checkbox" 
                         [checked]="selectedIds().has(txn.id)" 
                         (change)="toggleSelect($event, txn.id)">
                </div>
                
                <div class="icon-orb" [style.background]="getCatColor(txn.categoryId) + '15'" [style.color]="getCatColor(txn.categoryId)">
                  <lily-icon [name]="getCatIcon(txn.categoryId)" [size]="20" />
                </div>
                
                <div class="info">
                  <div class="info-top">
                    <span class="category">{{ getCatName(txn.categoryId) }}</span>
                    <span class="method-tag">{{ txn.paymentMethod }}</span>
                  </div>
                  <div class="info-bottom">
                    <span class="note">{{ txn.note || 'Journal entry' }}</span>
                  </div>
                </div>
              </div>

              <div class="main-right">
                <div class="amount-wrap" [class.income]="txn.type === 'income'" [class.expense]="txn.type === 'expense'">
                  <span class="sign">{{ txn.type === 'income' ? '+' : '-' }}</span>
                  <span class="value">{{ txn.amount | currencyDisplay }}</span>
                </div>
                <div class="date-tag">{{ txn.date | relativeDate }}</div>
              </div>
            </div>

            @if (editingId() === txn.id) {
              <div class="edit-sheet" anim="slideDown">
                <div class="edit-sheet__grid">
                  <div class="input-field">
                    <label>Amount ({{ store.currencySymbol() }})</label>
                    <input type="number" [ngModel]="txn.amount" (ngModelChange)="editAmount = $event" placeholder="0.00">
                  </div>
                  <div class="input-field">
                    <label>Description</label>
                    <input type="text" [ngModel]="txn.note" (ngModelChange)="editNote = $event" placeholder="What was this for?">
                  </div>
                  <div class="input-field">
                    <label>Classification</label>
                    <div class="glass-select">
                      <select [ngModel]="txn.categoryId" (ngModelChange)="editCategory = $event">
                        @for (cat of store.categories(); track cat.id) {
                          <option [value]="cat.id">{{ cat.name }}</option>
                        }
                      </select>
                      <lily-icon name="chevron-down" [size]="14" />
                    </div>
                  </div>
                </div>
                <div class="edit-sheet__footer">
                  <button class="btn-save" (click)="saveEdit(txn)">Commit Changes</button>
                  <button class="btn-delete" (click)="store.deleteTransaction(txn.id); toast.success('Entry removed')">
                    <lily-icon name="trash-2" [size]="18" />
                  </button>
                  <button class="btn-close" (click)="editingId.set(null)">Discard</button>
                </div>
              </div>
            }
          </div>
        } @empty {
          <div class="empty-state" anim="fadeIn">
            <div class="empty-state__icon">
              <lily-icon name="receipt" [size]="48" />
            </div>
            <h3 class="empty-state__title">No activity found</h3>
            <p class="empty-state__text">Refine your search or clear filters to see more results.</p>
            <button class="btn-reset" (click)="clearFilters()">Clear All Filters</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .transactions-page { display: flex; flex-direction: column; gap: var(--space-8); padding-bottom: var(--space-20); }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-end;
      .page-header__title { font-size: 32px; font-weight: 900; letter-spacing: -0.04em; color: var(--color-text-primary); margin: 0; }
      .page-header__subtitle { font-size: var(--fs-base); color: var(--color-text-tertiary); font-weight: 500; }
      
      .status-pill {
        display: flex; align-items: center; gap: 10px; background: var(--color-bg-secondary); padding: 8px 16px; border-radius: var(--radius-full); border: 1px solid var(--color-border);
        &__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-violet); position: relative;
          &::after { content: ''; position: absolute; inset: -4px; border-radius: 50%; border: 2px solid var(--color-violet); opacity: 0.4; animation: ripple 2s infinite; }
        }
        &__text { font-size: 11px; font-weight: 800; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
      }
    }

    .glass-toolbar {
      position: sticky; top: var(--space-4); z-index: 100;
      background: rgba(255,255,255,0.03); backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 24px;
      padding: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.2), inset 0 0 20px rgba(255,255,255,0.05);
      
      &__inner { display: flex; align-items: center; gap: var(--space-4); padding: 0 var(--space-2); }
    }

    .search-field {
      flex: 1; display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-3);
      .icon { color: var(--color-text-tertiary); }
      input {
        flex: 1; height: 48px; background: transparent; border: none; outline: none;
        font-size: var(--fs-base); color: var(--color-text-primary); font-weight: 500;
        &::placeholder { color: var(--color-text-muted); }
      }
    }

    .actions { display: flex; gap: var(--space-2); }
    .tool-btn {
      width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
      color: var(--color-text-secondary); cursor: pointer; transition: all 0.3s;
      position: relative;
      &:hover { background: rgba(255,255,255,0.1); color: var(--color-text-primary); transform: translateY(-2px); }
      &.active { border-color: var(--color-violet); color: var(--color-violet-light); background: rgba(139, 92, 246, 0.1); }
      
      .count-badge {
        position: absolute; top: -4px; right: -4px; min-width: 20px; height: 20px; padding: 0 4px;
        background: var(--color-violet); color: white; border-radius: 50%;
        font-size: 10px; font-weight: 900; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 10px var(--color-violet-glow);
      }
    }

    .filter-panel {
      padding: var(--space-8); display: flex; flex-direction: column; gap: var(--space-8);
      &__header { display: flex; justify-content: space-between; align-items: center;
        .panel-title { font-size: var(--fs-lg); font-weight: 800; color: var(--color-text-primary); margin: 0; }
        .close-panel { background: transparent; border: none; color: var(--color-text-tertiary); cursor: pointer; padding: 8px; border-radius: 50%; transition: all 0.2s; &:hover { background: rgba(255,255,255,0.05); color: white; } }
      }
      &__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-8); }
      &__categories { display: flex; flex-direction: column; gap: var(--space-4); }
      &__footer { display: flex; justify-content: flex-end; padding-top: var(--space-6); border-top: 1px solid rgba(255,255,255,0.05); }
    }

    .filter-box {
      display: flex; flex-direction: column; gap: var(--space-4);
      label { font-size: 10px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 2px; }
    }

    .glass-toggle {
      display: flex; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 4px; border-radius: 14px;
      button {
        flex: 1; height: 36px; border: none; border-radius: 10px; background: transparent;
        font-size: 12px; font-weight: 700; color: var(--color-text-secondary); cursor: pointer; transition: all 0.2s;
        &.active { background: white; color: black; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
      }
    }

    .date-group {
      display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 4px 12px; border-radius: 14px;
      input { background: transparent; border: none; color: var(--color-text-primary); font-size: 12px; font-weight: 700; outline: none; padding: 10px 0; }
      .sep { color: var(--color-text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
    }

    .glass-select {
      position: relative; display: flex; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px;
      select { width: 100%; height: 48px; padding: 0 16px; background: transparent; border: none; color: var(--color-text-primary); font-size: 13px; font-weight: 700; appearance: none; outline: none; }
      svg { position: absolute; right: 16px; pointer-events: none; color: var(--color-text-tertiary); }
    }

    .cat-scroller { display: flex; flex-wrap: wrap; gap: 10px; }
    .glass-pill {
      display: flex; align-items: center; gap: 8px; padding: 8px 16px;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-full);
      font-size: 12px; font-weight: 700; color: var(--color-text-secondary); cursor: pointer; transition: all 0.3s;
      &.active { border-color: var(--cat-color); background: var(--cat-color) + '15'; color: white; transform: translateY(-2px); }
    }

    .reset-btn { background: transparent; border: none; font-size: 11px; font-weight: 900; color: var(--color-violet-light); cursor: pointer; text-transform: uppercase; letter-spacing: 1px; }

    .selection-overlay {
      position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); z-index: 1000; width: auto; min-width: 400px;
      .selection-card {
        padding: 12px 24px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: space-between; gap: 40px;
        background: linear-gradient(135deg, var(--color-violet) 0%, #7c3aed 100%); border: 1px solid rgba(255,255,255,0.2);
        box-shadow: 0 20px 40px rgba(139, 92, 246, 0.4); color: white;
      }
      .selection-info { display: flex; align-items: center; gap: 12px;
        .count-orb { width: 28px; height: 28px; background: white; color: var(--color-violet); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; }
        .label { font-size: 14px; font-weight: 700; }
      }
      .selection-actions { display: flex; align-items: center; gap: 16px;
        .btn-delete-bulk { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: var(--radius-full); font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s; &:hover { background: white; color: var(--color-rose); } }
        .btn-cancel-bulk { background: transparent; border: none; color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 700; cursor: pointer; &:hover { color: white; } }
      }
    }

    .transactions-list { display: flex; flex-direction: column; gap: var(--space-3); }

    .transaction-item {
      transition: all 0.4s var(--ease-spring); cursor: pointer; padding: 0; overflow: hidden;
      &:hover { transform: scale(1.01) translateY(-2px); background: rgba(255,255,255,0.05); }
      &.selected { border-color: var(--color-violet); background: rgba(139, 92, 246, 0.05); }
      &.editing { border-color: var(--color-violet); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }

      &__main { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; }
      
      .main-left { display: flex; align-items: center; gap: 20px; }
      .checkbox-wrapper { 
        display: flex; align-items: center; 
        input { width: 20px; height: 20px; accent-color: var(--color-violet); cursor: pointer; }
      }
      
      .icon-orb { width: 52px; height: 52px; border-radius: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      
      .info { display: flex; flex-direction: column; gap: 4px;
        .info-top { display: flex; align-items: center; gap: 12px;
          .category { font-size: 16px; font-weight: 800; color: var(--color-text-primary); }
          .method-tag { font-size: 10px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); }
        }
        .note { font-size: 13px; font-weight: 500; color: var(--color-text-tertiary); max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      }

      .main-right { text-align: right; 
        .amount-wrap { display: flex; align-items: center; justify-content: flex-end; gap: 2px; font-family: var(--font-mono); font-weight: 800; font-size: 18px; letter-spacing: -0.5px;
          &.income { color: var(--color-emerald); }
          &.expense { color: var(--color-text-primary); }
          .sign { font-size: 14px; opacity: 0.7; }
        }
        .date-tag { font-size: 10px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-top: 6px; letter-spacing: 0.5px; }
      }

      .edit-sheet {
        padding: 24px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.08);
        &__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }
        .input-field { display: flex; flex-direction: column; gap: 10px;
          label { font-size: 10px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 1.5px; }
          input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); height: 48px; border-radius: 12px; padding: 0 16px; color: var(--color-text-primary); font-size: 14px; outline: none; transition: border-color 0.2s; &:focus { border-color: var(--color-violet); } }
        }
        &__footer { display: flex; align-items: center; gap: 16px; margin-top: 32px;
          .btn-save { background: var(--color-violet); color: white; border: none; padding: 12px 32px; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; &:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3); } }
          .btn-delete { width: 48px; height: 48px; background: rgba(244, 63, 94, 0.1); color: var(--color-rose); border: 1px solid rgba(244, 63, 94, 0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; &:hover { background: var(--color-rose); color: white; } }
          .btn-close { margin-left: auto; background: transparent; border: none; color: var(--color-text-tertiary); font-size: 14px; font-weight: 700; cursor: pointer; &:hover { color: white; } }
        }
      }
    }

    .empty-state {
      padding: 100px 0; display: flex; flex-direction: column; align-items: center; text-align: center; color: var(--color-text-tertiary);
      &__icon { width: 96px; height: 96px; background: rgba(255,255,255,0.03); border-radius: 32px; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.05); }
      &__title { font-size: 24px; font-weight: 900; color: var(--color-text-primary); margin: 0 0 12px; }
      &__text { font-size: 16px; max-width: 320px; margin: 0 0 32px; line-height: 1.6; }
      .btn-reset { background: white; color: black; border: none; padding: 12px 32px; border-radius: var(--radius-full); font-weight: 900; font-size: 12px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s; &:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(255,255,255,0.2); } }
    }

    @keyframes ripple { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2.5); opacity: 0; } }

    @media (max-width: 768px) {
      .glass-toolbar { top: 8px; }
      .transaction-item__main { padding: 16px; }
      .icon-orb { width: 44px; height: 44px; border-radius: 14px; }
      .info .note { max-width: 140px; }
      .selection-overlay { width: calc(100% - 32px); min-width: unset; .selection-card { gap: 12px; padding: 10px 16px; } }
    }
  `],
})
export class TransactionsComponent {
  store = inject(LilyStore);
  private exportService = inject(ExportService);
  toast = inject(ToastService);

  searchQuery = '';
  showFilters = signal(false);
  filter = signal<TransactionFilter>({ sortBy: 'date', sortOrder: 'desc' });
  selectedIds = signal<Set<string>>(new Set());
  editingId = signal<string | null>(null);
  editAmount = 0; editNote = ''; editCategory = '';

  private searchTimeout: any;

  filteredTxns = computed(() => this.store.getFilteredTransactions(this.filter()));

  activeFilterCount = computed(() => {
    const f = this.filter();
    let count = 0;
    if (f.type) count++;
    if (f.dateFrom || f.dateTo) count++;
    if (f.categoryIds?.length) count++;
    if (f.searchQuery) count++;
    return count;
  });

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.updateFilter({ searchQuery: this.searchQuery });
    }, 300);
  }

  updateFilter(partial: Partial<TransactionFilter>): void {
    this.filter.update(f => ({ ...f, ...partial }));
  }

  setFilterType(type: 'expense' | 'income' | undefined): void { this.updateFilter({ type }); }

  toggleCategory(id: string): void {
    const current = this.filter().categoryIds || [];
    const updated = current.includes(id) ? current.filter(c => c !== id) : [...current, id];
    this.updateFilter({ categoryIds: updated.length > 0 ? updated : undefined });
  }

  isCategorySelected(id: string): boolean { return this.filter().categoryIds?.includes(id) ?? false; }

  clearFilters(): void { this.filter.set({ sortBy: 'date', sortOrder: 'desc' }); this.searchQuery = ''; }

  clearSelection(): void { this.selectedIds.set(new Set()); }

  toggleSelect(e: Event, id: string): void {
    e.stopPropagation();
    this.selectedIds.update(set => { const s = new Set(set); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  toggleEdit(id: string): void {
    this.editingId.set(this.editingId() === id ? null : id);
  }

  saveEdit(txn: Transaction): void {
    const updates: Partial<Transaction> = {};
    if (this.editAmount) updates.amount = this.editAmount;
    if (this.editNote) updates.note = this.editNote;
    if (this.editCategory) updates.categoryId = this.editCategory;
    this.store.updateTransaction(txn.id, updates);
    this.editingId.set(null);
    this.toast.success('Transaction updated');
  }

  bulkDelete(): void {
    this.store.deleteTransactions([...this.selectedIds()]);
    this.toast.success(`Deleted ${this.selectedIds().size} transactions`);
    this.selectedIds.set(new Set());
  }

  exportCSV(): void {
    this.exportService.exportCSV(this.filteredTxns());
    this.toast.success('CSV exported');
  }

  getCatIcon(id: string): string { return this.store.categoryMap().get(id)?.icon || 'package'; }
  getCatName(id: string): string { return this.store.categoryMap().get(id)?.name || 'Other'; }
  getCatColor(id: string): string { return this.store.categoryMap().get(id)?.color || '#64748b'; }
}
