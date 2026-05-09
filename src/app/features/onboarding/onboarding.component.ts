import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { LilyStore } from '../../core/store/lily.store';
import { ConfettiService } from '../../core/services/confetti.service';

import { CURRENCIES } from '../../core/models/settings.model';
import { IncomeSource, BUDGET_RULE, NEEDS_CATEGORIES, WANTS_CATEGORIES } from '../../core/models/income.model';
import { format } from 'date-fns';
import {
  LucideFlower2, LucideCircleDollarSign, LucideBarChart3,
  LucideActivity, LucideSparkles, LucideArrowRight, LucideArrowLeft,
  LucidePlus, LucideTrash2, LucideWallet,
} from '@lucide/angular';

@Component({
  selector: 'lily-onboarding',
  standalone: true,
  imports: [
    FormsModule, DecimalPipe,
    LucideFlower2, LucideCircleDollarSign, LucideBarChart3,
    LucideActivity, LucideSparkles, LucideArrowRight, LucideArrowLeft,
    LucidePlus, LucideTrash2, LucideWallet,
  ],
  template: `
    <div class="onboarding">
      <div class="onboarding__content">
        @switch (step()) {
          @case (0) {
            <div class="onboarding__step animate-fade-in-up">
              <div class="onboarding__icon"><svg lucideFlower2 [size]="56" style="color: var(--color-violet)"></svg></div>
              <h1 class="onboarding__title">Welcome to Lily</h1>
              <p class="onboarding__desc">Your personal finance companion. Track income, manage budgets, and build better money habits — starting with what you earn.</p>
              <button class="btn btn--primary btn--lg" (click)="step.set(1)">
                Get Started <svg lucideArrowRight [size]="16"></svg>
              </button>
            </div>
          }
          @case (1) {
            <div class="onboarding__step animate-fade-in-up">
              <div class="onboarding__icon"><svg lucideCircleDollarSign [size]="48" style="color: var(--color-emerald)"></svg></div>
              <h2 class="onboarding__title">Choose Your Currency</h2>
              <p class="onboarding__desc">Select the currency you primarily use.</p>
              <div class="currency-grid">
                @for (cur of popularCurrencies; track cur.code) {
                  <button class="currency-option" [class.active]="selectedCurrency() === cur.code" (click)="selectedCurrency.set(cur.code)">
                    <span class="currency-option__symbol">{{ cur.symbol }}</span>
                    <span class="currency-option__code">{{ cur.code }}</span>
                  </button>
                }
              </div>
              <div class="onboarding__nav">
                <button class="btn btn--ghost" (click)="step.set(0)">
                  <svg lucideArrowLeft [size]="14"></svg> Back
                </button>
                <button class="btn btn--primary" (click)="saveCurrency(); step.set(2)">
                  Next <svg lucideArrowRight [size]="14"></svg>
                </button>
              </div>
            </div>
          }
          @case (2) {
            <div class="onboarding__step animate-fade-in-up">
              <div class="onboarding__icon"><svg lucideWallet [size]="48" style="color: var(--color-violet-light)"></svg></div>
              <h2 class="onboarding__title">Your Monthly Income</h2>
              <p class="onboarding__desc">Add your income sources so Lily can help you budget smartly.</p>

              <div class="income-sources">
                @for (source of tempSources(); track source.id; let i = $index) {
                  <div class="income-source-row">
                    <input class="income-source-row__name" type="text" [(ngModel)]="source.name" placeholder="Source name" />
                    <div class="income-source-row__amount-wrap">
                      <span class="income-source-row__symbol">{{ currencySymbol() }}</span>
                      <input class="income-source-row__amount" type="number" [(ngModel)]="source.amount" placeholder="0" min="0" />
                    </div>
                    <select class="income-source-row__freq" [(ngModel)]="source.frequency">
                      <option value="monthly">Monthly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="weekly">Weekly</option>
                      <option value="one-time">One-time</option>
                    </select>
                    <button class="btn btn--ghost btn--icon" (click)="removeSource(i)" aria-label="Remove source">
                      <svg lucideTrash2 [size]="14"></svg>
                    </button>
                  </div>
                }
              </div>

              <button class="btn btn--ghost" (click)="addSource()" style="margin-top: var(--space-2)">
                <svg lucidePlus [size]="14"></svg> Add Income Source
              </button>

              @if (tempTotalIncome() > 0) {
                <div class="income-total">
                  <span class="income-total__label">Total Monthly Income</span>
                  <span class="income-total__value">{{ currencySymbol() }}{{ tempTotalIncome() | number:'1.0-0' }}</span>
                </div>
              }

              <div class="onboarding__nav">
                <button class="btn btn--ghost" (click)="step.set(1)">
                  <svg lucideArrowLeft [size]="14"></svg> Back
                </button>
                <button class="btn btn--primary" (click)="saveIncome(); step.set(3)" [disabled]="tempTotalIncome() <= 0">
                  Next <svg lucideArrowRight [size]="14"></svg>
                </button>
              </div>
            </div>
          }
          @case (3) {
            <div class="onboarding__step animate-fade-in-up">
              <div class="onboarding__icon"><svg lucideBarChart3 [size]="48" style="color: var(--color-amber)"></svg></div>
              <h2 class="onboarding__title">Budget Allocation</h2>
              <p class="onboarding__desc">We suggest the 50/30/20 rule. Adjust as you like.</p>

              <div class="budget-split">
                <div class="budget-split__bar">
                  <div class="budget-split__segment budget-split__segment--needs" [style.width.%]="needsPct()"></div>
                  <div class="budget-split__segment budget-split__segment--wants" [style.width.%]="wantsPct()"></div>
                  <div class="budget-split__segment budget-split__segment--savings" [style.width.%]="savingsPct()"></div>
                </div>
                <div class="budget-split__labels">
                  <span class="budget-split__label budget-split__label--needs">Needs {{ needsPct() | number:'1.0-0' }}%</span>
                  <span class="budget-split__label budget-split__label--wants">Wants {{ wantsPct() | number:'1.0-0' }}%</span>
                  <span class="budget-split__label budget-split__label--savings">Savings {{ savingsPct() | number:'1.0-0' }}%</span>
                </div>
              </div>

              <div class="budget-categories">
                @for (cat of budgetCategories; track cat.id) {
                  <div class="budget-cat-row">
                    <span class="budget-cat-row__name">{{ cat.name }}</span>
                    <div class="budget-cat-row__input-wrap">
                      <span class="budget-cat-row__symbol">{{ currencySymbol() }}</span>
                      <input class="budget-cat-row__input" type="number" [(ngModel)]="cat.limit" min="0" step="500" />
                    </div>
                  </div>
                }
              </div>

              <div class="income-total" style="margin-top: var(--space-4)">
                <span class="income-total__label">Total Budget</span>
                <span class="income-total__value" [class.over-budget]="totalBudgetAllocated() > tempTotalIncome()">
                  {{ currencySymbol() }}{{ totalBudgetAllocated() | number:'1.0-0' }} / {{ currencySymbol() }}{{ tempTotalIncome() | number:'1.0-0' }}
                </span>
              </div>

              @if (totalBudgetAllocated() > tempTotalIncome()) {
                <p class="text-sm" style="color: var(--color-rose); margin-top: var(--space-2)">Budget exceeds income by {{ currencySymbol() }}{{ totalBudgetAllocated() - tempTotalIncome() | number:'1.0-0' }}</p>
              }

              <div class="onboarding__nav">
                <button class="btn btn--ghost" (click)="step.set(2)">
                  <svg lucideArrowLeft [size]="14"></svg> Back
                </button>
                <button class="btn btn--primary" (click)="saveBudget(); step.set(4)">
                  Next <svg lucideArrowRight [size]="14"></svg>
                </button>
              </div>
            </div>
          }
          @case (4) {
            <div class="onboarding__step animate-fade-in-up">
              <div class="onboarding__icon"><svg lucideSparkles [size]="48" style="color: var(--color-violet)"></svg></div>
              <h2 class="onboarding__title">You're All Set!</h2>
              <p class="onboarding__desc">Here's your financial snapshot.</p>

              <div class="summary-cards">
                <div class="summary-card">
                  <span class="summary-card__label">Monthly Income</span>
                  <span class="summary-card__value summary-card__value--income">{{ currencySymbol() }}{{ tempTotalIncome() | number:'1.0-0' }}</span>
                </div>
                <div class="summary-card">
                  <span class="summary-card__label">Budget Allocated</span>
                  <span class="summary-card__value">{{ currencySymbol() }}{{ totalBudgetAllocated() | number:'1.0-0' }}</span>
                </div>
                <div class="summary-card">
                  <span class="summary-card__label">Monthly Savings</span>
                  <span class="summary-card__value summary-card__value--savings">{{ currencySymbol() }}{{ tempTotalIncome() - totalBudgetAllocated() | number:'1.0-0' }}</span>
                </div>
              </div>

              <button class="btn btn--primary btn--lg" (click)="complete()" style="margin-top: var(--space-6)">
                <svg lucideActivity [size]="18"></svg> Start Tracking
              </button>
            </div>
          }
        }

        <div class="step-dots">
          @for (s of [0,1,2,3,4]; track s) {
            <div class="step-dot" [class.active]="step() === s" [class.completed]="step() > s"></div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .onboarding {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: var(--space-6); background: var(--color-bg-primary);
    }
    .onboarding__content { max-width: 520px; width: 100%; }
    .onboarding__step { text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
    .onboarding__icon { margin-bottom: var(--space-2); }
    .onboarding__title { font-size: var(--fs-2xl); font-weight: var(--fw-bold); }
    .onboarding__desc { font-size: var(--fs-base); color: var(--color-text-secondary); max-width: 400px; line-height: 1.6; }
    .onboarding__nav { display: flex; justify-content: space-between; width: 100%; margin-top: var(--space-4); }
    .currency-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); width: 100%; }
    .currency-option {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-1);
      padding: var(--space-4) var(--space-3); border-radius: var(--radius-lg);
      border: 2px solid var(--color-border); cursor: pointer; transition: all var(--duration-fast);
      background: transparent; color: var(--color-text-primary);
      &:hover { border-color: var(--color-violet); background: var(--color-violet-glow); }
      &.active { border-color: var(--color-violet); background: var(--color-violet-glow); box-shadow: 0 0 20px var(--color-violet-glow); }
      &__symbol { font-size: var(--fs-2xl); font-weight: var(--fw-bold); }
      &__code { font-size: var(--fs-xs); color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
    }

    // ── Income Sources ──
    .income-sources { width: 100%; display: flex; flex-direction: column; gap: var(--space-3); }
    .income-source-row {
      display: grid; grid-template-columns: 1fr 140px 110px 36px; gap: var(--space-2); align-items: center;
      &__name, &__amount, &__freq {
        padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
        border: 1px solid var(--color-border); background: var(--color-bg-secondary);
        color: var(--color-text-primary); font-size: var(--fs-sm);
        &:focus { border-color: var(--color-violet); outline: none; }
      }
      &__amount-wrap { position: relative; display: flex; align-items: center; }
      &__symbol { position: absolute; left: 10px; color: var(--color-text-muted); font-size: var(--fs-sm); pointer-events: none; }
      &__amount { padding-left: var(--space-6) !important; width: 100%; }
      &__freq { cursor: pointer; }
    }
    .income-total {
      display: flex; justify-content: space-between; align-items: center;
      width: 100%; padding: var(--space-4); border-radius: var(--radius-lg);
      background: var(--color-bg-secondary); margin-top: var(--space-4);
      &__label { font-size: var(--fs-sm); color: var(--color-text-secondary); }
      &__value { font-size: var(--fs-xl); font-weight: var(--fw-bold); font-family: var(--font-mono); color: var(--color-emerald); }
    }

    // ── Budget Split ──
    .budget-split {
      width: 100%; margin-bottom: var(--space-4);
      &__bar { display: flex; height: 12px; border-radius: var(--radius-full); overflow: hidden; gap: 2px; }
      &__segment {
        transition: width var(--duration-normal);
        &--needs { background: var(--color-blue); }
        &--wants { background: var(--color-amber); }
        &--savings { background: var(--color-emerald); }
      }
      &__labels { display: flex; justify-content: space-between; margin-top: var(--space-2); }
      &__label {
        font-size: var(--fs-xs); font-weight: var(--fw-semibold);
        &--needs { color: var(--color-blue); }
        &--wants { color: var(--color-amber); }
        &--savings { color: var(--color-emerald); }
      }
    }
    .budget-categories { width: 100%; display: flex; flex-direction: column; gap: var(--space-2); max-height: 280px; overflow-y: auto; }
    .budget-cat-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
      background: var(--color-bg-secondary);
      &__name { font-size: var(--fs-sm); font-weight: var(--fw-medium); }
      &__input-wrap { display: flex; align-items: center; gap: var(--space-1); }
      &__symbol { font-size: var(--fs-sm); color: var(--color-text-muted); }
      &__input {
        width: 90px; padding: var(--space-1) var(--space-2); border-radius: var(--radius-md);
        border: 1px solid var(--color-border); background: var(--color-bg-primary);
        color: var(--color-text-primary); font-size: var(--fs-sm); text-align: right;
        font-family: var(--font-mono);
        &:focus { border-color: var(--color-violet); outline: none; }
      }
    }
    .over-budget { color: var(--color-rose) !important; }

    // ── Summary Cards ──
    .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); width: 100%; }
    .summary-card {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
      padding: var(--space-5) var(--space-3); border-radius: var(--radius-lg);
      background: var(--color-bg-secondary); border: 1px solid var(--color-border);
      &__label { font-size: var(--fs-xs); color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
      &__value { font-size: var(--fs-lg); font-weight: var(--fw-bold); font-family: var(--font-mono);
        &--income { color: var(--color-emerald); }
        &--savings { color: var(--color-violet-light); }
      }
    }

    .step-dots { display: flex; gap: var(--space-2); justify-content: center; margin-top: var(--space-8); }
    .step-dot {
      width: 8px; height: 8px; border-radius: var(--radius-full); background: var(--color-border); transition: all var(--duration-fast);
      &.active { width: 24px; background: var(--color-violet); }
      &.completed { background: var(--color-violet-muted); }
    }
    input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; }
    input[type="number"] { -moz-appearance: textfield; }
  `],
})
export class OnboardingComponent {
  private store = inject(LilyStore);
  private confetti = inject(ConfettiService);
  private router = inject(Router);

  step = signal(0);
  selectedCurrency = signal('INR');

  // ── Income Sources (local state before saving) ──
  tempSources = signal<IncomeSource[]>([
    {
      id: crypto.randomUUID(), name: 'Salary', amount: 0,
      frequency: 'monthly', categoryId: 'salary', isActive: true,
      createdAt: new Date().toISOString(),
    },
  ]);

  tempTotalIncome = computed(() =>
    this.tempSources().reduce((sum, s) => {
      const multiplier = s.frequency === 'monthly' ? 1 : s.frequency === 'biweekly' ? 26 / 12 : s.frequency === 'weekly' ? 52 / 12 : 0;
      return sum + (s.amount * multiplier);
    }, 0)
  );

  // ── Budget Categories (local state) ──
  budgetCategories = [
    { id: 'food', name: 'Food & Dining', limit: 0, type: 'wants' },
    { id: 'transport', name: 'Transport', limit: 0, type: 'needs' },
    { id: 'entertainment', name: 'Entertainment', limit: 0, type: 'wants' },
    { id: 'shopping', name: 'Shopping', limit: 0, type: 'wants' },
    { id: 'bills', name: 'Bills & Utilities', limit: 0, type: 'needs' },
    { id: 'health', name: 'Health', limit: 0, type: 'needs' },
    { id: 'groceries', name: 'Groceries', limit: 0, type: 'needs' },
    { id: 'subscriptions', name: 'Subscriptions', limit: 0, type: 'wants' },
    { id: 'personal', name: 'Personal', limit: 0, type: 'wants' },
  ];

  totalBudgetAllocated = computed(() =>
    this.budgetCategories.reduce((sum, c) => sum + (c.limit || 0), 0)
  );

  needsPct = computed(() => {
    const total = this.tempTotalIncome();
    if (total <= 0) return 50;
    const needs = this.budgetCategories.filter(c => c.type === 'needs').reduce((s, c) => s + (c.limit || 0), 0);
    return Math.round((needs / total) * 100);
  });
  wantsPct = computed(() => {
    const total = this.tempTotalIncome();
    if (total <= 0) return 30;
    const wants = this.budgetCategories.filter(c => c.type === 'wants').reduce((s, c) => s + (c.limit || 0), 0);
    return Math.round((wants / total) * 100);
  });
  savingsPct = computed(() => Math.max(0, 100 - this.needsPct() - this.wantsPct()));

  popularCurrencies = CURRENCIES.slice(0, 6);
  currencySymbol = () => CURRENCIES.find(c => c.code === this.selectedCurrency())?.symbol || '₹';

  addSource(): void {
    this.tempSources.update(s => [...s, {
      id: crypto.randomUUID(), name: '', amount: 0,
      frequency: 'monthly' as const, categoryId: 'freelance', isActive: true,
      createdAt: new Date().toISOString(),
    }]);
  }

  removeSource(index: number): void {
    this.tempSources.update(s => s.filter((_, i) => i !== index));
  }

  saveCurrency(): void {
    const cur = CURRENCIES.find(c => c.code === this.selectedCurrency());
    if (cur) this.store.updateSettings({ currency: cur });
  }

  saveIncome(): void {
    const sources = this.tempSources().filter(s => s.amount > 0 && s.name.trim());
    for (const source of sources) {
      this.store.addIncomeSource(source);
    }
    // Auto-suggest 50/30/20 allocation
    const income = this.tempTotalIncome();
    const needsBudget = Math.round(income * BUDGET_RULE.needs);
    const wantsBudget = Math.round(income * BUDGET_RULE.wants);

    const needsCats = this.budgetCategories.filter(c => c.type === 'needs');
    const wantsCats = this.budgetCategories.filter(c => c.type === 'wants');

    const perNeed = Math.round(needsBudget / needsCats.length / 500) * 500;
    const perWant = Math.round(wantsBudget / wantsCats.length / 500) * 500;

    needsCats.forEach(c => c.limit = perNeed);
    wantsCats.forEach(c => c.limit = perWant);
  }

  saveBudget(): void {
    const month = format(new Date(), 'yyyy-MM');
    const categoryLimits: Record<string, number> = {};
    for (const cat of this.budgetCategories) {
      if (cat.limit > 0) categoryLimits[cat.id] = cat.limit;
    }
    this.store.setBudget({
      month,
      totalLimit: this.totalBudgetAllocated(),
      categoryLimits,
      rollover: false,
    });
    this.store.updateSettings({ monthlyBudgetTarget: this.totalBudgetAllocated() });
  }

  complete(): void {
    // Log first month's income
    const sources = this.tempSources().filter(s => s.amount > 0 && s.name.trim());
    const month = format(new Date(), 'yyyy-MM');
    for (const source of sources) {
      if (source.frequency !== 'one-time') {
        this.store.addTransaction({
          id: crypto.randomUUID(),
          amount: source.amount,
          type: 'income',
          categoryId: source.categoryId,
          note: source.name,
          date: `${month}-01T09:00:00.000Z`,
          tags: [],
          isRecurring: true,
          recurringFrequency: 'monthly',
          paymentMethod: 'netbanking',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    this.store.completeOnboarding();
    this.confetti.burst();
    this.router.navigate(['/dashboard']);
  }
}
