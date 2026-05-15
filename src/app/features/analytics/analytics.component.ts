import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LilyStore } from '../../core/store/lily.store';
import { AnalyticsService } from '../../core/services/analytics.service';
import { CurrencyDisplayPipe } from '../../shared/pipes/currency-display.pipe';
import { LilyIconComponent } from '../../shared/icons/lily-icon.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { format, parseISO } from 'date-fns';
import { fadeIn, listAnimation } from '../../shared/animations';

@Component({
  selector: 'lily-analytics',
  standalone: true,
  imports: [BaseChartDirective, CurrencyDisplayPipe, LilyIconComponent, FormsModule],
  animations: [fadeIn, listAnimation],
  template: `
    <div class="analytics-page">
      <header class="page-header" [@fadeIn]>
        <div class="header-content">
          <h1 class="page-header__title">Financial Analytics</h1>
          <p class="page-header__subtitle">Deep dive into your spending habits</p>
        </div>
        <div class="header-actions">
          <div class="status-pill">
            <span class="status-pill__dot"></span>
            <span class="status-pill__text">Financial Insights Live</span>
          </div>
        </div>
      </header>

      <!-- Insights Section -->
      @if (insights().length > 0) {
        <div class="insights-section" [@listAnimation]="insights().length">
          <div class="insights-scroll custom-scrollbar">
            @for (insight of insights(); track insight.id) {
              <div class="insight-pill insight-pill--{{ insight.type }}">
                <div class="insight-pill__icon">
                  @if (insight.type === 'warning') { <lily-icon name="triangle-alert" [size]="14" /> }
                  @else if (insight.type === 'success') { <lily-icon name="circle-check" [size]="14" /> }
                  @else { <lily-icon name="info" [size]="14" /> }
                </div>
                <span class="insight-pill__text">{{ insight.text }}</span>
              </div>
            }
          </div>
        </div>
      }

      <div class="grid grid--4 analytics-grid" [@listAnimation]="6">
        <!-- Monthly Performance -->
        <div class="lily-card lily-card--glass chart-card span-2">
          <div class="chart-header">
            <div class="title-group">
              <h3 class="chart-title">Income vs Expenses</h3>
              <span class="chart-subtitle">Monthly flow performance</span>
            </div>
            <div class="chart-legend">
              <div class="legend-item"><span class="dot income"></span> Income</div>
              <div class="legend-item"><span class="dot expense"></span> Expenses</div>
            </div>
          </div>
          <div class="chart-container">
            <canvas baseChart [data]="monthlyBarData()" [options]="barOptions" type="bar"></canvas>
          </div>
        </div>

        <!-- Daily Trend -->
        <div class="lily-card lily-card--glass chart-card span-2">
          <div class="chart-header">
            <div class="title-group">
              <h3 class="chart-title">Spending Velocity</h3>
              <span class="chart-subtitle">30-day activity trend</span>
            </div>
          </div>
          <div class="chart-container">
            <canvas baseChart [data]="dailyLineData()" [options]="lineOptions" type="line"></canvas>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div class="lily-card lily-card--glass chart-card">
          <div class="chart-header">
            <div class="title-group">
              <h3 class="chart-title">By Category</h3>
              <span class="chart-subtitle">Distribution of funds</span>
            </div>
          </div>
          <div class="chart-container donut">
            <canvas baseChart [data]="categoryDonutData()" [options]="donutOptions" type="doughnut"></canvas>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="lily-card lily-card--glass chart-card">
          <div class="chart-header">
            <div class="title-group">
              <h3 class="chart-title">Payment Channels</h3>
              <span class="chart-subtitle">Where the money flows</span>
            </div>
          </div>
          <div class="chart-container donut">
            <canvas baseChart [data]="paymentPieData()" [options]="donutOptions" type="doughnut"></canvas>
          </div>
        </div>

        <!-- Weekday Habits -->
        <div class="lily-card lily-card--glass chart-card">
          <div class="chart-header">
            <div class="title-group">
              <h3 class="chart-title">Weekday Habits</h3>
              <span class="chart-subtitle">Average daily burn</span>
            </div>
          </div>
          <div class="chart-container">
            <canvas baseChart [data]="weekdayBarData()" [options]="weekdayOptions" type="bar"></canvas>
          </div>
        </div>

        <!-- Spending Intent -->
        <div class="lily-card lily-card--glass chart-card">
          <div class="chart-header">
            <div class="title-group">
              <h3 class="chart-title">Spending Intent</h3>
              <span class="chart-subtitle">Emotional spending split</span>
            </div>
          </div>
          <div class="chart-container donut">
            <canvas baseChart [data]="moodDonutData()" [options]="donutOptions" type="doughnut"></canvas>
          </div>
        </div>

        <!-- Recurring Patterns -->
        <div class="lily-card lily-card--glass chart-card span-2">
          <div class="chart-header">
            <div class="title-group">
              <h3 class="chart-title">Recurring Bills</h3>
              <span class="chart-subtitle">Detected payment cycles</span>
            </div>
          </div>
          <div class="patterns-list custom-scrollbar">
            @for (pat of recurringPatterns(); track pat.note) {
              <div class="pattern-item">
                <div class="pattern-item__icon" [style.color]="getCatRawColor(pat.categoryId)">
                  <lily-icon [name]="getCatIcon(pat.categoryId)" [size]="20" />
                </div>
                <div class="pattern-item__content">
                  <div class="name">{{ pat.note }}</div>
                  <div class="meta">{{ pat.frequency }} • Next: {{ pat.nextExpected }}</div>
                </div>
                <div class="pattern-item__amount">{{ pat.avgAmount | currencyDisplay }}</div>
              </div>
            } @empty {
              <div class="empty-list">No recurring patterns detected yet</div>
            }
          </div>
        </div>

        <!-- Correlations -->
        <div class="lily-card lily-card--glass chart-card span-2">
          <div class="chart-header">
            <div class="title-group">
              <h3 class="chart-title">Correlations</h3>
              <span class="chart-subtitle">Connected spending habits</span>
            </div>
          </div>
          <div class="correlations-list">
            @for (cor of correlations(); track cor.catA + cor.catB) {
              <div class="cor-item">
                <div class="cor-item__cats">
                  <span class="cat">{{ getCatName(cor.catA) }}</span>
                  <lily-icon name="arrow-right-left" [size]="12" />
                  <span class="cat">{{ getCatName(cor.catB) }}</span>
                </div>
                <div class="cor-item__val">
                  <div class="bar" [style.width.%]="Math.abs(cor.correlation) * 100" [class.negative]="cor.correlation < 0"></div>
                  <span class="label">{{ Math.round(cor.correlation * 100) }}%</span>
                </div>
              </div>
            } @empty {
              <div class="empty-list">Data needed for category correlation</div>
            }
          </div>
        </div>

        <!-- What-If Simulator -->
        <div class="lily-card lily-card--glass sim-card span-4">
          <div class="chart-header">
            <div class="title-group">
              <h3 class="chart-title">What-If Simulator</h3>
              <p class="chart-subtitle">Project annual impact of spending changes</p>
            </div>
          </div>
          
          <div class="sim-grid">
            <div class="sim-controls">
              <div class="form-group">
                <label class="form-label">Select Category</label>
                <select class="select" [(ngModel)]="simCatId">
                  @for (cat of store.categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Reduction Goal: {{ simReduction }}%</label>
                <input type="range" class="range-input" min="0" max="100" step="5" [(ngModel)]="simReduction">
              </div>

              @if (simulation(); as sim) {
                <div class="sim-results">
                  <div class="sim-stat">
                    <span class="label">Monthly Impact</span>
                    <span class="value success">+{{ (sim.newMonthlySavings - (store.totalIncome() - store.totalExpenses())) | currencyDisplay }}</span>
                  </div>
                  <div class="sim-stat highlight">
                    <span class="label">Annual Potential Savings</span>
                    <span class="value">{{ sim.annualImpact | currencyDisplay }}</span>
                  </div>
                  <p class="sim-desc">
                    Reducing <strong>{{ getCatName(simCatId) }}</strong> spend from {{ sim.currentCategorySpend | currencyDisplay }} to {{ sim.reducedCategorySpend | currencyDisplay }} could increase your annual net worth by {{ sim.annualImpact | currencyDisplay }}.
                  </p>
                </div>
              }
            </div>

            <div class="sim-preview-card">
              <div class="preview-icon">
                <lily-icon [name]="getCatIcon(simCatId)" [size]="48" />
              </div>
              <div class="preview-content">
                <span class="preview-label">Optimizing</span>
                <h4 class="preview-title">{{ getCatName(simCatId) }}</h4>
              </div>
            </div>
          </div>
        </div>

        <!-- Calendar Heatmap -->
        <div class="lily-card lily-card--glass chart-card span-4" [@fadeIn]>
          <div class="chart-header">
            <div class="title-group">
              <h3 class="chart-title">Activity Heatmap</h3>
              <div class="activity-summary">
                <strong>{{ totalActivityCount() }}</strong> activities tracked this year
              </div>
            </div>
            <div class="heatmap-analysis">
              <div class="analysis-item">
                <span class="label">Consistency</span>
                <span class="value">{{ heatmapInsights().consistency }}%</span>
              </div>
              <div class="analysis-item">
                <span class="label">Total Earned</span>
                <span class="value income">{{ heatmapInsights().totalIncome | currencyDisplay }}</span>
              </div>
              <div class="analysis-item">
                <span class="label">Net Flow</span>
                <span class="value" [class.income]="heatmapInsights().netFlow >= 0" [class.expense]="heatmapInsights().netFlow < 0">
                  {{ heatmapInsights().netFlow | currencyDisplay }}
                </span>
              </div>
            </div>
          </div>

          <div class="heatmap-container">
            <!-- Month Labels -->
            <div class="heatmap-months">
              @for (label of heatmapData().monthLabels; track label.index) {
                <div class="month-label" [style.left.%]="(label.index / totalWeeks()) * 100">{{ label.name }}</div>
              }
            </div>

            <div class="heatmap-body">
              <!-- Weekday Labels -->
              <div class="heatmap-weekdays">
                <span></span>
                <span>Mon</span>
                <span></span>
                <span>Wed</span>
                <span></span>
                <span>Fri</span>
                <span></span>
              </div>

              <!-- Heatmap Grid -->
              <div class="heatmap-grid-wrapper" (mouseleave)="activeHeatmapCell.set(null)">
                <div class="heatmap-grid">
                  @for (day of heatmapData().cells; track day.date) {
                    <div
                      class="heatmap__cell heatmap__cell--{{ day.level }}"
                      (mouseenter)="showTooltip($event, day)">
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="heatmap-footer">
              <a href="javascript:void(0)" class="help-link">Learn how we count activities</a>
              <div class="heatmap-legend">
                <span class="legend-label">Less</span>
                <div class="legend-cells">
                  <div class="legend-cell level-0"></div>
                  <div class="legend-cell level-1"></div>
                  <div class="legend-cell level-2"></div>
                  <div class="legend-cell level-3"></div>
                  <div class="legend-cell level-4"></div>
                </div>
                <span class="legend-label">More</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- FIX 1: Tooltip rendered at root level, uses position:fixed — escapes all card overflow -->
    @if (activeHeatmapCell(); as cell) {
      <div class="heatmap-tooltip"
           [style.left.px]="tooltipPos().x"
           [style.top.px]="tooltipPos().y">
        <div class="tooltip-content">
          <div class="tooltip-date">{{ formatTooltipDate(cell.date) }}</div>
          @if (cell.totalActivity > 0) {
            <div class="tooltip-stats">
              <div class="stat-line">
                <lily-icon name="arrow-up-right" [size]="10" class="income" />
                <span class="label">Income:</span>
                <span class="value income">{{ cell.income | currencyDisplay }}</span>
              </div>
              <div class="stat-line">
                <lily-icon name="arrow-down-right" [size]="10" class="expense" />
                <span class="label">Spent:</span>
                <span class="value expense">{{ cell.expenses | currencyDisplay }}</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-line total">
                <span class="label">{{ cell.totalActivity }} Transactions</span>
              </div>
            </div>
          } @else {
            <div class="tooltip-empty">No activity recorded</div>
          }
        </div>
        <div class="tooltip-arrow"></div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .analytics-page {
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
      padding-bottom: var(--space-20);
    }

    /* ─── Page Header ─── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;

      .page-header__title {
        font-size: 32px;
        font-weight: 900;
        letter-spacing: -0.04em;
        color: var(--color-text-primary);
        margin: 0;
      }

      .page-header__subtitle {
        font-size: var(--fs-base);
        color: var(--color-text-tertiary);
        font-weight: 500;
      }

      .status-pill {
        display: flex; 
        align-items: center; 
        gap: 10px; 
        background: var(--color-bg-secondary); 
        padding: 8px 16px; 
        border-radius: var(--radius-full); 
        border: 1px solid var(--color-border);

        &__dot { 
          width: 8px; 
          height: 8px; 
          border-radius: 50%; 
          background: var(--color-emerald); 
          position: relative;
          
          &::after { 
            content: ''; 
            position: absolute; 
            inset: -4px; 
            border-radius: 50%; 
            border: 2px solid var(--color-emerald); 
            opacity: 0.4; 
            animation: ripple 2s infinite; 
          }
        }
        
        &__text { 
          font-size: 11px; 
          font-weight: 800; 
          color: var(--color-text-secondary); 
          text-transform: uppercase; 
          letter-spacing: 0.05em; 
        }
      }
    }

    @keyframes ripple { 
      0% { transform: scale(1); opacity: 0.4; } 
      100% { transform: scale(2.5); opacity: 0; } 
    }

    /* ─── Insights Section ─── */
    .insights-section {
      .insights-scroll {
        display: flex;
        gap: var(--space-4);
        overflow-x: auto;
        padding: var(--space-1) 0 var(--space-3);
        
        &::-webkit-scrollbar { height: 4px; }
      }
    }

    .insight-pill {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 10px 20px;
      border-radius: var(--radius-2xl);
      background: var(--color-bg-card);
      backdrop-filter: blur(10px);
      border: 1px solid var(--color-bg-glass-border);
      white-space: nowrap;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
      transition: all var(--duration-normal) var(--ease-out);

      &:hover {
        transform: translateY(-2px);
        border-color: var(--color-violet-alpha);
        box-shadow: var(--shadow-glass);
      }

      &__icon {
        width: 28px;
        height: 28px;
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-bg-secondary);
      }

      &__text {
        font-size: var(--fs-sm);
        font-weight: 600;
        color: var(--color-text-primary);
      }

      &--warning {
        border-color: rgba(245, 158, 11, 0.3);
        .insight-pill__icon { color: var(--color-amber); background: rgba(245, 158, 11, 0.1); }
      }
      &--success {
        border-color: rgba(16, 185, 129, 0.3);
        .insight-pill__icon { color: var(--color-emerald); background: rgba(16, 185, 129, 0.1); }
      }
      &--danger {
        border-color: rgba(244, 63, 94, 0.3);
        .insight-pill__icon { color: var(--color-rose); background: rgba(244, 63, 94, 0.1); }
      }
    }

    /* ─── Analytics Grid ─── */
    .analytics-grid {
      .span-2 { grid-column: span 2; }
      .span-4 { grid-column: span 4; }

      @media (max-width: 1024px) {
        .span-2 { grid-column: span 1; }
        .span-4 { grid-column: 1 / -1; }
      }

      @media (max-width: 768px) {
        .span-2, .span-4 { grid-column: span 1; }
      }
    }

    .chart-card {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      min-height: 320px;
      overflow: visible;

      .patterns-list,
      .correlations-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        flex: 1;
        overflow-y: auto;
      }

      .pattern-item {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-3);
        background: rgba(255,255,255,0.03);
        border-radius: var(--radius-xl);
        border: 1px solid rgba(255,255,255,0.05);

        &__icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.2);
        }

        &__content {
          flex: 1;
          .name { font-size: var(--fs-sm); font-weight: 700; color: var(--color-text-primary); }
          .meta { font-size: 10px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; margin-top: 2px; }
        }

        &__amount { font-family: var(--font-mono); font-weight: 700; color: var(--color-text-primary); }
      }

      .cor-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        padding: var(--space-3);

        &__cats {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-secondary);
          .cat { background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; }
        }

        &__val {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          .bar { height: 4px; border-radius: var(--radius-full); background: var(--color-violet); }
          .label { font-size: 10px; font-weight: 800; color: var(--color-text-tertiary); min-width: 32px; }
        }
      }

      .empty-list {
        padding: var(--space-10);
        text-align: center;
        font-size: var(--fs-sm);
        color: var(--color-text-muted);
        opacity: 0.6;
      }

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-4);

        .title-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
      }

      .chart-title {
        font-size: var(--fs-xl);
        font-weight: 700;
        color: var(--color-text-primary);
        letter-spacing: -0.02em;
      }

      .chart-subtitle {
        font-size: var(--fs-sm);
        color: var(--color-text-muted);
        font-weight: 500;
      }

      .chart-legend {
        display: flex;
        gap: var(--space-4);

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;

          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            &.income  { background: var(--color-emerald); }
            &.expense { background: var(--color-rose); }
          }
        }
      }

      .chart-container {
        flex: 1;
        min-height: 240px;
        position: relative;

        &.donut {
          min-height: 300px;
          max-width: 360px;
          margin: 0 auto;
          width: 100%;
        }
      }
    }

    /* ─── Simulation Card ─── */
    .sim-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: var(--space-12);
      align-items: center;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
        gap: var(--space-8);
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-4);

      .form-label {
        font-size: 11px;
        font-weight: 800;
        color: var(--color-text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .range-input {
      width: 100%;
      height: 6px;
      background: var(--color-bg-input);
      border-radius: var(--radius-full);
      appearance: none;
      outline: none;

      &::-webkit-slider-thumb {
        appearance: none;
        width: 18px;
        height: 18px;
        background: var(--color-violet);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        transition: transform 0.2s;
      }

      &::-webkit-slider-thumb:hover { transform: scale(1.2); }
    }

    .sim-results {
      margin-top: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-6);
      background: rgba(255, 255, 255, 0.03);
      border-radius: var(--radius-2xl);
      border: 1px solid var(--color-border);

      .sim-stat {
        display: flex;
        justify-content: space-between;
        align-items: baseline;

        .label { font-size: var(--fs-xs); color: var(--color-text-tertiary); font-weight: 700; text-transform: uppercase; }
        .value { font-size: var(--fs-xl); font-weight: 800; color: var(--color-text-primary); }
        .value.success { color: var(--color-emerald); }
        
        &.highlight {
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border);
          .value { font-size: var(--fs-2xl); color: var(--color-violet-light); }
        }
      }

      .sim-desc {
        font-size: var(--fs-sm);
        color: var(--color-text-secondary);
        line-height: 1.6;
        margin: 0;
        opacity: 0.8;
      }
    }

    .sim-preview-card {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: var(--radius-2xl);
      padding: var(--space-8);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-6);
      text-align: center;
      min-height: 300px;
      justify-content: center;

      .preview-icon {
        width: 100px;
        height: 100px;
        border-radius: 30px;
        background: rgba(255, 255, 255, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-violet-light);
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      }

      .preview-label { font-size: 11px; font-weight: 900; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.1em; }
      .preview-title { font-size: var(--fs-3xl); font-weight: 900; color: white; margin: 0; }
    }

    .glass-select {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 0 12px;

      select {
        width: 100%;
        height: 48px;
        background: transparent;
        border: none;
        color: var(--color-text-primary);
        font-size: 14px;
        font-weight: 700;
        outline: none;
      }
    }

    /* ─── Heatmap Card ─── */
    .activity-summary {
      font-size: var(--fs-sm);
      font-weight: 500;
      color: var(--color-text-secondary);
      margin-top: 2px;
      strong { color: var(--color-violet-light); }
    }

    /* FIX 3: flex-shrink:0 + white-space:nowrap prevents label+value concatenation */
    .heatmap-analysis {
      display: flex;
      gap: var(--space-8);
      padding: var(--space-3) var(--space-6);
      background: rgba(255,255,255,0.03);
      border-radius: var(--radius-xl);
      border: 1px solid rgba(255,255,255,0.05);
      flex-shrink: 0;

      .analysis-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 80px;

        .label {
          font-size: 9px;
          font-weight: 800;
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .value {
          font-size: 14px;
          font-weight: 800;
          color: var(--color-text-primary);
          white-space: nowrap;

          &.income  { color: var(--color-emerald); }
          &.expense { color: var(--color-rose); }
        }
      }

      @media (max-width: 768px) {
        flex-wrap: wrap;
        gap: var(--space-4);
      }
    }

    .heatmap-container {
      display: flex;
      flex-direction: column;
      gap: 0;
      width: 100%;
      overflow-x: auto;
      padding: var(--space-3) 0;

      &::-webkit-scrollbar { height: 6px; }
      &::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
      &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    }

    .heatmap-months {
      display: flex;
      margin-left: 36px;
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-tertiary);
      margin-bottom: 6px;
      height: 16px;
      position: relative;
      overflow: hidden;

      .month-label {
        position: absolute;
        white-space: nowrap;
      }
    }

    .heatmap-body {
      display: flex;
      gap: 4px;
      width: 100%;
    }

    .heatmap-weekdays {
      display: grid;
      grid-template-rows: repeat(7, 1fr);
      gap: 3px;
      font-size: 10px;
      font-weight: 600;
      color: var(--color-text-tertiary);
      width: 30px;
      flex-shrink: 0;
      text-align: right;
      padding-right: 6px;

      span {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        font-size: 10px;
        line-height: 1;
      }
    }

    .heatmap-grid-wrapper {
      flex: 1;
      min-width: 0;
      cursor: crosshair;
      overflow: hidden;
    }

    .heatmap-grid {
      display: grid;
      grid-template-rows: repeat(7, 1fr);
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      gap: 3px;
      width: 100%;
      aspect-ratio: auto;
    }

    .heatmap__cell {
      aspect-ratio: 1;
      width: 100%;
      border-radius: 3px;
      transition: transform 80ms ease, outline 80ms ease;

      &--0 { background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.08); }
      &--1 { background: rgba(139, 92, 246, 0.20); }
      &--2 { background: rgba(139, 92, 246, 0.45); }
      &--3 { background: rgba(139, 92, 246, 0.70); }
      &--4 {
        background: #8b5cf6;
        box-shadow: 0 0 8px rgba(139, 92, 246, 0.3);
      }

      &:hover {
        transform: scale(1.6);
        z-index: 10;
        outline: 2px solid rgba(255,255,255,0.5);
        outline-offset: 1px;
      }
    }

    .heatmap-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: var(--space-4);
      padding-left: 36px;

      .help-link {
        font-size: 11px;
        color: var(--color-text-muted);
        text-decoration: none;
        font-weight: 600;
        &:hover { color: var(--color-text-secondary); text-decoration: underline; }
      }
    }

    .heatmap-legend {
      display: flex;
      align-items: center;
      gap: 6px;

      .legend-label {
        font-size: 10px;
        font-weight: 600;
        color: var(--color-text-tertiary);
      }

      .legend-cells { display: flex; gap: 3px; }

      .legend-cell {
        width: 12px;
        height: 12px;
        border-radius: 2px;

        &.level-0 { background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.08); }
        &.level-1 { background: rgba(139, 92, 246, 0.20); }
        &.level-2 { background: rgba(139, 92, 246, 0.45); }
        &.level-3 { background: rgba(139, 92, 246, 0.70); }
        &.level-4 { background: #8b5cf6; }
      }
    }


    /* ─── FIX 1: Global tooltip — position:fixed, escapes all card/layout overflow ─── */
    .heatmap-tooltip {
      position: fixed;                              /* FIX 1: was absolute */
      pointer-events: none;
      z-index: 9999;                                /* FIX 1: above everything */
      transform: translate(-50%, calc(-100% - 12px)); /* FIX 1: offset above cursor */
      transition: none;                             /* FIX 1: no lag on fast mouse move */
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));

      .tooltip-content {
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 12px;
        border-radius: 12px;
        min-width: 160px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
      }

      .tooltip-date {
        font-size: 11px;
        font-weight: 700;
        color: var(--color-text-primary);
        padding-bottom: 4px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }

      .tooltip-stats {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .stat-line {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;

          .label { color: var(--color-text-muted); flex: 1; }
          .value { font-family: var(--font-mono); font-weight: 700; }

          &.total {
            font-size: 10px;
            color: var(--color-text-tertiary);
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }

          .income { color: var(--color-emerald); }
          .expense { color: var(--color-rose); }
        }

        .stat-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 2px 0;
        }
      }

      .tooltip-arrow {
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid rgba(15, 23, 42, 0.9);
      }

      .tooltip-empty {
        font-size: 12px;
        font-weight: 600;
        color: var(--color-text-secondary);
        padding: 4px 0;
      }
    }

    /* ─── Responsive ─── */
    @media (max-width: 768px) {
      .chart-card {
        padding: var(--space-5);
        min-height: auto;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);

        .page-header__title { font-size: var(--fs-2xl); }
      }
    }
  `],
})
export class AnalyticsComponent {
  public store    = inject(LilyStore);
  public analytics = inject(AnalyticsService);
  protected Math  = Math;

  activeHeatmapCell = signal<any | null>(null);
  tooltipPos        = signal({ x: 0, y: 0 });

  insights           = computed(() => this.analytics.generateInsights());
  heatmapData        = computed(() => this.analytics.getCalendarHeatmapData(12));
  totalActivityCount = computed(() => this.heatmapData().cells.reduce((s, c) => s + c.totalActivity, 0));
  totalWeeks         = computed(() => Math.ceil(this.heatmapData().cells.length / 7));

  heatmapInsights = computed(() => {
    const data          = this.heatmapData().cells;
    const totalDays     = data.length;
    const activeDays    = data.filter(c => c.totalActivity > 0).length;
    const consistency   = (activeDays / totalDays) * 100;
    const totalIncome   = data.reduce((s, c) => s + (c.income   || 0), 0);
    const totalExpenses = data.reduce((s, c) => s + (c.expenses || 0), 0);

    return {
      consistency: consistency.toFixed(1),
      totalIncome,
      totalExpenses,
      netFlow: totalIncome - totalExpenses,
    };
  });

  // FIX 1: use clientX/clientY so coords are viewport-relative (matches position:fixed)
  showTooltip(event: MouseEvent, day: any) {
    this.tooltipPos.set({ x: event.clientX, y: event.clientY });
    this.activeHeatmapCell.set(day);
  }

  formatTooltipDate(dateStr: string): string {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  }

  private chartColors = {
    income:  '#10b981',
    expense: '#f43f5e',
    violet:  '#8b5cf6',
    amber:   '#f59e0b',
    sky:     '#0ea5e9',
    pink:    '#ec4899',
    teal:    '#14b8a6',
    orange:  '#f97316',
    border:  'rgba(255, 255, 255, 0.05)',
    grid:    'rgba(255, 255, 255, 0.03)',
    text:    '#94a3b8',
  };

  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: this.chartColors.text, font: { size: 10, weight: 'bold' } },
      },
      y: {
        grid: { color: this.chartColors.grid },
        ticks: { color: this.chartColors.text, font: { size: 10 } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 13, weight: 'bold' },
        bodyFont:  { size: 12 },
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
      },
    },
  };

  lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: this.chartColors.text, font: { size: 9 }, maxTicksLimit: 10 },
      },
      y: {
        grid: { color: this.chartColors.grid },
        ticks: { color: this.chartColors.text, font: { size: 10 } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, cornerRadius: 12 },
    },
    elements: {
      point: { radius: 0, hoverRadius: 6, hoverBackgroundColor: this.chartColors.violet },
      line:  { tension: 0.4, borderWidth: 3 },
    },
  };

  donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: this.chartColors.text,
          boxWidth: 8,
          usePointStyle: true,
          font: { size: 11, weight: 'bold' },
          padding: 20,
        },
      },
      tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, cornerRadius: 12 },
    },
  };

  weekdayOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: this.chartColors.text, font: { size: 10, weight: 'bold' } },
      },
      y: {
        grid: { color: this.chartColors.grid },
        ticks: { display: false },
      },
    },
    plugins: { legend: { display: false } },
  };

  monthlyBarData = computed<ChartData<'bar'>>(() => {
    const data = this.analytics.getMonthlyTotals(6);
    return {
      labels: data.map(d => format(parseISO(d.month + '-01'), 'MMM')),
      datasets: [
        { data: data.map(d => d.income),   label: 'Income',   backgroundColor: this.chartColors.income  + 'cc', borderRadius: 6 },
        { data: data.map(d => d.expenses), label: 'Expenses', backgroundColor: this.chartColors.expense + 'cc', borderRadius: 6 },
      ],
    };
  });

  categoryDonutData = computed<ChartData<'doughnut'>>(() => {
    const expByCat = this.store.expensesByCategory();
    const cats     = this.store.categories();
    const entries  = [...expByCat.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map(([id]) => cats.find(c => c.id === id)?.name || id),
      datasets: [{
        data:            entries.map(([, v]) => v),
        backgroundColor: entries.map(([id]) => (cats.find(c => c.id === id)?.color || '#64748b') + 'cc'),
        borderWidth: 0,
        cutout: '60%',
      }],
    };
  });

  dailyLineData = computed<ChartData<'line'>>(() => {
    const daily   = this.analytics.getDailySpendLast30Days();
    const amounts = daily.map(d => d.amount);
    const ma      = this.analytics.calculateMovingAverage(amounts, 7);
    return {
      labels: daily.map(d => format(parseISO(d.date), 'dd')),
      datasets: [
        { data: amounts, label: 'Daily',    borderColor: this.chartColors.violet, backgroundColor: this.chartColors.violet + '20', fill: true, borderWidth: 2 },
        { data: [...new Array(6).fill(null), ...ma], label: '7-Day Avg', borderColor: this.chartColors.amber, borderDash: [5, 5], borderWidth: 2, fill: false, pointRadius: 0 },
      ],
    };
  });

  weekdayBarData = computed<ChartData<'bar'>>(() => {
    const data = this.analytics.getWeekdayAverages();
    const max  = Math.max(...data.map(d => d.average));
    return {
      labels: data.map(d => d.day),
      datasets: [{
        data:            data.map(d => d.average),
        backgroundColor: data.map(d => d.average === max ? this.chartColors.expense + 'cc' : this.chartColors.violet + '88'),
        borderRadius: 8,
      }],
    };
  });

  paymentPieData = computed<ChartData<'doughnut'>>(() => {
    const data   = this.analytics.getPaymentMethodBreakdown();
    const colors = [this.chartColors.violet, this.chartColors.income, this.chartColors.amber, this.chartColors.sky, this.chartColors.pink];
    return {
      labels: data.map(d => d.method.toUpperCase()),
      datasets: [{
        data:            data.map(d => d.amount),
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 0,
        cutout: '40%',
      }],
    };
  });

  moodDonutData = computed<ChartData<'doughnut'>>(() => {
    const data        = this.analytics.getMoodBreakdown();
    const moodColors: Record<string, string>  = { need: this.chartColors.income, want: this.chartColors.amber, impulse: this.chartColors.expense };
    const moodLabels: Record<string, string>  = { need: 'Need', want: 'Want', impulse: 'Impulse' };
    return {
      labels: data.map(d => moodLabels[d.mood] || d.mood),
      datasets: [{
        data:            data.map(d => d.amount),
        backgroundColor: data.map(d => (moodColors[d.mood] || '#64748b') + 'cc'),
        borderWidth: 0,
        cutout: '55%',
      }],
    };
  });

  recurringPatterns = computed(() => this.analytics.detectRecurring());
  correlations      = computed(() => this.analytics.findCorrelatedCategories());

  simCatId    = 'food-dining';
  simReduction = 20;
  simulation  = computed(() => this.analytics.simulate(this.simCatId, this.simReduction));

  getCatName(id: string)     { return this.store.categories().find(c => c.id === id)?.name    || id; }
  getCatIcon(id: string)     { return this.store.categories().find(c => c.id === id)?.icon    || 'package'; }
  getCatRawColor(id: string) { return this.store.categories().find(c => c.id === id)?.color   || '#64748b'; }
}