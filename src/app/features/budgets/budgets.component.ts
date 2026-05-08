import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LilyStore } from '../../core/store/lily.store';
import { ToastService } from '../../core/services/toast.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { CurrencyDisplayPipe } from '../../shared/pipes/currency-display.pipe';
import { format } from 'date-fns';

@Component({
  selector: 'lily-budgets',
  standalone: true,
  imports: [FormsModule, CurrencyDisplayPipe],
  template: `
    <div class="page-header">
      <h1 class="page-header__title">Budget</h1>
      <p class="page-header__subtitle">{{ currentMonthLabel() }}</p>
    </div>

    <!-- Spending Velocity -->
    <div class="lily-card lily-card--hero velocity-card animate-fade-in-up">
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

    <!-- Setup / Edit Budget -->
    <div class="lily-card animate-fade-in-up stagger-1" style="margin-top: var(--space-4)">
      <div class="lily-card__header">
        <span class="lily-card__title">{{ hasBudget() ? 'Budget Allocations' : 'Setup Budget' }}</span>
        @if (!editing()) { <button class="btn btn--primary btn--sm" (click)="editing.set(true)">✏️ Edit</button> }
      </div>
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
                <span class="budget-cat-row__label">{{ cat.icon }} {{ cat.name }}</span>
                <input type="number" class="input input--sm" [(ngModel)]="catLimits[cat.id]" [placeholder]="'Limit'" style="max-width: 120px">
              </div>
            }
          </div>
          <div class="flex gap-2" style="margin-top: var(--space-4)">
            <button class="btn btn--primary" (click)="saveBudget()">Save Budget</button>
            <button class="btn btn--ghost" (click)="editing.set(false)">Cancel</button>
          </div>
        </div>
      } @else if (hasBudget()) {
        <div class="budget-overview">
          @for (item of budgetVariance(); track item.categoryId) {
            <div class="budget-item">
              <div class="budget-item__top">
                <span class="budget-item__cat">{{ getCatIcon(item.categoryId) }} {{ getCatName(item.categoryId) }}</span>
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
          <span class="empty-state__icon">🎯</span>
          <p class="empty-state__title">No budget set for this month</p>
          <p class="empty-state__description">Set a budget to track your spending</p>
          <button class="btn btn--primary" (click)="editing.set(true)">Create Budget</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .velocity-card__row { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--space-4); }
    .velocity-stat { display: flex; flex-direction: column; gap: var(--space-1); }
    .velocity-stat__label { font-size: var(--fs-xs); color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: var(--ls-wider); }
    .velocity-stat__value { font-size: var(--fs-2xl); font-weight: var(--fw-bold); font-variant-numeric: tabular-nums; }
    .budget-form { display: flex; flex-direction: column; gap: var(--space-4); }
    .budget-form__total { display: flex; flex-direction: column; gap: var(--space-2); }
    .amount-input { display: flex; align-items: center; gap: var(--space-2); font-size: var(--fs-lg); font-weight: var(--fw-semibold); }
    .budget-form__cats { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-3); }
    .budget-cat-row { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); padding: var(--space-2); border-radius: var(--radius-md); background: var(--color-bg-input); }
    .budget-cat-row__label { font-size: var(--fs-sm); font-weight: var(--fw-medium); white-space: nowrap; }
    .budget-overview { display: flex; flex-direction: column; gap: var(--space-5); }
    .budget-item { display: flex; flex-direction: column; gap: var(--space-2); }
    .budget-item__top { display: flex; justify-content: space-between; align-items: center; }
    .budget-item__cat { font-size: var(--fs-sm); font-weight: var(--fw-medium); }
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

  expenseCategories = computed(() => this.store.categories().filter(c => c.type === 'expense'));

  getCatIcon(id: string): string { return this.store.categoryMap().get(id)?.icon || '📦'; }
  getCatName(id: string): string { return this.store.categoryMap().get(id)?.name || 'Other'; }

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
