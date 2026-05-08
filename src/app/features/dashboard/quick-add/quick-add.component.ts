import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LilyStore } from '../../../core/store/lily.store';
import { ToastService } from '../../../core/services/toast.service';
import { Transaction } from '../../../core/models/transaction.model';
import { getCategoriesByType } from '../../../core/models/category.model';
import { format } from 'date-fns';

@Component({
  selector: 'lily-quick-add',
  standalone: true,
  imports: [FormsModule],
  template: `
    <button class="btn btn--fab" (click)="open()" aria-label="Add transaction">
      <span class="fab-icon" [class.fab-icon--active]="isOpen()">+</span>
    </button>

    @if (isOpen()) {
      <div class="drawer-overlay" (click)="close()"></div>
      <div class="drawer" [class.drawer--open]="isOpen()">
        <div class="drawer__handle" (click)="close()"></div>
        <h3 class="drawer__title">Add {{ txnType() === 'expense' ? 'Expense' : 'Income' }}</h3>

        <!-- Type Toggle -->
        <div class="type-toggle">
          <button class="type-toggle__btn" [class.active]="txnType() === 'expense'" (click)="txnType.set('expense')">Expense</button>
          <button class="type-toggle__btn type-toggle__btn--income" [class.active]="txnType() === 'income'" (click)="txnType.set('income')">Income</button>
        </div>

        <!-- Amount -->
        <div class="amount-display">
          <span class="amount-display__currency">{{ store.currencySymbol() }}</span>
          <input type="number" class="amount-display__input" [(ngModel)]="amount" placeholder="0" min="0" autofocus>
        </div>

        <!-- Category Grid -->
        <div class="category-grid">
          @for (cat of filteredCategories(); track cat.id) {
            <button class="category-chip" [class.active]="selectedCategory() === cat.id" (click)="selectedCategory.set(cat.id)">
              <span class="category-chip__icon">{{ cat.icon }}</span>
              <span class="category-chip__name">{{ cat.name }}</span>
            </button>
          }
        </div>

        <!-- Note -->
        <input type="text" class="input" [(ngModel)]="note" placeholder="Add a note..." style="margin-top: var(--space-4)">

        <!-- Payment Method & Mood -->
        <div class="drawer__row">
          <select class="select" [(ngModel)]="paymentMethod" style="flex: 1">
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="netbanking">Net Banking</option>
            <option value="other">Other</option>
          </select>
          @if (txnType() === 'expense') {
            <div class="mood-pills">
              <button class="pill" [class.active]="mood() === 'need'" (click)="mood.set(mood() === 'need' ? undefined : 'need')">🎯 Need</button>
              <button class="pill" [class.active]="mood() === 'want'" (click)="mood.set(mood() === 'want' ? undefined : 'want')">✨ Want</button>
              <button class="pill" [class.active]="mood() === 'impulse'" (click)="mood.set(mood() === 'impulse' ? undefined : 'impulse')">⚡ Impulse</button>
            </div>
          }
        </div>

        <!-- Submit -->
        <button class="btn btn--primary btn--lg" style="width: 100%; margin-top: var(--space-4)" (click)="submit()" [disabled]="!amount || !selectedCategory()">
          {{ txnType() === 'expense' ? '💸 Add Expense' : '💰 Add Income' }}
        </button>
      </div>
    }
  `,
  styles: [`
    .drawer-overlay {
      position: fixed; inset: 0; background: var(--color-bg-overlay); z-index: var(--z-drawer);
      animation: fadeIn 0.2s ease-out;
    }
    .drawer {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: calc(var(--z-drawer) + 1);
      background: var(--color-bg-secondary); border-top: 1px solid var(--color-border);
      border-radius: var(--radius-3xl) var(--radius-3xl) 0 0;
      padding: var(--space-4) var(--space-6) var(--space-8);
      max-height: 85vh; overflow-y: auto;
      animation: slideUp 0.35s var(--ease-spring);
      @media (min-width: 769px) {
        left: 50%; transform: translateX(-50%); max-width: 480px;
        border-radius: var(--radius-3xl) var(--radius-3xl) 0 0;
      }
    }
    .drawer__handle {
      width: 40px; height: 4px; background: var(--color-text-muted); border-radius: var(--radius-full);
      margin: 0 auto var(--space-4); cursor: pointer;
    }
    .drawer__title { font-size: var(--fs-xl); font-weight: var(--fw-bold); margin-bottom: var(--space-4); }
    .type-toggle {
      display: flex; gap: var(--space-2); margin-bottom: var(--space-4);
      background: var(--color-bg-input); border-radius: var(--radius-lg); padding: 3px;
    }
    .type-toggle__btn {
      flex: 1; padding: var(--space-2); border-radius: var(--radius-md);
      font-size: var(--fs-sm); font-weight: var(--fw-semibold); color: var(--color-text-secondary);
      transition: all var(--duration-fast);
      &.active { background: var(--color-rose); color: white; }
      &--income.active { background: var(--color-emerald); }
    }
    .amount-display {
      display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-4);
      &__currency { font-size: var(--fs-3xl); color: var(--color-text-secondary); font-weight: var(--fw-semibold); }
      &__input {
        flex: 1; font-size: var(--fs-4xl); font-weight: var(--fw-bold); font-family: var(--font-mono);
        background: transparent; border: none; color: var(--color-text-primary); outline: none;
        font-variant-numeric: tabular-nums;
        &::placeholder { color: var(--color-text-muted); }
      }
    }
    .category-grid {
      display: flex; flex-wrap: wrap; gap: var(--space-2);
    }
    .category-chip {
      display: flex; align-items: center; gap: var(--space-1);
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-full);
      background: var(--color-bg-input); border: 1px solid var(--color-border);
      font-size: var(--fs-sm); color: var(--color-text-secondary);
      transition: all var(--duration-fast);
      &:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }
      &.active { background: var(--color-violet-glow); border-color: var(--color-violet); color: var(--color-violet-light); }
      &__icon { font-size: 1rem; }
      &__name { font-weight: var(--fw-medium); }
    }
    .drawer__row { display: flex; gap: var(--space-3); margin-top: var(--space-3); flex-wrap: wrap; align-items: start; }
    .mood-pills { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .fab-icon {
      font-size: 1.5rem; font-weight: 300; transition: transform var(--duration-fast) var(--ease-spring); display: inline-block;
      &--active { transform: rotate(45deg); }
    }
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    input[type="number"] { -moz-appearance: textfield; }
  `],
})
export class QuickAddComponent {
  store = inject(LilyStore);
  private toast = inject(ToastService);

  isOpen = signal(false);
  txnType = signal<'expense' | 'income'>('expense');
  amount = 0;
  note = '';
  paymentMethod: Transaction['paymentMethod'] = 'upi';
  selectedCategory = signal<string>('');
  mood = signal<Transaction['mood'] | undefined>(undefined);

  filteredCategories = () => getCategoriesByType(this.store.categories(), this.txnType());

  open(): void { this.isOpen.set(true); }
  close(): void { this.isOpen.set(false); this.reset(); }

  submit(): void {
    if (!this.amount || !this.selectedCategory()) return;
    const txn: Transaction = {
      id: crypto.randomUUID(),
      amount: this.amount,
      type: this.txnType(),
      categoryId: this.selectedCategory(),
      note: this.note,
      date: new Date().toISOString(),
      tags: [],
      isRecurring: false,
      paymentMethod: this.paymentMethod,
      mood: this.txnType() === 'expense' ? this.mood() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.addTransaction(txn);
    this.toast.success(`${this.txnType() === 'expense' ? 'Expense' : 'Income'} added!`);
    this.close();
  }

  private reset(): void {
    this.amount = 0; this.note = ''; this.selectedCategory.set(''); this.mood.set(undefined);
  }
}
