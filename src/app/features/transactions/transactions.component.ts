import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LilyStore } from '../../core/store/lily.store';
import { ExportService } from '../../core/services/export.service';
import { ToastService } from '../../core/services/toast.service';
import { Transaction, TransactionFilter } from '../../core/models/transaction.model';
import { CurrencyDisplayPipe } from '../../shared/pipes/currency-display.pipe';
import { RelativeDatePipe } from '../../shared/pipes/relative-date.pipe';
import { LilyIconComponent } from '../../shared/icons/lily-icon.component';
import {
  LucideSearch, LucideFilter, LucideDownload, LucideTrash2,
  LucideCheck, LucideReceipt,
} from '@lucide/angular';

@Component({
  selector: 'lily-transactions',
  standalone: true,
  imports: [
    FormsModule, CurrencyDisplayPipe, RelativeDatePipe, LilyIconComponent,
    LucideSearch, LucideFilter, LucideDownload, LucideTrash2,
    LucideCheck, LucideReceipt,
  ],
  template: `
    <div class="transactions-page">
      <div class="page-header animate-fade-in">
        <h1 class="page-header__title">History</h1>
        <div class="page-header__meta">
          <p class="page-header__subtitle">{{ filteredTxns().length }} transactions recorded</p>
          <div class="badge badge--soft">Verified Activity</div>
        </div>
      </div>

      <!-- Floating Glass Toolbar -->
      <div class="glass-toolbar animate-slide-up">
        <div class="glass-toolbar__inner">
          <div class="search-field">
            <svg lucideSearch [size]="18" class="icon"></svg>
            <input type="text" 
                   placeholder="Search activity..." 
                   [(ngModel)]="searchQuery" 
                   (ngModelChange)="onSearchChange()">
          </div>
          
          <div class="actions">
            <button class="tool-btn" 
                    [class.active]="showFilters()"
                    (click)="showFilters.set(!showFilters())">
              <svg lucideFilter [size]="18"></svg>
              @if (activeFilterCount() > 0) {
                <span class="count-badge">{{ activeFilterCount() }}</span>
              }
            </button>
            <button class="tool-btn" (click)="exportCSV()">
              <svg lucideDownload [size]="18"></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Enhanced Filters Panel -->
      @if (showFilters()) {
        <div class="lily-card lily-card--glass filter-panel animate-slide-up">
          <div class="filter-panel__grid">
            <div class="filter-box">
              <label>Transaction Type</label>
              <div class="glass-toggle">
                <button [class.active]="!filter().type" (click)="setFilterType(undefined)">All</button>
                <button [class.active]="filter().type === 'expense'" (click)="setFilterType('expense')">Expenses</button>
                <button [class.active]="filter().type === 'income'" (click)="setFilterType('income')">Income</button>
              </div>
            </div>

            <div class="filter-box">
              <label>Date Range</label>
              <div class="date-group">
                <input type="date" [ngModel]="filter().dateFrom" (ngModelChange)="updateFilter({dateFrom: $event})">
                <span class="sep">/</span>
                <input type="date" [ngModel]="filter().dateTo" (ngModelChange)="updateFilter({dateTo: $event})">
              </div>
            </div>

            <div class="filter-box">
              <label>Sort By</label>
              <div class="glass-select">
                <select [ngModel]="filter().sortBy" (ngModelChange)="updateFilter({sortBy: $event})">
                  <option value="date">Most Recent</option>
                  <option value="amount">Highest Amount</option>
                  <option value="category">Alphabetical</option>
                </select>
                <svg lucideChevronDown [size]="14"></svg>
              </div>
            </div>
          </div>

          <div class="filter-panel__categories">
            <label>Categories</label>
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
            <button class="reset-btn" (click)="clearFilters()">Clear All Filters</button>
          </div>
        </div>
      }

      <!-- Bulk Selection Bar -->
      @if (selectedIds().size > 0) {
        <div class="floating-selection animate-slide-up">
          <div class="selection-info">
            <span class="count">{{ selectedIds().size }}</span>
            <span class="label">Items Selected</span>
          </div>
          <div class="selection-actions">
            <button class="delete-btn" (click)="bulkDelete()">
              <svg lucideTrash2 [size]="16"></svg>
              <span>Delete</span>
            </button>
            <button class="cancel-btn" (click)="clearSelection()">Cancel</button>
          </div>
        </div>
      }

      <!-- Transactions List -->
      <div class="list-container">
        @for (txn of filteredTxns(); track txn.id; let i = $index) {
          <div class="premium-row animate-slide-up" 
               [class.selected]="selectedIds().has(txn.id)"
               [class.editing]="editingId() === txn.id"
               [style.animation-delay]="(i * 0.04) + 's'">
            
            <div class="premium-row__main" (click)="toggleEdit(txn.id)">
              <div class="left-side">
                <div class="selection-box" (click)="$event.stopPropagation()">
                  <input type="checkbox" 
                         [checked]="selectedIds().has(txn.id)" 
                         (change)="toggleSelect($event, txn.id)">
                </div>
                
                <div class="icon-sphere" [style.background]="getCatColor(txn.categoryId) + '15'">
                  <lily-icon [name]="getCatIcon(txn.categoryId)" [size]="20" [style.color]="getCatColor(txn.categoryId)" />
                </div>
                
                <div class="details">
                  <div class="top-row">
                    <span class="title">{{ getCatName(txn.categoryId) }}</span>
                    <span class="method">{{ txn.paymentMethod }}</span>
                  </div>
                  <div class="bottom-row">
                    <span class="note">{{ txn.note || 'No description' }}</span>
                  </div>
                </div>
              </div>

              <div class="right-side">
                <div class="amount-group" [class.income]="txn.type === 'income'" [class.expense]="txn.type === 'expense'">
                  <span class="symbol">{{ txn.type === 'income' ? '+' : '-' }}</span>
                  <span class="val">{{ txn.amount | currencyDisplay }}</span>
                </div>
                <div class="date">{{ txn.date | relativeDate }}</div>
              </div>
            </div>

            @if (editingId() === txn.id) {
              <div class="edit-drawer animate-slide-down">
                <div class="edit-drawer__grid">
                  <div class="field">
                    <label>Amount</label>
                    <input type="number" [ngModel]="txn.amount" (ngModelChange)="editAmount = $event">
                  </div>
                  <div class="field">
                    <label>Note</label>
                    <input type="text" [ngModel]="txn.note" (ngModelChange)="editNote = $event">
                  </div>
                  <div class="field">
                    <label>Category</label>
                    <div class="glass-select">
                      <select [ngModel]="txn.categoryId" (ngModelChange)="editCategory = $event">
                        @for (cat of store.categories(); track cat.id) {
                          <option [value]="cat.id">{{ cat.name }}</option>
                        }
                      </select>
                    </div>
                  </div>
                </div>
                <div class="edit-drawer__footer">
                  <button class="save-btn" (click)="saveEdit(txn)">Update Entry</button>
                  <button class="trash-btn" (click)="store.deleteTransaction(txn.id); toast.success('Deleted')">
                    <svg lucideTrash2 [size]="16"></svg>
                  </button>
                  <button class="close-btn" (click)="editingId.set(null)">Discard</button>
                </div>
              </div>
            }
          </div>
        } @empty {
          <div class="empty-view animate-fade-in">
            <div class="empty-view__icon">
              <svg lucideReceipt [size]="48"></svg>
            </div>
            <h3>No Records Found</h3>
            <p>We couldn't find any transactions matching your criteria.</p>
            <button class="reset-link" (click)="clearFilters()">Reset All Filters</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .transactions-page { display: flex; flex-direction: column; gap: var(--space-8); padding-bottom: var(--space-12); }

    .glass-toolbar {
      position: sticky; top: var(--space-4); z-index: 100;
      background: rgba(255,255,255,0.03); backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-3xl);
      padding: 6px; box-shadow: var(--shadow-glass);
      
      &__inner { display: flex; align-items: center; gap: var(--space-4); padding: 0 var(--space-2); }
    }

    .search-field {
      flex: 1; display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-3);
      .icon { color: var(--color-text-tertiary); }
      input {
        flex: 1; height: 44px; background: transparent; border: none; outline: none;
        font-size: var(--fs-base); color: var(--color-text-primary); font-weight: 500;
        &::placeholder { color: var(--color-text-muted); }
      }
    }

    .actions { display: flex; gap: var(--space-2); }
    .tool-btn {
      width: 44px; height: 44px; border-radius: var(--radius-2xl); display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
      color: var(--color-text-secondary); cursor: pointer; transition: all var(--duration-fast);
      position: relative;
      &:hover { background: rgba(255,255,255,0.1); color: var(--color-text-primary); }
      &.active { border-color: var(--color-violet); color: var(--color-violet-light); background: var(--color-violet-glow); }
      
      .count-badge {
        position: absolute; top: -2px; right: -2px; min-width: 18px; height: 18px; padding: 0 4px;
        background: var(--color-violet); color: white; border-radius: var(--radius-full);
        font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center;
      }
    }

    .filter-panel {
      display: flex; flex-direction: column; gap: var(--space-8); padding: var(--space-8);
      &__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-8); }
      &__categories { display: flex; flex-direction: column; gap: var(--space-4); }
      &__footer { display: flex; justify-content: flex-end; padding-top: var(--space-6); border-top: 1px solid rgba(255,255,255,0.05); }
    }

    .filter-box {
      display: flex; flex-direction: column; gap: var(--space-4);
      label { font-size: 10px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 2px; }
    }

    .glass-toggle {
      display: flex; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 4px; border-radius: var(--radius-2xl);
      button {
        flex: 1; height: 36px; border: none; border-radius: var(--radius-xl); background: transparent;
        font-size: var(--fs-xs); font-weight: 700; color: var(--color-text-secondary); cursor: pointer; transition: all var(--duration-fast);
        &.active { background: rgba(255,255,255,0.1); color: var(--color-text-primary); box-shadow: var(--shadow-sm); }
      }
    }

    .date-group {
      display: flex; align-items: center; gap: var(--space-3); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 4px 12px; border-radius: var(--radius-2xl);
      input { background: transparent; border: none; color: var(--color-text-primary); font-size: var(--fs-xs); font-weight: 600; outline: none; }
      .sep { color: var(--color-text-muted); font-size: 10px; }
    }

    .glass-select {
      position: relative; display: flex; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-2xl);
      select { width: 100%; height: 44px; padding: 0 var(--space-4); background: transparent; border: none; color: var(--color-text-primary); font-size: var(--fs-xs); font-weight: 600; appearance: none; outline: none; }
      svg { position: absolute; right: var(--space-4); pointer-events: none; color: var(--color-text-tertiary); }
    }

    .cat-scroller { display: flex; flex-wrap: wrap; gap: var(--space-3); }
    .glass-pill {
      display: flex; align-items: center; gap: 8px; padding: var(--space-2) var(--space-4);
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-full);
      font-size: var(--fs-xs); font-weight: 600; color: var(--color-text-secondary); cursor: pointer; transition: all var(--duration-fast);
      &.active { border-color: var(--cat-color); background: var(--cat-color) + '15'; color: var(--color-text-primary); box-shadow: var(--shadow-sm); }
    }

    .reset-btn { background: transparent; border: none; font-size: var(--fs-xs); font-weight: 800; color: var(--color-violet-light); cursor: pointer; text-transform: uppercase; letter-spacing: 1px; }

    .floating-selection {
      position: fixed; bottom: var(--space-8); left: 50%; transform: translateX(-50%); z-index: 1000;
      background: var(--color-violet); color: white; padding: var(--space-3) var(--space-6);
      border-radius: var(--radius-full); box-shadow: var(--shadow-glow-violet-intense);
      display: flex; align-items: center; gap: var(--space-8);
      
      .selection-info { display: flex; align-items: center; gap: var(--space-3);
        .count { width: 24px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; }
        .label { font-size: var(--fs-sm); font-weight: 700; }
      }
      .selection-actions { display: flex; align-items: center; gap: var(--space-4);
        .delete-btn { display: flex; align-items: center; gap: 6px; background: white; color: var(--color-rose); border: none; padding: 6px 16px; border-radius: var(--radius-full); font-size: var(--fs-xs); font-weight: 800; cursor: pointer; }
        .cancel-btn { background: transparent; border: none; color: white; font-size: var(--fs-xs); font-weight: 700; cursor: pointer; }
      }
    }

    .list-container { display: flex; flex-direction: column; gap: var(--space-3); }

    .premium-row {
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: var(--radius-3xl);
      transition: all var(--duration-normal) var(--ease-spring); overflow: hidden;
      
      &:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); transform: scale(1.01); }
      &.selected { border-color: var(--color-violet); background: var(--color-violet-glow); }
      &.editing { border-color: var(--color-violet); box-shadow: var(--shadow-glass); }

      &__main { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-6); cursor: pointer; }
      
      .left-side { display: flex; align-items: center; gap: var(--space-5); }
      .selection-box { 
        display: flex; align-items: center; 
        input { width: 18px; height: 18px; accent-color: var(--color-violet); border-radius: 4px; border: 2px solid rgba(255,255,255,0.2); background: transparent; cursor: pointer; }
      }
      
      .icon-sphere { width: 48px; height: 48px; border-radius: var(--radius-2xl); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      
      .details { display: flex; flex-direction: column; gap: 2px;
        .top-row { display: flex; align-items: center; gap: 10px;
          .title { font-size: var(--fs-base); font-weight: 700; color: var(--color-text-primary); }
          .method { font-size: 10px; font-weight: 800; color: var(--color-text-muted); text-transform: uppercase; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; }
        }
        .note { font-size: var(--fs-sm); color: var(--color-text-tertiary); max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      }

      .right-side { text-align: right; 
        .amount-group { display: flex; align-items: baseline; justify-content: flex-end; gap: 2px; font-family: var(--font-mono); font-weight: 800; font-size: var(--fs-base); letter-spacing: -0.5px;
          &.income { color: var(--color-emerald); }
          &.expense { color: var(--color-rose); }
        }
        .date { font-size: 10px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; margin-top: 4px; }
      }

      .edit-drawer {
        padding: var(--space-8); background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05);
        &__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-6); }
        .field { display: flex; flex-direction: column; gap: var(--space-2);
          label { font-size: 10px; font-weight: 800; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px; }
          input { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); height: 44px; border-radius: var(--radius-xl); padding: 0 var(--space-4); color: var(--color-text-primary); font-size: var(--fs-sm); outline: none; &:focus { border-color: var(--color-violet); } }
        }
        &__footer { display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-8);
          .save-btn { background: var(--color-violet); color: white; border: none; padding: 10px 24px; border-radius: var(--radius-xl); font-size: var(--fs-sm); font-weight: 700; cursor: pointer; }
          .trash-btn { width: 44px; height: 44px; background: var(--color-rose-glow); color: var(--color-rose); border: 1px solid var(--color-rose-glow); border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; cursor: pointer; }
          .close-btn { margin-left: auto; background: transparent; border: none; color: var(--color-text-tertiary); font-size: var(--fs-sm); font-weight: 600; cursor: pointer; }
        }
      }
    }

    .empty-view {
      padding: var(--space-20) 0; display: flex; flex-direction: column; align-items: center; text-align: center; color: var(--color-text-tertiary);
      &__icon { width: 80px; height: 80px; background: rgba(255,255,255,0.03); border-radius: var(--radius-4xl); display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); margin-bottom: var(--space-6); }
      h3 { font-size: var(--fs-xl); font-weight: 800; color: var(--color-text-primary); margin-bottom: var(--space-2); }
      p { font-size: var(--fs-base); max-width: 300px; margin-bottom: var(--space-8); }
      .reset-link { background: transparent; border: none; color: var(--color-violet-light); font-weight: 800; font-size: var(--fs-sm); cursor: pointer; text-transform: uppercase; }
    }

    @media (max-width: 768px) {
      .glass-toolbar { top: var(--space-2); }
      .premium-row__main { padding: var(--space-4); }
      .icon-sphere { width: 40px; height: 40px; }
      .details .note { max-width: 140px; }
      .floating-selection { width: calc(100% - 32px); justify-content: space-between; gap: 0; }
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
