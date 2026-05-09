import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LilyStore } from '../../core/store/lily.store';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ToastService } from '../../core/services/toast.service';
import { CurrencyDisplayPipe } from '../../shared/pipes/currency-display.pipe';
import { RelativeDatePipe } from '../../shared/pipes/relative-date.pipe';
import { NumberAnimateDirective } from '../../shared/directives/number-animate.directive';
import { QuickAddComponent } from './quick-add';
import { LilyIconComponent } from '../../shared/icons/lily-icon.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { format } from 'date-fns';
import {
  LucideFlame, LucideLightbulb, LucideX, LucideWallet,
  LucideArrowUpRight, LucideArrowDownRight, LucidePlus,
  LucideTrendingUp,
} from '@lucide/angular';

@Component({
  selector: 'lily-dashboard',
  standalone: true,
  imports: [
    CurrencyDisplayPipe, RelativeDatePipe, NumberAnimateDirective,
    QuickAddComponent, BaseChartDirective, LilyIconComponent, RouterLink,
    LucideFlame, LucideLightbulb, LucideX, LucideWallet,
    LucideArrowUpRight, LucideArrowDownRight, LucidePlus,
    LucideTrendingUp,
  ],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <h1 class="page-header__title">Dashboard</h1>
        <p class="page-header__subtitle">{{ currentMonthLabel() }}</p>
      </div>

      <!-- Hero Balance Card -->
      <div class="lily-card lily-card--hero hero-card animate-fade-in-up">
        <div class="hero-card__top">
          <div class="hero-card__balance-section">
            <span class="hero-card__label">Current Balance</span>
            <div class="hero-card__amount">
              <span class="hero-card__currency">{{ store.currencySymbol() }}</span>
              <span class="hero-card__value" [lilyNumberAnimate]="store.balance()"></span>
            </div>
          </div>
          @if (store.hasData()) {
            <div class="hero-card__donut">
              <canvas baseChart [data]="donutData()" [options]="donutOptions" type="doughnut" aria-label="Income vs Expense breakdown"></canvas>
            </div>
          }
        </div>
        <div class="hero-card__stats">
          <div class="hero-card__stat hero-card__stat--income">
            <svg lucideArrowUpRight [size]="16" style="color: var(--color-emerald)"></svg>
            <span class="hero-card__stat-label">Income</span>
            <span class="hero-card__stat-value">{{ store.totalIncome() | currencyDisplay }}</span>
          </div>
          <div class="hero-card__stat hero-card__stat--expense">
            <svg lucideArrowDownRight [size]="16" style="color: var(--color-rose)"></svg>
            <span class="hero-card__stat-label">Expenses</span>
            <span class="hero-card__stat-value">{{ store.totalExpenses() | currencyDisplay }}</span>
          </div>
          @if (store.totalMonthlyIncome() > 0) {
            <div class="hero-card__stat hero-card__stat--savings">
              <svg lucideTrendingUp [size]="16" style="color: var(--color-violet-light)"></svg>
              <span class="hero-card__stat-label">Savings Rate</span>
              <span class="hero-card__stat-value" [class.positive]="store.savingsRate() >= 0" [class.negative]="store.savingsRate() < 0">{{ store.savingsRate() }}%</span>
            </div>
          }
        </div>
      </div>

      <!-- Income Prompt (if no income logged this month) -->
      @if (!store.hasIncomeThisMonth() && store.totalMonthlyIncome() > 0) {
        <div class="lily-card lily-card--gradient income-prompt animate-fade-in-up">
          <div class="income-prompt__content">
            <svg lucideWallet [size]="24" style="color: var(--color-amber)"></svg>
            <div>
              <p class="income-prompt__title">No income logged this month</p>
              <p class="income-prompt__desc">Your expected income is {{ store.totalMonthlyIncome() | currencyDisplay }}. Log it to keep your balance accurate.</p>
            </div>
          </div>
          <button class="btn btn--primary btn--sm" (click)="logMonthlyIncome()">
            <svg lucidePlus [size]="14"></svg> Log Income
          </button>
        </div>
      }

      <div class="grid grid--3">
        <!-- Today's Snapshot -->
        <div class="lily-card animate-fade-in-up stagger-1">
          <div class="lily-card__header">
            <span class="lily-card__title">Today</span>
            <span class="badge badge--info">Live</span>
          </div>
          <div class="lily-card__value">{{ store.todaysSpend() | currencyDisplay }}</div>
          <div class="snapshot-row">
            <div class="snapshot-item">
              <span class="text-xs text-tertiary">Yesterday</span>
              <span class="text-sm font-medium">{{ store.yesterdaysSpend() | currencyDisplay }}</span>
            </div>
            <div class="snapshot-item">
              <span class="text-xs text-tertiary">Daily Avg</span>
              <span class="text-sm font-medium">{{ store.dailyAverage() | currencyDisplay }}</span>
            </div>
          </div>
        </div>

        <!-- Spending Streak -->
        <div class="lily-card animate-fade-in-up stagger-2">
          <div class="lily-card__header">
            <span class="lily-card__title">Streak</span>
            <svg lucideFlame [size]="20" class="streak-fire"></svg>
          </div>
          <div class="lily-card__value">{{ store.budgetStreak() }}</div>
          <p class="text-sm text-tertiary">
            @if (store.budgetStreak() > 0) {
              Day{{ store.budgetStreak() > 1 ? 's' : '' }} under budget!
            } @else {
              Set a budget to start tracking
            }
          </p>
        </div>

        <!-- Smart Tip -->
        <div class="lily-card lily-card--gradient animate-fade-in-up stagger-3">
          <div class="lily-card__header">
            <span class="lily-card__title">Smart Tip</span>
            <svg lucideLightbulb [size]="18" style="color: var(--color-amber)"></svg>
          </div>
          @if (currentInsight(); as insight) {
            <p class="tip-text">{{ insight.text }}</p>
          } @else {
            <p class="tip-text text-tertiary">Add more transactions to unlock insights</p>
          }
        </div>
      </div>

      <!-- Budget Pulse -->
      @if (budgetPulseData().length > 0) {
        <div class="lily-card animate-fade-in-up stagger-4">
          <div class="lily-card__header">
            <span class="lily-card__title">Budget Pulse</span>
          </div>
          <div class="budget-pulse">
            @for (item of budgetPulseData(); track item.categoryId) {
              <div class="budget-pulse__item">
                <div class="budget-pulse__info">
                  <span class="budget-pulse__cat">
                    <lily-icon [name]="item.icon" [size]="14" /> {{ item.name }}
                  </span>
                  <span class="text-xs text-tertiary">{{ item.spent | currencyDisplay }} / {{ item.limit | currencyDisplay }}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-bar__fill" [class.over-budget]="item.pct > 100"
                       [style.width.%]="Math.min(item.pct, 100)"
                       [style.background]="item.pct >= 100 ? 'var(--color-rose)' : item.pct >= 80 ? 'var(--color-amber)' : 'var(--color-emerald)'"></div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Recent Transactions -->
      <div class="lily-card animate-fade-in-up stagger-5">
        <div class="lily-card__header">
          <span class="lily-card__title">Recent Transactions</span>
          <a routerLink="/transactions" class="text-sm" style="color: var(--color-violet-light)">View All</a>
        </div>
        @if (store.recentTransactions().length > 0) {
          <div class="txn-list">
            @for (txn of store.recentTransactions(); track txn.id) {
              <div class="txn-row">
                <div class="txn-row__icon" [style.background]="getCategoryColor(txn.categoryId)" [style.color]="getCategoryRawColor(txn.categoryId)">
                  <lily-icon [name]="getCategoryIcon(txn.categoryId)" [size]="18" />
                </div>
                <div class="txn-row__info">
                  <span class="txn-row__name">{{ getCategoryName(txn.categoryId) }}</span>
                  <span class="txn-row__note">{{ txn.note || 'No note' }}</span>
                </div>
                <div class="txn-row__amount" [class.txn-row__amount--income]="txn.type === 'income'" [class.txn-row__amount--expense]="txn.type === 'expense'">
                  {{ txn.type === 'income' ? '+' : '-' }}{{ txn.amount | currencyDisplay }}
                </div>
                <div class="txn-row__date">{{ txn.date | relativeDate }}</div>
                <button class="txn-row__delete" (click)="deleteTransaction(txn.id)" aria-label="Delete transaction">
                  <svg lucideX [size]="14"></svg>
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <span class="empty-state__icon"><svg lucideWallet [size]="40" style="opacity: 0.5"></svg></span>
            <p class="empty-state__title">No transactions yet</p>
            <p class="empty-state__description">Tap the + button to add your first expense</p>
          </div>
        }
      </div>

      <!-- Quick Add FAB -->
      <lily-quick-add />
    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: var(--space-6); }
    .hero-card {
      &__top { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-6); }
      &__balance-section { flex: 1; }
      &__label { font-size: var(--fs-sm); color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: var(--ls-wider); }
      &__amount { display: flex; align-items: baseline; gap: var(--space-1); margin-top: var(--space-2); }
      &__currency { font-size: var(--fs-2xl); color: var(--color-text-secondary); font-weight: var(--fw-semibold); }
      &__value { font-size: var(--fs-hero); font-weight: var(--fw-bold); font-variant-numeric: tabular-nums; font-family: var(--font-mono); background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      &__donut { width: 100px; height: 100px; flex-shrink: 0; }
      &__stats { display: flex; gap: var(--space-8); margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--color-border); flex-wrap: wrap; }
      &__stat { display: flex; align-items: center; gap: var(--space-2); }
      &__stat-label { font-size: var(--fs-sm); color: var(--color-text-secondary); }
      &__stat-value { font-size: var(--fs-sm); font-weight: var(--fw-semibold); font-variant-numeric: tabular-nums; }
    }
    .positive { color: var(--color-emerald); }
    .negative { color: var(--color-rose); }
    .income-prompt {
      display: flex; justify-content: space-between; align-items: center; gap: var(--space-4); flex-wrap: wrap;
      &__content { display: flex; align-items: center; gap: var(--space-3); }
      &__title { font-size: var(--fs-sm); font-weight: var(--fw-semibold); }
      &__desc { font-size: var(--fs-xs); color: var(--color-text-secondary); margin-top: 2px; }
    }
    .snapshot-row { display: flex; gap: var(--space-6); margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px solid var(--color-border); }
    .snapshot-item { display: flex; flex-direction: column; gap: 2px; }
    .streak-fire { color: var(--color-amber); animation: float 2s ease-in-out infinite; }
    .tip-text { font-size: var(--fs-base); color: var(--color-text-secondary); line-height: var(--lh-relaxed); margin-top: var(--space-2); }
    .budget-pulse { display: flex; flex-direction: column; gap: var(--space-4); }
    .budget-pulse__item { display: flex; flex-direction: column; gap: var(--space-2); }
    .budget-pulse__info { display: flex; justify-content: space-between; align-items: center; }
    .budget-pulse__cat { font-size: var(--fs-sm); font-weight: var(--fw-medium); display: inline-flex; align-items: center; gap: var(--space-2); }
    .progress-bar__fill.over-budget { animation: pulse 1.5s ease-in-out infinite; }
    .txn-list { display: flex; flex-direction: column; }
    .txn-row {
      display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) 0;
      border-bottom: 1px solid var(--color-border); position: relative;
      &:last-child { border-bottom: none; }
      &:hover .txn-row__delete { opacity: 1; }
    }
    .txn-row__icon {
      width: 40px; height: 40px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .txn-row__info { flex: 1; min-width: 0; }
    .txn-row__name { display: block; font-size: var(--fs-sm); font-weight: var(--fw-medium); }
    .txn-row__note { display: block; font-size: var(--fs-xs); color: var(--color-text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .txn-row__amount { font-size: var(--fs-sm); font-weight: var(--fw-semibold); font-variant-numeric: tabular-nums; white-space: nowrap;
      &--income { color: var(--color-emerald); }
      &--expense { color: var(--color-rose); }
    }
    .txn-row__date { font-size: var(--fs-xs); color: var(--color-text-tertiary); white-space: nowrap; min-width: 70px; text-align: right; }
    .txn-row__delete {
      opacity: 0; padding: var(--space-1); color: var(--color-text-tertiary); display: inline-flex;
      transition: opacity var(--duration-fast); border-radius: var(--radius-sm);
      &:hover { color: var(--color-rose); background: var(--color-rose-glow); }
    }
    @media (max-width: 768px) {
      .hero-card__value { font-size: var(--fs-4xl); }
      .hero-card__donut { width: 70px; height: 70px; }
      .txn-row__date { display: none; }
    }
  `],
})
export class DashboardComponent {
  store = inject(LilyStore);
  private analytics = inject(AnalyticsService);
  private toast = inject(ToastService);
  Math = Math;

  currentMonthLabel = computed(() => format(new Date(), 'MMMM yyyy'));

  donutData = computed<ChartData<'doughnut'>>(() => ({
    labels: ['Income', 'Expenses', 'Savings'],
    datasets: [{
      data: [
        this.store.totalIncome() || 1,
        this.store.totalExpenses() || 1,
        Math.max(0, this.store.totalIncome() - this.store.totalExpenses()) || 0,
      ],
      backgroundColor: ['#10b981', '#f43f5e', '#8b5cf6'],
      borderWidth: 0,
      cutout: '75%',
    }],
  }));

  donutOptions: ChartOptions<'doughnut'> = {
    responsive: true, maintainAspectRatio: true,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  currentInsight = computed(() => {
    const insights = this.analytics.generateInsights();
    return insights.length > 0 ? insights[0] : null;
  });

  budgetPulseData = computed(() => {
    const budget = this.store.currentBudget();
    if (!budget) return [];
    const catMap = this.store.categoryMap();
    const expByCat = this.store.expensesByCategory();

    return Object.entries(budget.categoryLimits)
      .map(([catId, limit]) => {
        const cat = catMap.get(catId);
        const spent = expByCat.get(catId) || 0;
        return {
          categoryId: catId,
          name: cat?.name || catId,
          icon: cat?.icon || 'package',
          limit, spent,
          pct: limit > 0 ? Math.round((spent / limit) * 100) : 0,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  });

  getCategoryIcon(id: string): string { return this.store.categoryMap().get(id)?.icon || 'package'; }
  getCategoryName(id: string): string { return this.store.categoryMap().get(id)?.name || 'Other'; }
  getCategoryColor(id: string): string { return (this.store.categoryMap().get(id)?.color || '#64748b') + '22'; }
  getCategoryRawColor(id: string): string { return this.store.categoryMap().get(id)?.color || '#64748b'; }

  deleteTransaction(id: string): void {
    this.store.deleteTransaction(id);
    this.toast.success('Transaction deleted');
  }

  logMonthlyIncome(): void {
    this.store.autoLogMonthlyIncome();
    this.toast.success('Monthly income logged');
  }
}
