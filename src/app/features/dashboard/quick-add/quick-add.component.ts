import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LilyStore } from '../../../core/store/lily.store';
import { ToastService } from '../../../core/services/toast.service';
import { Transaction } from '../../../core/models/transaction.model';
import { getCategoriesByType } from '../../../core/models/category.model';
import { LilyIconComponent } from '../../../shared/icons/lily-icon.component';
import {
  LucidePlus, LucideTarget, LucideSparkles, LucideZap,
  LucideArrowDownRight, LucideArrowUpRight,
} from '@lucide/angular';

@Component({
  selector: 'lily-quick-add',
  standalone: true,
  imports: [
    FormsModule, LilyIconComponent,
    LucidePlus, LucideTarget, LucideSparkles, LucideZap,
    LucideArrowDownRight, LucideArrowUpRight,
  ],
  template: `
    <button class="btn btn--fab animate-bounce-in" (click)="open()" aria-label="Add transaction">
      <span class="fab-icon" [class.fab-icon--active]="isOpen()">
        <svg lucidePlus [size]="24"></svg>
      </span>
    </button>

    @if (isOpen()) {
      <div class="drawer-overlay" (click)="close()"></div>
      <div class="drawer" [class.drawer--open]="isOpen()">
        <div class="drawer__handle" (click)="close()"></div>
        
        <div class="drawer__header">
          <h3 class="drawer__title">New {{ txnType() === 'expense' ? 'Expense' : 'Income' }}</h3>
          <div class="type-toggle">
            <button class="type-toggle__btn" [class.active]="txnType() === 'expense'" (click)="txnType.set('expense')">Expense</button>
            <button class="type-toggle__btn type-toggle__btn--income" [class.active]="txnType() === 'income'" (click)="txnType.set('income')">Income</button>
          </div>
        </div>

        <div class="drawer__content">
          <!-- Amount -->
          <div class="amount-section">
            <div class="amount-display">
              <span class="amount-display__currency">{{ store.currencySymbol() }}</span>
              <input type="number" 
                     class="amount-display__input" 
                     [(ngModel)]="amount" 
                     placeholder="0" 
                     min="0" 
                     autofocus
                     #amountInput>
            </div>
            <div class="amount-visual-hint">Enter the transaction amount</div>
          </div>

          <!-- Category Grid -->
          <div class="section-label">Category</div>
          <div class="category-grid">
            @for (cat of filteredCategories(); track cat.id) {
              <button class="category-chip" 
                      [class.active]="selectedCategory() === cat.id" 
                      (click)="selectedCategory.set(cat.id)"
                      [style.--cat-color]="cat.color">
                <div class="category-chip__icon-wrapper">
                  <lily-icon [name]="cat.icon" [size]="18" />
                </div>
                <span class="category-chip__name">{{ cat.name }}</span>
              </button>
            }
          </div>

          <!-- Details -->
          <div class="section-label">Details</div>
          <div class="details-grid">
            <div class="input-wrapper">
              <input type="text" class="input" [(ngModel)]="note" placeholder="What was this for?">
            </div>
            
            <div class="drawer__row">
              <div class="select-wrapper">
                <select class="select" [(ngModel)]="paymentMethod">
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="netbanking">Net Banking</option>
                  <option value="other">Other</option>
                </select>
              </div>

              @if (txnType() === 'expense') {
                <div class="mood-group">
                  <button class="mood-btn" [class.active]="mood() === 'need'" (click)="mood.set(mood() === 'need' ? undefined : 'need')" title="Need">
                    <svg lucideTarget [size]="18"></svg>
                  </button>
                  <button class="mood-btn" [class.active]="mood() === 'want'" (click)="mood.set(mood() === 'want' ? undefined : 'want')" title="Want">
                    <svg lucideSparkles [size]="18"></svg>
                  </button>
                  <button class="mood-btn" [class.active]="mood() === 'impulse'" (click)="mood.set(mood() === 'impulse' ? undefined : 'impulse')" title="Impulse">
                    <svg lucideZap [size]="18"></svg>
                  </button>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="drawer__footer">
          <button class="btn btn--primary btn--lg w-full" (click)="submit()" [disabled]="!amount || !selectedCategory()">
            <div class="btn__content">
              @if (txnType() === 'expense') {
                <svg lucideArrowDownRight [size]="18"></svg>
                <span>Add Expense</span>
              } @else {
                <svg lucideArrowUpRight [size]="18"></svg>
                <span>Add Income</span>
              }
            </div>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .drawer-overlay {
      position: fixed; inset: 0; background: var(--color-bg-overlay); z-index: var(--z-drawer);
      backdrop-filter: blur(8px); animation: fadeIn 0.3s ease-out;
    }

    .drawer {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: calc(var(--z-drawer) + 1);
      background: var(--color-bg-secondary);
      border-top: 1px solid var(--color-border);
      border-radius: var(--radius-3xl) var(--radius-3xl) 0 0;
      display: flex; flex-direction: column;
      max-height: 90vh; overflow: hidden;
      box-shadow: 0 -10px 40px rgba(0,0,0,0.3);
      animation: drawerSlideUp 0.5s var(--ease-spring);

      @media (min-width: 769px) {
        left: 50%; transform: translateX(-50%); width: 480px; bottom: var(--space-6);
        border: 1px solid var(--color-border); border-radius: var(--radius-3xl);
      }
    }

    .drawer__handle {
      width: 40px; height: 4px; background: var(--color-border); border-radius: var(--radius-full);
      margin: var(--space-3) auto 0; cursor: pointer;
    }

    .drawer__header { padding: var(--space-6) var(--space-6) var(--space-2); display: flex; align-items: center; justify-content: space-between; }
    .drawer__title { font-size: var(--fs-lg); font-weight: 800; color: var(--color-text-primary); }

    .drawer__content { padding: var(--space-4) var(--space-6); overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-6); }
    .drawer__footer { padding: var(--space-6); border-top: 1px solid var(--color-border); background: var(--color-bg-secondary); }

    .type-toggle {
      display: flex; gap: 2px; background: var(--color-bg-input); border-radius: var(--radius-full); padding: 2px; border: 1px solid var(--color-border);
    }
    .type-toggle__btn {
      padding: var(--space-1) var(--space-4); border-radius: var(--radius-full);
      font-size: var(--fs-xs); font-weight: 700; color: var(--color-text-secondary);
      transition: all var(--duration-fast);
      &.active { background: var(--color-rose); color: white; box-shadow: var(--shadow-sm); }
      &--income.active { background: var(--color-emerald); }
    }

    .amount-section { text-align: center; padding: var(--space-4) 0; }
    .amount-display {
      display: flex; align-items: center; justify-content: center; gap: var(--space-2);
      &__currency { font-size: var(--fs-3xl); color: var(--color-text-secondary); font-weight: 500; }
      &__input {
        width: 200px; font-size: 4rem; font-weight: 800; text-align: center;
        background: transparent; border: none; color: var(--color-text-primary); outline: none;
        font-variant-numeric: tabular-nums; letter-spacing: -2px;
        &::placeholder { color: var(--color-border); }
      }
    }
    .amount-visual-hint { font-size: var(--fs-xs); color: var(--color-text-tertiary); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: -4px; }

    .section-label { font-size: 11px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 1.5px; }

    .category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: var(--space-3); }
    .category-chip {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
      padding: var(--space-3); border-radius: var(--radius-2xl);
      background: var(--color-bg-input); border: 1px solid var(--color-border);
      transition: all var(--duration-fast) var(--ease-spring);
      
      &__icon-wrapper { 
        width: 40px; height: 40px; border-radius: var(--radius-xl); 
        background: var(--color-bg-secondary); border: 1px solid var(--color-border);
        display: flex; align-items: center; justify-content: center; color: var(--color-text-secondary);
        transition: inherit;
      }
      &__name { font-size: var(--fs-xs); font-weight: 700; color: var(--color-text-secondary); transition: inherit; }

      &:hover { transform: translateY(-2px); border-color: var(--color-border-hover); }
      &.active { 
        background: var(--color-bg-secondary); border-color: var(--cat-color);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        .category-chip__icon-wrapper { background: var(--cat-color); color: white; border-color: transparent; }
        .category-chip__name { color: var(--color-text-primary); }
      }
    }

    .details-grid { display: flex; flex-direction: column; gap: var(--space-4); }
    .drawer__row { display: flex; gap: var(--space-3); }
    .select-wrapper { flex: 1; }

    .mood-group { display: flex; gap: var(--space-1); background: var(--color-bg-input); border-radius: var(--radius-xl); padding: 4px; border: 1px solid var(--color-border); }
    .mood-btn {
      width: 40px; height: 40px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center;
      color: var(--color-text-tertiary); transition: all var(--duration-fast);
      &:hover { background: var(--color-bg-secondary); color: var(--color-text-secondary); }
      &.active { background: var(--color-bg-secondary); color: var(--color-violet-light); box-shadow: var(--shadow-sm); }
    }

    .w-full { width: 100%; }
    .btn__content { display: flex; align-items: center; justify-content: center; gap: var(--space-2); }

    .fab-icon {
      transition: transform 0.4s var(--ease-spring); display: inline-flex;
      &--active { transform: rotate(135deg); }
    }

    @keyframes drawerSlideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    @media (max-width: 768px) {
      .drawer { padding-bottom: env(safe-area-inset-bottom); }
    }
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
