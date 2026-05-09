import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LilyStore } from '../../core/store/lily.store';
import { ToastService } from '../../core/services/toast.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { CurrencyDisplayPipe } from '../../shared/pipes/currency-display.pipe';
import { LilyIconComponent } from '../../shared/icons/lily-icon.component';
import { BUDGET_RULE, NEEDS_CATEGORIES, WANTS_CATEGORIES } from '../../core/models/income.model';
import { format } from 'date-fns';
import {
  LucidePencil, LucideTarget, LucideCheck, LucideZap,
  LucideTriangleAlert, LucideArrowUpRight,
  LucideTrendingUp,
} from '@lucide/angular';

@Component({
  selector: 'lily-budgets',
  standalone: true,
  imports: [
    FormsModule, CurrencyDisplayPipe, LilyIconComponent,
    LucidePencil, LucideTarget, LucideCheck, LucideZap,
    LucideTriangleAlert, LucideArrowUpRight,
    LucideTrendingUp,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-header__title">Budget</h1>
      <p class="page-header__subtitle">{{ currentMonthLabel() }}</p>
    </div>

    <!-- Income Summary Bar -->
    @if (store.totalMonthlyIncome() > 0) {
      <div class="lily-card income-bar animate-fade-in-up">
        <div class="income-bar__row">
          <div class="income-bar__item">
            <svg lucideArrowUpRight [size]="16" style="color: var(--color-emerald)"></svg>
            <span class="income-bar__label">Income</span>
            <span class="income-bar__value text-income">{{ store.totalMonthlyIncome() | currencyDisplay }}</span>
          </div>
          <div class="income-bar__arrow">→</div>
          <div class="income-bar__item">
            <svg lucideTarget [size]="16" style="color: var(--color-amber)"></svg>
            <span class="income-bar__label">Budget</span>
            <span class="income-bar__value">{{ store.currentBudgetTotal() | currencyDisplay }}</span>
          </div>
          <div class="income-bar__arrow">→</div>
          <div class="income-bar__item">
            <svg lucideTrendingUp [size]="16" style="color: var(--color-violet-light)"></svg>
            <span class="income-bar__label">Savings</span>
            <span class="income-bar__value" [class.text-income]="store.savingsTarget() >= 0" [class.text-expense]="store.savingsTarget() < 0">
              {{ store.savingsTarget() | currencyDisplay }}
            </span>
          </div>
        </div>
        <!-- Unallocated bar -->
        @if (store.unallocatedBudget() > 0 && hasBudget()) {
          <div class="unallocated-bar">
            <span class="text-xs text-tertiary">Unallocated</span>
            <div class="progress-bar" style="flex: 1">
              <div class="progress-bar__fill" [style.width.%]="unallocatedPct()" style="background: var(--color-violet-muted)"></div>
            </div>
            <span class="text-xs font-medium">{{ store.unallocatedBudget() | currencyDisplay }}</span>
          </div>
        }
      </div>
    }

    <!-- Spending Velocity -->
    @if (hasBudget()) {
      <div class="lily-card lily-card--hero velocity-card animate-fade-in-up stagger-1">
        <div class="velocity-card__row">
          <div class="velocity-stat">
            <span class="velocity-stat__label">Projected Spend</span>
            <span class="velocity-stat__value" [class.text-expense]="velocity().projected > velocity().budget">{{ velocity().projected | currencyDisplay }}</span>
          </div>
          <div class="velocity-stat">
            <span class="velocity-stat__label">Budget</span>
            <span class="velocity-stat__value text-income">{{ velocity().budget | currencyDisplay }}</span>
          </div>
          <div class="velocity-stat">
            <span class="velocity-stat__label">Safe Daily</span>
            <span class="velocity-stat__value">{{ velocity().safeDaily | currencyDisplay }}</span>
          </div>
          <div class="velocity-stat">
            <span class="velocity-stat__label">Days Left</span>
            <span class="velocity-stat__value">{{ velocity().daysLeft }}</span>
          </div>
        </div>
        <div class="progress-bar" style="height: 8px; margin-top: var(--space-4)">
          <div class="progress-bar__fill" [style.width.%]="projectedPct()" [style.background]="projectedPct() > 100 ? 'var(--color-rose)' : projectedPct() > 80 ? 'var(--color-amber)' : 'var(--color-emerald)'"></div>
        </div>
      </div>
    }

    <!-- Setup / Edit Budget -->
    <div class="lily-card animate-fade-in-up stagger-2" style="margin-top: var(--space-4)">
      <div class="lily-card__header">
        <span class="lily-card__title">{{ hasBudget() ? 'Budget Allocations' : 'Setup Budget' }}</span>
        <div class="flex gap-2">
          @if (editing() && store.totalMonthlyIncome() > 0) {
            <button class="btn btn--ghost btn--sm" (click)="apply503020()" title="Apply 50/30/20 rule">
              <svg lucideZap [size]="14"></svg> 50/30/20
            </button>
          }
          @if (!editing()) {
            <button class="btn btn--primary btn--sm" (click)="startEditing()">
              <svg lucidePencil [size]="14"></svg> Edit
            </button>
          }
        </div>
      </div>

      <!-- Over-income warning -->
      @if (editing() && totalAllocated() > store.totalMonthlyIncome() && store.totalMonthlyIncome() > 0) {
        <div class="over-income-warning">
          <svg lucideTriangleAlert [size]="16"></svg>
          <span>Budget exceeds income by {{ totalAllocated() - store.totalMonthlyIncome() | currencyDisplay }}</span>
        </div>
      }

      @if (editing()) {
        <div class="budget-form">
          <div class="budget-form__total">
            <label class="filter-label">Monthly Budget</label>
            <div class="amount-input">
              <span>{{ store.currencySymbol() }}</span>
              <input type="number" class="input" [(ngModel)]="totalLimit" placeholder="Total limit" style="max-width: 200px">
            </div>
          </div>
          <div class="budget-form__cats">
            @for (cat of expenseCategories(); track cat.id) {
              <div class="budget-cat-row">
                <span class="budget-cat-row__label">
                  <lily-icon [name]="cat.icon" [size]="14" /> {{ cat.name }}
                </span>
                <input type="number" class="input input--sm" [(ngModel)]="catLimits[cat.id]" [placeholder]="'Limit'" style="max-width: 120px">
              </div>
            }
          </div>
          <div class="flex gap-2" style="margin-top: var(--space-4)">
            <button class="btn btn--primary" (click)="saveBudget()">
              <svg lucideCheck [size]="14"></svg> Save Budget
            </button>
            <button class="btn btn--ghost" (click)="editing.set(false)">Cancel</button>
          </div>
        </div>
      } @else if (hasBudget()) {
        <div class="budget-overview">
          @for (item of budgetVariance(); track item.categoryId) {
            <div class="budget-item">
              <div class="budget-item__top">
                <span class="budget-item__cat">
                  <lily-icon [name]="getCatIcon(item.categoryId)" [size]="14" /> {{ getCatName(item.categoryId) }}
                </span>
                <span class="text-xs" [class.text-expense]="item.percentage > 100" [class.text-income]="item.percentage <= 80">
                  {{ item.actual | currencyDisplay }} / {{ item.budgeted | currencyDisplay }}
                </span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar__fill" [style.width.%]="Math.min(item.percentage, 100)"
                     [style.background]="item.percentage > 100 ? 'var(--color-rose)' : item.percentage > 80 ? 'var(--color-amber)' : 'var(--color-emerald)'"></div>
              </div>
              @if (item.variance < 0) {
                <span class="text-xs text-expense">{{ Math.abs(item.variance) | currencyDisplay }} over budget</span>
              } @else {
                <span class="text-xs text-income">{{ item.variance | currencyDisplay }} remaining</span>
              }
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <span class="empty-state__icon"><svg lucideTarget [size]="40" style="opacity: 0.5"></svg></span>
          <p class="empty-state__title">No budget set for this month</p>
          <p class="empty-state__description">Set a budget to track your spending against your income</p>
          <button class="btn btn--primary" (click)="startEditing()">Create Budget</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .income-bar__row { display: flex; align-items: center; justify-content: center; gap: var(--space-6); flex-wrap: wrap; }
    .income-bar__item { display: flex; align-items: center; gap: var(--space-2); }
    .income-bar__label { font-size: var(--fs-xs); color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: var(--ls-wider); }
    .income-bar__value { font-size: var(--fs-base); font-weight: var(--fw-bold); font-variant-numeric: tabular-nums; }
    .income-bar__arrow { color: var(--color-text-muted); font-size: var(--fs-lg); }
    .unallocated-bar { display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px solid var(--color-border); }
    .over-income-warning {
      display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4);
      background: rgba(244, 63, 94, 0.1); border-radius: var(--radius-md); color: var(--color-rose);
      font-size: var(--fs-sm); margin-bottom: var(--space-3);
    }
    .velocity-card__row { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--space-4); }
    .velocity-stat { display: flex; flex-direction: column; gap: var(--space-1); }
    .velocity-stat__label { font-size: var(--fs-xs); color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: var(--ls-wider); }
    .velocity-stat__value { font-size: var(--fs-2xl); font-weight: var(--fw-bold); font-variant-numeric: tabular-nums; }
    .budget-form { display: flex; flex-direction: column; gap: var(--space-4); }
    .budget-form__total { display: flex; flex-direction: column; gap: var(--space-2); }
    .amount-input { display: flex; align-items: center; gap: var(--space-2); font-size: var(--fs-lg); font-weight: var(--fw-semibold); }
    .budget-form__cats { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-3); }
    .budget-cat-row { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); padding: var(--space-2); border-radius: var(--radius-md); background: var(--color-bg-input); }
    .budget-cat-row__label { font-size: var(--fs-sm); font-weight: var(--fw-medium); white-space: nowrap; display: inline-flex; align-items: center; gap: var(--space-2); }
    .budget-overview { display: flex; flex-direction: column; gap: var(--space-5); }
    .budget-item { display: flex; flex-direction: column; gap: var(--space-2); }
    .budget-item__top { display: flex; justify-content: space-between; align-items: center; }
    .budget-item__cat { font-size: var(--fs-sm); font-weight: var(--fw-medium); display: inline-flex; align-items: center; gap: var(--space-2); }
  `],
})
export class BudgetsComponent {
  store = inject(LilyStore);
  private analytics = inject(AnalyticsService);
  private toast = inject(ToastService);
  Math = Math;

  editing = signal(false);
  totalLimit = 0;
  catLimits: Record<string, number> = {};

  currentMonthLabel = computed(() => format(new Date(), 'MMMM yyyy'));
  currentMonth = computed(() => format(new Date(), 'yyyy-MM'));
  hasBudget = computed(() => !!this.store.currentBudget());
  velocity = computed(() => this.analytics.spendingVelocity(this.currentMonth()));
  budgetVariance = computed(() => this.analytics.budgetVariance(this.currentMonth()));
  projectedPct = computed(() => {
    const v = this.velocity();
    return v.budget > 0 ? Math.round((v.projected / v.budget) * 100) : 0;
  });

  totalAllocated = computed(() => Object.values(this.catLimits).reduce((sum, v) => sum + (v || 0), 0));

  unallocatedPct = computed(() => {
    const income = this.store.totalMonthlyIncome();
    if (income <= 0) return 0;
    return Math.round((this.store.unallocatedBudget() / income) * 100);
  });

  expenseCategories = computed(() => this.store.categories().filter(c => c.type === 'expense'));

  getCatIcon(id: string): string { return this.store.categoryMap().get(id)?.icon || 'package'; }
  getCatName(id: string): string { return this.store.categoryMap().get(id)?.name || 'Other'; }

  startEditing(): void {
    const budget = this.store.currentBudget();
    if (budget) {
      this.totalLimit = budget.totalLimit;
      this.catLimits = { ...budget.categoryLimits };
    } else {
      this.totalLimit = this.store.totalMonthlyIncome() > 0
        ? Math.round(this.store.totalMonthlyIncome() * 0.8) // default 80% of income
        : 0;
      this.catLimits = {};
    }
    this.editing.set(true);
  }

  apply503020(): void {
    const income = this.store.totalMonthlyIncome();
    if (income <= 0) return;

    const needsBudget = Math.round(income * BUDGET_RULE.needs);
    const wantsBudget = Math.round(income * BUDGET_RULE.wants);

    const categories = this.expenseCategories();
    const needsCats = categories.filter(c => NEEDS_CATEGORIES.includes(c.id));
    const wantsCats = categories.filter(c => WANTS_CATEGORIES.includes(c.id));

    const perNeed = Math.round(needsBudget / (needsCats.length || 1) / 500) * 500;
    const perWant = Math.round(wantsBudget / (wantsCats.length || 1) / 500) * 500;

    for (const cat of needsCats) this.catLimits[cat.id] = perNeed;
    for (const cat of wantsCats) this.catLimits[cat.id] = perWant;

    this.totalLimit = Object.values(this.catLimits).reduce((s, v) => s + v, 0);
    this.toast.info('Applied 50/30/20 rule');
  }

  saveBudget(): void {
    if (!this.totalLimit) { this.toast.warning('Enter a total budget'); return; }
    this.store.setBudget({
      month: this.currentMonth(),
      totalLimit: this.totalLimit,
      categoryLimits: this.catLimits,
      rollover: false,
    });
    this.store.updateSettings({ monthlyBudgetTarget: this.totalLimit });
    this.editing.set(false);
    this.toast.success('Budget saved!');
  }
}
