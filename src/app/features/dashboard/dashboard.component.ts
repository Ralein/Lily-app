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
      <div class="page-header" anim="fadeIn">
        <div class="header-content">
          <h1 class="page-header__title">Overview</h1>
          <p class="page-header__subtitle">{{ currentMonthLabel() }}</p>
        </div>
        <div class="header-actions">
          <div class="status-pill">
            <span class="status-pill__dot"></span>
            <span class="status-pill__text">Financial Insights Live</span>
          </div>
        </div>
      </div>

      <!-- Premium Hero Balance Card -->
      <div class="hero-card" [class.glass]="true" anim="slideUp">
        <div class="hero-card__main">
          <div class="hero-card__content">
            <span class="hero-card__label">Total Portfolio Value</span>
            <div class="hero-card__balance">
              <span class="currency">{{ store.currencySymbol() }}</span>
              <span class="value" [lilyNumberAnimate]="store.balance()"></span>
            </div>
            
            <div class="hero-card__indicators">
              <div class="indicator income" anim="fadeIn" style="--anim-delay: 400ms">
                <div class="indicator__icon"><svg lucideArrowUpRight [size]="16"></svg></div>
                <div class="indicator__data">
                  <span class="label">Monthly Inflow</span>
                  <span class="value">{{ store.totalIncome() | currencyDisplay }}</span>
                </div>
              </div>
              <div class="indicator expense" anim="fadeIn" style="--anim-delay: 500ms">
                <div class="indicator__icon"><svg lucideArrowDownRight [size]="16"></svg></div>
                <div class="indicator__data">
                  <span class="label">Monthly Outflow</span>
                  <span class="value">{{ store.totalExpenses() | currencyDisplay }}</span>
                </div>
              </div>
            </div>
          </div>

          @if (store.hasData()) {
            <div class="hero-card__viz" anim="fadeIn" style="--anim-delay: 600ms">
              <div class="viz-container">
                <canvas baseChart [data]="donutData()" [options]="donutOptions" type="doughnut"></canvas>
                <div class="viz-center">
                  <span class="viz-value">{{ store.savingsRate() }}%</span>
                  <span class="viz-label">Saved</span>
                </div>
              </div>
            </div>
          }
        </div>
        
        <div class="hero-card__footer">
          <button class="btn-hero-action" (click)="logMonthlyIncome()" [disabled]="store.hasIncomeThisMonth()">
            <svg lucideWallet [size]="18"></svg>
            <span>Log Expected Income</span>
          </button>
        </div>
        <div class="hero-card__glow"></div>
      </div>

      <div class="stats-row">
        <!-- Snapshot Stats -->
        <div class="lily-card glass stat-card" anim="slideUp" style="--anim-delay: 200ms">
          <div class="stat-card__header">
            <div class="stat-card__icon today"><lily-icon name="clock" [size]="18" /></div>
            <span class="stat-card__title">Daily Burn</span>
          </div>
          <div class="stat-card__body">
            <div class="stat-card__value">{{ store.todaysSpend() | currencyDisplay }}</div>
            <div class="stat-card__trend" [class.positive]="store.todaysSpend() < store.yesterdaysSpend()">
               <lily-icon [name]="store.todaysSpend() < store.yesterdaysSpend() ? 'arrow-down' : 'arrow-up'" [size]="12" />
               Yesterday: {{ store.yesterdaysSpend() | currencyDisplay }}
            </div>
          </div>
        </div>

        <div class="lily-card glass stat-card" anim="slideUp" style="--anim-delay: 300ms">
          <div class="stat-card__header">
            <div class="stat-card__icon streak"><svg lucideFlame [size]="18"></svg></div>
            <span class="stat-card__title">Financial Streak</span>
          </div>
          <div class="stat-card__body">
            <div class="stat-card__value">{{ store.budgetStreak() }} Days</div>
            <div class="stat-card__trend positive">Consistency is key</div>
          </div>
        </div>

        <div class="lily-card glass stat-card stat-card--highlight" anim="slideUp" style="--anim-delay: 400ms">
          <div class="stat-card__header">
            <div class="stat-card__icon insight"><svg lucideLightbulb [size]="18"></svg></div>
            <span class="stat-card__title">Artificial Intelligence</span>
          </div>
          <div class="stat-card__body">
            @if (currentInsight(); as insight) {
              <p class="insight-preview">{{ insight.text }}</p>
            } @else {
              <p class="insight-preview muted">Patterns will emerge as you log activity.</p>
            }
          </div>
        </div>
      </div>

      <div class="content-split">
        <!-- Budget Pulse -->
        @if (budgetPulseData().length > 0) {
          <div class="lily-card glass pulse-card" anim="slideUp" style="--anim-delay: 500ms">
            <div class="card-header">
              <h3 class="card-title">Category Velocity</h3>
              <div class="pill-badge">{{ budgetPulseData().length }} tracked</div>
            </div>
            <div class="pulse-container">
              @for (item of budgetPulseData(); track item.categoryId) {
                <div class="pulse-item">
                  <div class="pulse-item__info">
                    <div class="pulse-item__label">
                      <div class="icon-orb" [style.background]="getCategoryRawColor(item.categoryId) + '20'" [style.color]="getCategoryRawColor(item.categoryId)">
                        <lily-icon [name]="item.icon" [size]="14" />
                      </div>
                      <span class="name">{{ item.name }}</span>
                    </div>
                    <div class="pulse-item__amounts">
                      <span class="spent">{{ item.spent | currencyDisplay }}</span>
                      <span class="separator">/</span>
                      <span class="limit">{{ item.limit | currencyDisplay }}</span>
                    </div>
                  </div>
                  <div class="pulse-item__progress">
                    <div class="track">
                      <div class="fill" 
                           [class.critical]="item.pct > 100"
                           [style.width.%]="Math.min(item.pct, 100)"
                           [style.background]="item.pct >= 100 ? 'var(--color-rose)' : item.pct >= 80 ? 'var(--color-amber)' : 'var(--color-violet)'">
                        <div class="fill-sheen"></div>
                      </div>
                    </div>
                    <span class="pct-val" [class.critical]="item.pct > 100">{{ item.pct }}%</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Recent Activity -->
        <div class="lily-card glass activity-card" anim="slideUp" style="--anim-delay: 600ms">
          <div class="card-header">
            <h3 class="card-title">Recent Transactions</h3>
            <a routerLink="/transactions" class="btn-link">
              <span>View History</span>
              <lily-icon name="arrow-right" [size]="14" />
            </a>
          </div>
          
          <div class="activity-feed">
            @for (txn of store.recentTransactions(); track txn.id) {
              <div class="txn-row">
                <div class="txn-row__visual" [style.background]="getCategoryColor(txn.categoryId)">
                  <lily-icon [name]="getCategoryIcon(txn.categoryId)" [size]="20" [style.color]="getCategoryRawColor(txn.categoryId)" />
                </div>
                <div class="txn-row__content">
                  <div class="main-info">
                    <span class="category">{{ getCategoryName(txn.categoryId) }}</span>
                    <span class="amount" [class.income]="txn.type === 'income'" [class.expense]="txn.type === 'expense'">
                      {{ txn.type === 'income' ? '+' : '-' }}{{ txn.amount | currencyDisplay }}
                    </span>
                  </div>
                  <div class="sub-info">
                    <span class="note">{{ txn.note || 'Internal Transfer' }}</span>
                    <span class="date">{{ txn.date | relativeDate }}</span>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-feed">
                <div class="empty-icon"><svg lucidePlus [size]="32"></svg></div>
                <p>Start your journey by adding a transaction.</p>
              </div>
            }
          </div>
        </div>
      </div>

      <lily-quick-add />
    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: var(--space-8); padding-bottom: var(--space-20); }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-end;
      .page-header__title { font-size: 32px; font-weight: 900; letter-spacing: -0.04em; color: var(--color-text-primary); margin: 0; }
      .page-header__subtitle { font-size: var(--fs-base); color: var(--color-text-tertiary); font-weight: 500; }
      
      .status-pill {
        display: flex; align-items: center; gap: 10px; background: var(--color-bg-secondary); padding: 8px 16px; border-radius: var(--radius-full); border: 1px solid var(--color-border);
        &__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-emerald); position: relative;
          &::after { content: ''; position: absolute; inset: -4px; border-radius: 50%; border: 2px solid var(--color-emerald); opacity: 0.4; animation: ripple 2s infinite; }
        }
        &__text { font-size: 11px; font-weight: 800; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
      }
    }

    .hero-card {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 32px; padding: var(--space-10); position: relative; overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2), inset 0 0 80px rgba(139, 92, 246, 0.1);

      &__main { display: flex; justify-content: space-between; align-items: center; gap: var(--space-8); position: relative; z-index: 2; }
      &__content { flex: 1; }
      &__label { font-size: 11px; font-weight: 900; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.2em; }
      
      &__balance { 
        display: flex; align-items: baseline; gap: var(--space-3); margin: var(--space-2) 0 var(--space-10); 
        .currency { font-size: 40px; color: var(--color-text-tertiary); font-weight: 600; }
        .value { font-size: 80px; font-weight: 900; letter-spacing: -0.05em; color: var(--color-text-primary); line-height: 1; }
      }

      &__indicators { display: flex; gap: var(--space-10); }
      .indicator {
        display: flex; align-items: center; gap: var(--space-4);
        &__icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); }
        &__data { display: flex; flex-direction: column; gap: 2px;
          .label { font-size: 10px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; }
          .value { font-size: var(--fs-lg); font-weight: 800; color: var(--color-text-primary); }
        }
        &.income .indicator__icon { color: var(--color-emerald); background: rgba(16, 185, 129, 0.15); box-shadow: 0 0 20px rgba(16, 185, 129, 0.1); }
        &.expense .indicator__icon { color: var(--color-rose); background: rgba(244, 63, 92, 0.15); box-shadow: 0 0 20px rgba(244, 63, 92, 0.1); }
      }

      &__viz { width: 180px; height: 180px; flex-shrink: 0; position: relative; }
      .viz-container { 
        position: relative; width: 100%; height: 100%; 
        .viz-center { 
          position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
          .viz-value { font-size: 28px; font-weight: 900; color: var(--color-text-primary); }
          .viz-label { font-size: 10px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; }
        }
      }

      &__footer {
        margin-top: var(--space-10); padding-top: var(--space-8); border-top: 1px solid rgba(255,255,255,0.08);
        display: flex; gap: var(--space-4); position: relative; z-index: 2;
        .btn-hero-action { 
          display: flex; align-items: center; gap: 10px; padding: 12px 24px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
          color: var(--color-text-secondary); font-size: var(--fs-sm); font-weight: 700; cursor: pointer; transition: all 0.3s;
          &:hover:not(:disabled) { background: white; color: black; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(255,255,255,0.1); }
          &:disabled { opacity: 0.3; cursor: default; }
        }
      }

      &__glow { position: absolute; top: -50%; right: -20%; width: 70%; height: 140%; background: radial-gradient(circle, var(--color-violet-glow) 0%, transparent 70%); opacity: 0.4; pointer-events: none; }
    }

    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); }
    .stat-card {
      padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4);
      &__header { display: flex; align-items: center; gap: var(--space-3); }
      &__icon { 
        width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
        &.today { background: rgba(14, 165, 233, 0.1); color: var(--color-sky); }
        &.streak { background: rgba(244, 63, 94, 0.1); color: var(--color-rose); }
        &.insight { background: rgba(245, 158, 11, 0.1); color: var(--color-amber); }
      }
      &__title { font-size: 11px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
      &__body {
        .stat-card__value { font-size: 28px; font-weight: 900; color: var(--color-text-primary); margin-bottom: 4px; }
        .stat-card__trend { 
          display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: var(--color-text-muted);
          &.positive { color: var(--color-emerald); }
        }
      }
      &--highlight { background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, transparent 100%); }
      .insight-preview { font-size: var(--fs-sm); line-height: 1.6; color: var(--color-text-secondary); margin: 0; font-weight: 500; }
    }

    .content-split { display: grid; grid-template-columns: 1fr 1.4fr; gap: var(--space-6); }
    
    .pulse-container { display: flex; flex-direction: column; gap: var(--space-6); }
    .pulse-item {
      &__info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
        .pulse-item__label { display: flex; align-items: center; gap: 12px;
          .icon-orb { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
          .name { font-size: var(--fs-base); font-weight: 700; color: var(--color-text-primary); }
        }
        .pulse-item__amounts { font-size: 12px; font-weight: 800; font-family: var(--font-mono); color: var(--color-text-tertiary);
          .spent { color: var(--color-text-secondary); }
          .separator { margin: 0 4px; opacity: 0.3; }
        }
      }
      &__progress { 
        display: flex; align-items: center; gap: var(--space-4);
        .track { flex: 1; height: 8px; background: rgba(255,255,255,0.05); border-radius: var(--radius-full); overflow: hidden; }
        .fill { height: 100%; border-radius: inherit; position: relative; transition: width 1.5s var(--ease-spring);
          .fill-sheen { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); animation: sheen 3s infinite; }
          &.critical { animation: alert-pulse 2s infinite; }
        }
        .pct-val { min-width: 36px; text-align: right; font-size: 12px; font-weight: 900; color: var(--color-text-tertiary);
          &.critical { color: var(--color-rose); }
        }
      }
    }

    .activity-feed { display: flex; flex-direction: column; gap: var(--space-2); max-height: 500px; overflow-y: auto; padding-right: var(--space-2); }
    .txn-row {
      display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); border-radius: 16px; transition: all 0.2s;
      &:hover { background: rgba(255,255,255,0.03); }
      &__visual { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      &__content { flex: 1; min-width: 0; 
        .main-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;
          .category { font-size: var(--fs-base); font-weight: 800; color: var(--color-text-primary); }
          .amount { font-size: var(--fs-base); font-weight: 900; font-family: var(--font-mono);
            &.income { color: var(--color-emerald); }
            &.expense { color: var(--color-text-primary); }
          }
        }
        .sub-info { display: flex; justify-content: space-between; align-items: center;
          .note { font-size: var(--fs-xs); color: var(--color-text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
          .date { font-size: 10px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; }
        }
      }
    }

    .btn-link { 
      display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 900; color: var(--color-violet-light); text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em;
      transition: all 0.2s; &:hover { color: white; transform: translateX(4px); }
    }

    .empty-feed { padding: var(--space-12) 0; display: flex; flex-direction: column; align-items: center; gap: var(--space-4); text-align: center; color: var(--color-text-tertiary); 
      .empty-icon { width: 64px; height: 64px; border-radius: 20px; background: var(--color-bg-input); display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); }
    }

    @keyframes ripple { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2.5); opacity: 0; } }
    @keyframes sheen { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
    @keyframes alert-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }

    @media (max-width: 1200px) {
      .hero-card__balance .value { font-size: 60px; }
    }

    @media (max-width: 1024px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .content-split { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .hero-card { padding: var(--space-6);
        &__main { flex-direction: column; align-items: flex-start; }
        &__balance .value { font-size: 48px; }
        &__indicators { gap: var(--space-6); flex-wrap: wrap; }
        &__viz { align-self: center; margin-top: var(--space-6); }
      }
      .stats-row { grid-template-columns: 1fr; }
    }
  `],

      <lily-quick-add />
    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: var(--space-8); padding-bottom: var(--space-12); }

    .page-header {
      &__meta { display: flex; align-items: center; gap: var(--space-3); margin-top: 4px; }
      &__subtitle { font-size: var(--fs-base); color: var(--color-text-secondary); margin: 0; }
      
      .badge--violet {
        display: flex; align-items: center; gap: 8px;
        .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-violet-light); animation: dot-pulse 2s infinite; }
      }
    }

    .hero-balance {
      background: var(--gradient-hero);
      border: 1px solid var(--color-bg-glass-border);
      border-radius: var(--radius-4xl);
      padding: var(--space-10);
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-glow-violet);

      &::before {
        content: ''; position: absolute; top: -50%; right: -20%; width: 70%; height: 140%;
        background: radial-gradient(circle, var(--color-violet-glow) 0%, transparent 70%);
        pointer-events: none; opacity: 0.6;
      }

      &__main { display: flex; justify-content: space-between; align-items: center; gap: var(--space-8); position: relative; z-index: 1; }
      &__info { flex: 1; }
      &__label { font-size: var(--fs-xs); font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 2px; }
      
      &__amount { 
        display: flex; align-items: baseline; gap: var(--space-2); margin: var(--space-2) 0 var(--space-8); 
        .currency { font-size: var(--fs-4xl); color: var(--color-text-secondary); font-weight: 500; }
        .value { font-size: 4.5rem; font-weight: 800; letter-spacing: -3px; color: var(--color-text-primary); line-height: 1; }
      }

      &__stats { display: flex; gap: var(--space-8); }
      .mini-stat {
        display: flex; align-items: center; gap: var(--space-3);
        .icon-box { width: 32px; height: 32px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); }
        .data { display: flex; flex-direction: column; 
          .label { font-size: 10px; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; }
          .val { font-size: var(--fs-base); font-weight: 700; color: var(--color-text-primary); }
        }
        &.income .icon-box { color: var(--color-emerald); background: var(--color-emerald-glow); }
        &.expense .icon-box { color: var(--color-rose); background: var(--color-rose-glow); }
      }

      &__viz { width: 160px; height: 160px; flex-shrink: 0; }
      .donut-wrapper { 
        position: relative; width: 100%; height: 100%; 
        .donut-content { 
          position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
          .pct { font-size: var(--fs-2xl); font-weight: 800; color: var(--color-text-primary); }
          .txt { font-size: 10px; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; }
        }
      }

      &__actions {
        margin-top: var(--space-8); padding-top: var(--space-6); border-top: 1px solid rgba(255,255,255,0.05);
        display: flex; gap: var(--space-4); position: relative; z-index: 1;
        .action-btn { 
          display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4);
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-xl);
          color: var(--color-text-secondary); font-size: var(--fs-sm); font-weight: 600; cursor: pointer; transition: all var(--duration-fast);
          &:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: var(--color-text-primary); border-color: var(--color-violet); }
          &:disabled { opacity: 0.5; cursor: default; }
        }
      }
    }

    .dashboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); }
    .glass-card {
      background: rgba(255,255,255,0.02); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.05);
      border-radius: var(--radius-3xl); padding: var(--space-6); transition: all var(--duration-fast);
      &:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); transform: translateY(-4px); }
    }

    .stat-item {
      display: flex; flex-direction: column; gap: var(--space-3);
      &__header { display: flex; align-items: center; gap: var(--space-3); }
      &__icon { 
        width: 36px; height: 36px; border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center;
        &.today { background: var(--color-sky-glow); color: var(--color-sky); }
        &.streak { background: var(--color-rose-glow); color: var(--color-rose); }
        &.tip { background: var(--color-amber-glow); color: var(--color-amber); }
      }
      &__title { font-size: var(--fs-xs); font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; }
      &__value { font-size: var(--fs-2xl); font-weight: 800; color: var(--color-text-primary); }
      &__trend { font-size: 11px; font-weight: 600; color: var(--color-text-muted);
        &.positive { color: var(--color-emerald); }
      }
      &--highlight { background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%); }
      .insight-text { font-size: var(--fs-sm); line-height: 1.6; color: var(--color-text-secondary); margin: 0; }
    }

    .secondary-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: var(--space-6); }
    
    .pulse-list { display: flex; flex-direction: column; gap: var(--space-5); }
    .pulse-row {
      &__info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
        .label { display: flex; align-items: center; gap: 10px; font-size: var(--fs-sm); font-weight: 700; color: var(--color-text-primary); }
        .amount { font-size: 11px; font-weight: 600; color: var(--color-text-tertiary); font-family: var(--font-mono); }
      }
      &__progress { display: flex; align-items: center; gap: var(--space-4);
        .bar-bg { flex: 1; height: 6px; background: rgba(255,255,255,0.05); border-radius: var(--radius-full); overflow: hidden; }
        .bar-fill { height: 100%; border-radius: var(--radius-full); position: relative; transition: width 1.2s var(--ease-spring);
          .bar-glow { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: shimmer 2s infinite; }
          &.over { animation: pulse-danger 2s infinite; }
        }
        .pct { min-width: 32px; text-align: right; font-size: 11px; font-weight: 800; color: var(--color-text-tertiary);
          &.over { color: var(--color-rose); }
        }
      }
    }

    .activity-card { display: flex; flex-direction: column; 
      .activity-scroll { display: flex; flex-direction: column; max-height: 400px; overflow-y: auto; padding-right: 4px; }
    }
    .activity-row {
      display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4) 0; border-bottom: 1px solid rgba(255,255,255,0.05);
      &:last-child { border-bottom: none; }
      &__icon { width: 44px; height: 44px; border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      &__body { flex: 1; min-width: 0; 
        .title { font-size: var(--fs-sm); font-weight: 700; color: var(--color-text-primary); margin-bottom: 2px; }
        .note { font-size: var(--fs-xs); color: var(--color-text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      }
      &__meta { text-align: right; 
        .amount { font-size: var(--fs-sm); font-weight: 800; font-family: var(--font-mono); margin-bottom: 2px;
          &.income { color: var(--color-emerald); }
          &.expense { color: var(--color-rose); }
        }
        .date { font-size: 10px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; }
      }
    }

    .view-all { font-size: 11px; font-weight: 800; color: var(--color-violet-light); text-decoration: none; text-transform: uppercase; letter-spacing: 1px; }
    .empty-activity { padding: var(--space-12) 0; display: flex; flex-direction: column; align-items: center; gap: var(--space-3); color: var(--color-text-tertiary); font-size: var(--fs-sm); }

    @keyframes dot-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.5; } }
    @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
    @keyframes pulse-danger { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

    @media (max-width: 1024px) {
      .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
      .secondary-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .dashboard { gap: var(--space-6); }
      .hero-balance { padding: var(--space-6);
        &__amount .value { font-size: 3rem; }
        &__stats { flex-direction: column; gap: var(--space-4); }
        &__viz { width: 120px; height: 120px; }
      }
      .dashboard-grid { grid-template-columns: 1fr; }
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
