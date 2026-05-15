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
      <div class="page-header" anim="fadeIn">
        <div class="header-content">
          <h1 class="page-header__title">Financial Analytics</h1>
          <p class="page-header__subtitle">Deep dive into your spending habits</p>
        </div>
        <div class="header-actions">
          <div class="pulse-badge">
            <span class="pulse-ring"></span>
            <span class="badge-text">Real-time Insights</span>
          </div>
        </div>
      </div>

      <!-- Insights Carousel -->
      @if (insights().length > 0) {
        <div class="insights-container" [@listAnimation]="insights().length">
          <div class="insights-scroll">
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

      <div class="analytics-grid grid grid--4" [@listAnimation]="6">
        <!-- Monthly Performance -->
        <div class="lily-card chart-card glass-card" style="grid-column: span 2">
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
        <div class="lily-card chart-card glass-card" style="grid-column: span 2">
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
        <div class="lily-card chart-card glass-card">
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
        <div class="lily-card chart-card glass-card">
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
        <div class="lily-card chart-card glass-card">
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
        <div class="lily-card chart-card glass-card">
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

        <!-- NEW: Recurring Patterns -->
        <div class="lily-card chart-card glass-card">
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

        <!-- NEW: Correlations -->
        <div class="lily-card chart-card glass-card">
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
      </div>

      <!-- NEW: What-If Simulation -->
      <div class="lily-card simulation-card glass-card" [@fadeIn]>
        <div class="chart-header">
          <div class="title-group">
            <h3 class="chart-title">What-If Simulator</h3>
            <span class="chart-subtitle">Project annual impact of spending changes</span>
          </div>
        </div>
        <div class="sim-grid">
          <div class="sim-controls">
            <div class="sim-control">
              <label>Select Category</label>
              <div class="glass-select">
                <select [(ngModel)]="simCatId">
                  @for (cat of store.categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="sim-control">
              <label>Reduction Goal: {{ simReduction }}%</label>
              <input type="range" min="0" max="100" step="5" [(ngModel)]="simReduction">
            </div>
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
              <div class="sim-desc">
                Reducing <strong>{{ getCatName(simCatId) }}</strong> spend from {{ sim.currentCategorySpend | currencyDisplay }} to {{ sim.reducedCategorySpend | currencyDisplay }} could increase your annual net worth by {{ sim.annualImpact | currencyDisplay }}.
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Calendar Heatmap -->
      <div class="lily-card heatmap-card glass-card" [@fadeIn]>
        <div class="chart-header">
          <div class="title-group">
            <h3 class="chart-title">Activity Heatmap</h3>
            <div class="activity-summary">
              <strong>{{ totalActivityCount() }}</strong> activities tracked this year
            </div>
          </div>
          <div class="heatmap-analysis" @fadeIn>
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
              <div class="month-label" [style.grid-column-start]="label.index + 1">{{ label.name }}</div>
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
                  <div class="heatmap__cell heatmap__cell--{{ day.level }}" 
                       (mouseenter)="showTooltip($event, day)">
                  </div>
                }

                <!-- Custom Tooltip -->
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
              </div>
            </div>
          </div>

          <div class="heatmap-footer">
            <a href="javascript:void(0)" class="help-link">Learn how we count activities</a>
            <div class="heatmap-legend">
              <span class="label">Less</span>
              <div class="legend-cells">
                <div class="heatmap__cell heatmap__cell--0"></div>
                <div class="heatmap__cell heatmap__cell--1"></div>
                <div class="heatmap__cell heatmap__cell--2"></div>
                <div class="heatmap__cell heatmap__cell--3"></div>
                <div class="heatmap__cell heatmap__cell--4"></div>
              </div>
              <span class="label">More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-page { 
      display: flex; 
      flex-direction: column; 
      gap: var(--space-8); 
      padding-bottom: var(--space-12); 
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: var(--space-2) 0;

      .page-header__title {
        font-size: 2.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-text-tertiary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.03em;
      }

      .page-header__subtitle {
        font-size: var(--fs-base);
        color: var(--color-text-muted);
        font-weight: 500;
        margin-top: var(--space-1);
      }
    }

    .pulse-badge {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-4);
      background: var(--color-bg-card);
      border: 1px solid var(--color-bg-glass-border);
      border-radius: var(--radius-full);
      box-shadow: var(--shadow-sm);

      .pulse-ring {
        width: 8px;
        height: 8px;
        background: var(--color-emerald);
        border-radius: 50%;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          inset: -4px;
          border: 2px solid var(--color-emerald);
          border-radius: 50%;
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          opacity: 0;
        }
      }

      .badge-text {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-secondary);
      }
    }

    @keyframes pulse-ring {
      0% { transform: scale(0.8); opacity: 0.5; }
      100% { transform: scale(2); opacity: 0; }
    }

    .insights-container { 
      margin: 0 calc(var(--space-4) * -1); 
      .insights-scroll { 
        display: flex; 
        gap: var(--space-4); 
        overflow-x: auto; 
        padding: var(--space-2) var(--space-4); 
        scrollbar-width: none; 
        &::-webkit-scrollbar { display: none; } 
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

    .analytics-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); 
      gap: var(--space-8); 
    }

    .glass-card {
      background: var(--color-bg-card);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--color-bg-glass-border);
      box-shadow: var(--shadow-glass);
      transition: transform var(--duration-normal) var(--ease-out), border-color var(--duration-normal) var(--ease-out);

      &:hover {
        border-color: var(--color-bg-glass-border-hover);
        transform: translateY(-4px);
      }
    }

    .chart-card {
      padding: var(--space-8); 
      display: flex; 
      flex-direction: column; 
      gap: var(--space-8); 
      min-height: 400px;

      .patterns-list, .correlations-list {
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

        &__icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); }
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

      .empty-list { padding: var(--space-10); text-align: center; font-size: var(--fs-sm); color: var(--color-text-muted); opacity: 0.6; }

      .chart-header { 
        display: flex; 
        justify-content: space-between;
        align-items: flex-start;
        
        .title-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      }

      .chart-title { 
        font-size: var(--fs-xl); 
        font-weight: 700; 
        color: var(--color-text-primary); 
        letter-spacing: -0.02em;
      }

      .activity-summary {
        font-size: var(--fs-sm);
        font-weight: 500;
        color: var(--color-text-secondary);
        margin-top: 2px;
        strong { color: var(--color-violet-light); }
      }

      .heatmap-analysis {
        display: flex;
        gap: var(--space-8);
        padding: var(--space-3) var(--space-6);
        background: rgba(255,255,255,0.03);
        border-radius: var(--radius-xl);
        border: 1px solid rgba(255,255,255,0.05);

        .analysis-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          
          .label { font-size: 9px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
          .value { 
            font-size: 14px; 
            font-weight: 800; 
            color: var(--color-text-primary); 
            
            &.income { color: var(--color-emerald); }
            &.expense { color: var(--color-rose); }
          }
        }
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
            &.income { background: var(--color-emerald); }
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

    .simulation-card {
      padding: var(--space-8);
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
      
      .sim-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-12);
        align-items: center;
      }
      
      .sim-controls {
        display: flex;
        flex-direction: column;
        gap: var(--space-8);
        
        .sim-control {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          label { font-size: 10px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 1px; }
          
          input[type="range"] {
            width: 100%;
            accent-color: var(--color-violet);
          }
        }
      }
      
      .sim-results {
        background: rgba(0,0,0,0.2);
        padding: var(--space-8);
        border-radius: var(--radius-2xl);
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
        border: 1px solid rgba(255,255,255,0.05);
        
        .sim-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
          .label { font-size: 11px; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; }
          .value { font-size: 24px; font-weight: 900; color: var(--color-text-primary); }
          .value.success { color: var(--color-emerald); }
          
          &.highlight {
            padding: var(--space-4);
            background: var(--color-violet-glow);
            border-radius: var(--radius-xl);
            .value { font-size: 32px; color: var(--color-violet-light); }
          }
        }
        
      .ghost-btn {
        background: transparent;
        border: none;
        color: var(--color-text-muted);
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: all var(--duration-fast);
        
        &:hover {
          background: rgba(255,255,255,0.05);
          color: var(--color-text-secondary);
        }
      }

      .sim-desc {
        font-size: var(--fs-sm);
        line-height: 1.6;
        color: var(--color-text-secondary);
        strong { color: var(--color-text-primary); }
      }
      }
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

    .heatmap-card {
      padding: var(--space-8); 
      display: flex; 
      flex-direction: column; 
      gap: var(--space-8);

      .heatmap-container {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        max-width: 100%;
        overflow-x: auto;
        padding: var(--space-2) 0;
        
        &::-webkit-scrollbar { height: 6px; }
        &::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      }

      .heatmap-months {
        display: grid;
        grid-auto-columns: 16px;
        column-gap: 6px;
        margin-left: 32px;
        font-size: 10px;
        font-weight: 700;
        color: var(--color-text-tertiary);
        margin-bottom: 4px;
        height: 14px;
        position: relative;
        
        .month-label {
          grid-row: 1;
          white-space: nowrap;
        }
      }

      .heatmap-body {
        display: flex;
        gap: 8px;
      }

      .heatmap-weekdays {
        display: grid;
        grid-template-rows: repeat(7, 1fr);
        gap: 6px;
        font-size: 10px;
        font-weight: 700;
        color: var(--color-text-tertiary);
        width: 24px;
        text-align: left;
        
        span { height: 16px; display: flex; align-items: center; }
      }

      .heatmap-grid-wrapper {
        flex: 1;
        margin-top: var(--space-4);
        padding-bottom: 12px;
        cursor: crosshair;
      }

      .heatmap-grid { 
        display: grid; 
        grid-template-rows: repeat(7, 1fr); 
        grid-auto-flow: column; 
        gap: 6px; 
        width: max-content;
        position: relative;
      }

      .heatmap__cell { 
        width: 16px; 
        height: 16px; 
        border-radius: 3px; 
        background: rgba(255,255,255,0.03); 
        transition: all var(--duration-fast) var(--ease-out);
        border: 1px solid rgba(255,255,255,0.05);

        &--1 { background: #2e1065; border-color: transparent; }
        &--2 { background: #4c1d95; border-color: transparent; }
        &--3 { background: #7c3aed; border-color: transparent; }
        &--4 { 
          background: #a78bfa; 
          box-shadow: 0 0 12px rgba(167, 139, 250, 0.3); 
          border-color: transparent;
        }

        &:hover { 
          transform: scale(1.3); 
          z-index: 10; 
          border-color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
      }

      .heatmap-tooltip {
        position: absolute;
        pointer-events: none;
        z-index: 100;
        transform: translate(-50%, -100%);
        margin-top: -8px;
        transition: all 0.15s var(--ease-out);
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
      }

      .heatmap-footer { 
        display: flex; 
        justify-content: space-between; 
        align-items: center;
        margin-top: var(--space-4);

        .help-link {
          font-size: 11px;
          color: var(--color-text-muted);
          text-decoration: none;
          font-weight: 600;
          &:hover { color: var(--color-text-secondary); text-decoration: underline; }
        }
      }

      .tooltip-empty {
        font-size: 12px;
        font-weight: 600;
        color: var(--color-text-secondary);
        padding: 4px 0;
      }
      
      .heatmap-legend { 
        display: flex; 
        align-items: center; 
        gap: var(--space-3);
        padding: 4px 12px;
        background: rgba(0,0,0,0.2);
        border-radius: var(--radius-full);
        border: 1px solid var(--color-bg-glass-border);

        .label { 
          font-size: 9px; 
          font-weight: 800; 
          color: var(--color-text-tertiary); 
          text-transform: uppercase; 
        }
        .legend-cells { display: flex; gap: 4px; }
      }
    }

    @media (max-width: 768px) {
      .analytics-grid { grid-template-columns: 1fr; gap: var(--space-6); }
      .chart-card { grid-column: span 1 !important; padding: var(--space-6); min-height: 360px; }
      .page-header { flex-direction: column; align-items: flex-start; gap: var(--space-4); }
      .page-header__title { font-size: 1.8rem; }
      
      .sim-grid { grid-template-columns: 1fr; gap: var(--space-8); }
      .sim-results { padding: var(--space-6); }
      
      .insights-container { margin: 0 calc(var(--space-5) * -1); }
    }
  `],
})
export class AnalyticsComponent {
  public store = inject(LilyStore);
  public analytics = inject(AnalyticsService);
  protected Math = Math;

  activeHeatmapCell = signal<any | null>(null);
  tooltipPos = signal({ x: 0, y: 0 });

  insights = computed(() => this.analytics.generateInsights());
  heatmapData = computed(() => this.analytics.getCalendarHeatmapData(12));
  totalActivityCount = computed(() => this.heatmapData().cells.reduce((s, c) => s + c.totalActivity, 0));

  heatmapInsights = computed(() => {
    const data = this.heatmapData().cells;
    const totalDays = data.length;
    const activeDays = data.filter(c => c.totalActivity > 0).length;
    const consistency = (activeDays / totalDays) * 100;
    
    const totalIncome = data.reduce((s, c) => s + (c.income || 0), 0);
    const totalExpenses = data.reduce((s, c) => s + (c.expenses || 0), 0);
    
    return {
      consistency: consistency.toFixed(1),
      totalIncome,
      totalExpenses,
      netFlow: totalIncome - totalExpenses
    };
  });

  showTooltip(event: MouseEvent, day: any) {
    const cell = event.target as HTMLElement;
    const rect = cell.getBoundingClientRect();
    const wrapper = cell.closest('.heatmap-grid-wrapper') as HTMLElement;
    const wrapperRect = wrapper.getBoundingClientRect();

    // Calculate position relative to the scrollable wrapper
    this.tooltipPos.set({
      x: rect.left - wrapperRect.left + rect.width / 2 + wrapper.scrollLeft,
      y: rect.top - wrapperRect.top
    });
    
    this.activeHeatmapCell.set(day);
  }

  formatTooltipDate(dateStr: string): string {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  }

  private chartColors = { 
    income: '#10b981', 
    expense: '#f43f5e', 
    violet: '#8b5cf6', 
    amber: '#f59e0b', 
    sky: '#0ea5e9', 
    pink: '#ec4899', 
    teal: '#14b8a6', 
    orange: '#f97316',
    border: 'rgba(255, 255, 255, 0.05)',
    grid: 'rgba(255, 255, 255, 0.03)',
    text: '#94a3b8'
  };

  barOptions: ChartOptions<'bar'> = { 
    responsive: true, 
    maintainAspectRatio: false, 
    scales: { 
      x: { 
        grid: { display: false }, 
        ticks: { color: this.chartColors.text, font: { size: 10, weight: 'bold' } } 
      }, 
      y: { 
        grid: { color: this.chartColors.grid }, 
        ticks: { color: this.chartColors.text, font: { size: 10 } } 
      } 
    }, 
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 12,
        displayColors: true
      }
    } 
  };

  lineOptions: ChartOptions<'line'> = { 
    responsive: true, 
    maintainAspectRatio: false, 
    scales: { 
      x: { 
        grid: { display: false }, 
        ticks: { color: this.chartColors.text, font: { size: 9 }, maxTicksLimit: 10 } 
      }, 
      y: { 
        grid: { color: this.chartColors.grid }, 
        ticks: { color: this.chartColors.text, font: { size: 10 } } 
      } 
    }, 
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 12
      }
    }, 
    elements: { 
      point: { radius: 0, hoverRadius: 6, hoverBackgroundColor: this.chartColors.violet }, 
      line: { tension: 0.4, borderWidth: 3 } 
    } 
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
          padding: 20 
        } 
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 12
      }
    } 
  };

  weekdayOptions: ChartOptions<'bar'> = { 
    responsive: true, 
    maintainAspectRatio: false, 
    scales: { 
      x: { 
        grid: { display: false }, 
        ticks: { color: this.chartColors.text, font: { size: 10, weight: 'bold' } } 
      }, 
      y: { 
        grid: { color: this.chartColors.grid }, 
        ticks: { display: false } 
      } 
    }, 
    plugins: { 
      legend: { display: false } 
    } 
  };

  monthlyBarData = computed<ChartData<'bar'>>(() => {
    const data = this.analytics.getMonthlyTotals(6);
    return { labels: data.map(d => format(parseISO(d.month + '-01'), 'MMM')), datasets: [
      { data: data.map(d => d.income), label: 'Income', backgroundColor: this.chartColors.income + 'cc', borderRadius: 6 },
      { data: data.map(d => d.expenses), label: 'Expenses', backgroundColor: this.chartColors.expense + 'cc', borderRadius: 6 },
    ] };
  });

  categoryDonutData = computed<ChartData<'doughnut'>>(() => {
    const expByCat = this.store.expensesByCategory();
    const cats = this.store.categories();
    const entries = [...expByCat.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    return { labels: entries.map(([id]) => cats.find(c => c.id === id)?.name || id), datasets: [{
      data: entries.map(([, v]) => v), backgroundColor: entries.map(([id]) => (cats.find(c => c.id === id)?.color || '#64748b') + 'cc'), borderWidth: 0, cutout: '60%',
    }] };
  });

  dailyLineData = computed<ChartData<'line'>>(() => {
    const daily = this.analytics.getDailySpendLast30Days();
    const amounts = daily.map(d => d.amount);
    const ma = this.analytics.calculateMovingAverage(amounts, 7);
    return { labels: daily.map(d => format(parseISO(d.date), 'dd')), datasets: [
      { data: amounts, label: 'Daily', borderColor: this.chartColors.violet, backgroundColor: this.chartColors.violet + '20', fill: true, borderWidth: 2 },
      { data: [...new Array(6).fill(null), ...ma], label: '7-Day Avg', borderColor: this.chartColors.amber, borderDash: [5, 5], borderWidth: 2, fill: false, pointRadius: 0 },
    ] };
  });

  weekdayBarData = computed<ChartData<'bar'>>(() => {
    const data = this.analytics.getWeekdayAverages();
    const max = Math.max(...data.map(d => d.average));
    return { labels: data.map(d => d.day), datasets: [{ data: data.map(d => d.average), backgroundColor: data.map(d => d.average === max ? this.chartColors.expense + 'cc' : this.chartColors.violet + '88'), borderRadius: 8 }] };
  });

  paymentPieData = computed<ChartData<'doughnut'>>(() => {
    const data = this.analytics.getPaymentMethodBreakdown();
    const colors = [this.chartColors.violet, this.chartColors.income, this.chartColors.amber, this.chartColors.sky, this.chartColors.pink];
    return { labels: data.map(d => d.method.toUpperCase()), datasets: [{ data: data.map(d => d.amount), backgroundColor: colors.slice(0, data.length), borderWidth: 0, cutout: '40%' }] };
  });

  moodDonutData = computed<ChartData<'doughnut'>>(() => {
    const data = this.analytics.getMoodBreakdown();
    const moodColors: Record<string, string> = { need: this.chartColors.income, want: this.chartColors.amber, impulse: this.chartColors.expense };
    const moodLabels: Record<string, string> = { need: 'Need', want: 'Want', impulse: 'Impulse' };
    return { labels: data.map(d => moodLabels[d.mood] || d.mood), datasets: [{ data: data.map(d => d.amount), backgroundColor: data.map(d => (moodColors[d.mood] || '#64748b') + 'cc'), borderWidth: 0, cutout: '55%' }] };
  });

  recurringPatterns = computed(() => this.analytics.detectRecurring());
  correlations = computed(() => this.analytics.findCorrelatedCategories());
  
  simCatId = 'food-dining';
  simReduction = 20;
  simulation = computed(() => this.analytics.simulate(this.simCatId, this.simReduction));

  getCatName(id: string) { return this.store.categories().find(c => c.id === id)?.name || id; }
  getCatIcon(id: string) { return this.store.categories().find(c => c.id === id)?.icon || 'package'; }
  getCatRawColor(id: string) { return this.store.categories().find(c => c.id === id)?.color || '#64748b'; }
}
