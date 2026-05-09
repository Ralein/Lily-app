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
    <div class="page-header">
      <h1 class="page-header__title">Transactions</h1>
      <p class="page-header__subtitle">{{ filteredTxns().length }} transactions</p>
    </div>

    <!-- Search & Actions Bar -->
    <div class="txn-toolbar">
      <div class="txn-search">
        <svg lucideSearch [size]="16" class="txn-search__icon"></svg>
        <input type="text" class="txn-search__input" placeholder="Search transactions..." [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange()">
      </div>
      <div class="txn-actions">
        <button class="btn btn--secondary btn--sm" (click)="showFilters.set(!showFilters())">
          <svg lucideFilter [size]="14"></svg> Filters {{ activeFilterCount() > 0 ? '(' + activeFilterCount() + ')' : '' }}
        </button>
        <button class="btn btn--secondary btn--sm" (click)="exportCSV()">
          <svg lucideDownload [size]="14"></svg> Export
        </button>
      </div>
    </div>

    <!-- Filters Panel -->
    @if (showFilters()) {
      <div class="lily-card filter-panel animate-fade-in-up">
        <div class="filter-grid">
          <div class="filter-group">
            <label class="filter-label">Type</label>
            <div class="type-toggle" style="padding: 2px">
              <button class="pill" [class.active]="!filter().type" (click)="setFilterType(undefined)">All</button>
              <button class="pill" [class.active]="filter().type === 'expense'" (click)="setFilterType('expense')">Expense</button>
              <button class="pill" [class.active]="filter().type === 'income'" (click)="setFilterType('income')">Income</button>
            </div>
          </div>
          <div class="filter-group">
            <label class="filter-label">Date Range</label>
            <div class="flex gap-2">
              <input type="date" class="input" [ngModel]="filter().dateFrom" (ngModelChange)="updateFilter({dateFrom: $event})">
              <input type="date" class="input" [ngModel]="filter().dateTo" (ngModelChange)="updateFilter({dateTo: $event})">
            </div>
          </div>
          <div class="filter-group">
            <label class="filter-label">Sort By</label>
            <select class="select" [ngModel]="filter().sortBy" (ngModelChange)="updateFilter({sortBy: $event})">
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="category">Category</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Categories</label>
            <div class="flex flex-wrap gap-2">
              @for (cat of store.categories(); track cat.id) {
                <button class="pill" [class.active]="isCategorySelected(cat.id)" (click)="toggleCategory(cat.id)">
                  <lily-icon [name]="cat.icon" [size]="14" /> {{ cat.name }}
                </button>
              }
            </div>
          </div>
        </div>
        <button class="btn btn--ghost btn--sm" (click)="clearFilters()" style="margin-top: var(--space-3)">Clear Filters</button>
      </div>
    }

    <!-- Bulk Actions -->
    @if (selectedIds().size > 0) {
      <div class="bulk-bar animate-slide-up">
        <span>{{ selectedIds().size }} selected</span>
        <button class="btn btn--danger btn--sm" (click)="bulkDelete()">
          <svg lucideTrash2 [size]="14"></svg> Delete
        </button>
        <button class="btn btn--secondary btn--sm" (click)="clearSelection()">Cancel</button>
      </div>
    }

    <!-- Transaction List -->
    <div class="txn-list-container">
      @for (txn of filteredTxns(); track txn.id; let i = $index) {
        <div class="txn-card" [class.txn-card--selected]="selectedIds().has(txn.id)" [class.txn-card--editing]="editingId() === txn.id">
          <div class="txn-card__main" (click)="toggleEdit(txn.id)">
            <input type="checkbox" class="txn-card__check" [checked]="selectedIds().has(txn.id)" (click)="toggleSelect($event, txn.id)" (change)="$event.stopPropagation()">
            <div class="txn-card__icon" [style.background]="getCatColor(txn.categoryId) + '22'" [style.color]="getCatColor(txn.categoryId)">
              <lily-icon [name]="getCatIcon(txn.categoryId)" [size]="18" />
            </div>
            <div class="txn-card__info">
              <span class="txn-card__category">{{ getCatName(txn.categoryId) }}</span>
              <span class="txn-card__note">{{ txn.note || '—' }} · {{ txn.paymentMethod }}</span>
            </div>
            <div class="txn-card__right">
              <span class="txn-card__amount" [class.text-income]="txn.type === 'income'" [class.text-expense]="txn.type === 'expense'">
                {{ txn.type === 'income' ? '+' : '-' }}{{ txn.amount | currencyDisplay }}
              </span>
              <span class="txn-card__date">{{ txn.date | relativeDate }}</span>
            </div>
          </div>

          <!-- Inline Edit -->
          @if (editingId() === txn.id) {
            <div class="txn-card__edit animate-fade-in-up">
              <div class="flex gap-3 flex-wrap">
                <input type="number" class="input" style="max-width: 140px" [ngModel]="txn.amount" (ngModelChange)="editAmount = $event" placeholder="Amount">
                <input type="text" class="input" style="flex: 1" [ngModel]="txn.note" (ngModelChange)="editNote = $event" placeholder="Note">
                <select class="select" style="max-width: 160px" [ngModel]="txn.categoryId" (ngModelChange)="editCategory = $event">
                  @for (cat of store.categories(); track cat.id) { <option [value]="cat.id">{{ cat.name }}</option> }
                </select>
              </div>
              <div class="flex gap-2" style="margin-top: var(--space-3)">
                <button class="btn btn--primary btn--sm" (click)="saveEdit(txn)">
                  <svg lucideCheck [size]="14"></svg> Save
                </button>
                <button class="btn btn--danger btn--sm" (click)="store.deleteTransaction(txn.id); toast.success('Deleted')">
                  <svg lucideTrash2 [size]="14"></svg> Delete
                </button>
                <button class="btn btn--ghost btn--sm" (click)="editingId.set(null)">Cancel</button>
              </div>
            </div>
          }
        </div>
      } @empty {
        <div class="empty-state">
          <span class="empty-state__icon"><svg lucideReceipt [size]="40" style="opacity: 0.5"></svg></span>
          <p class="empty-state__title">No transactions found</p>
          <p class="empty-state__description">Try adjusting your filters or add a new transaction</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .txn-toolbar { display: flex; gap: var(--space-3); margin-bottom: var(--space-4); flex-wrap: wrap; align-items: center; }
    .txn-search { display: flex; align-items: center; gap: var(--space-2); flex: 1; min-width: 200px; background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 0 var(--space-3); }
    .txn-search__icon { flex-shrink: 0; color: var(--color-text-muted); }
    .txn-search__input { flex: 1; border: none; background: transparent; padding: var(--space-3) 0; color: var(--color-text-primary); outline: none; font-size: var(--fs-base); &::placeholder { color: var(--color-text-muted); } }
    .txn-actions { display: flex; gap: var(--space-2); }
    .filter-panel { margin-bottom: var(--space-4); }
    .filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: var(--space-4); }
    .filter-group { display: flex; flex-direction: column; gap: var(--space-2); }
    .filter-label { font-size: var(--fs-xs); font-weight: var(--fw-semibold); color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: var(--ls-wider); }
    .type-toggle { display: flex; gap: var(--space-1); }
    .bulk-bar { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: var(--color-violet-glow); border: 1px solid var(--color-violet); border-radius: var(--radius-lg); margin-bottom: var(--space-4); font-size: var(--fs-sm); font-weight: var(--fw-medium); color: var(--color-violet-light); }
    .txn-list-container { display: flex; flex-direction: column; gap: var(--space-2); }
    .txn-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; transition: all var(--duration-fast);
      &:hover { border-color: var(--color-border-hover); }
      &--selected { border-color: var(--color-violet); background: var(--color-violet-glow); }
    }
    .txn-card__main { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); cursor: pointer; }
    .txn-card__check { flex-shrink: 0; accent-color: var(--color-violet); }
    .txn-card__icon { width: 36px; height: 36px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .txn-card__info { flex: 1; min-width: 0; }
    .txn-card__category { display: block; font-size: var(--fs-sm); font-weight: var(--fw-medium); }
    .txn-card__note { display: block; font-size: var(--fs-xs); color: var(--color-text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .txn-card__right { text-align: right; flex-shrink: 0; }
    .txn-card__amount { display: block; font-size: var(--fs-sm); font-weight: var(--fw-semibold); font-variant-numeric: tabular-nums; }
    .txn-card__date { display: block; font-size: var(--fs-xs); color: var(--color-text-tertiary); }
    .txn-card__edit { padding: 0 var(--space-4) var(--space-4); border-top: 1px solid var(--color-border); padding-top: var(--space-3); }
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
