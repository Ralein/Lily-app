import { Component, inject, computed } from '@angular/core';
import { LilyStore } from '../../core/store/lily.store';
import { AnalyticsService } from '../../core/services/analytics.service';
import { CurrencyDisplayPipe } from '../../shared/pipes/currency-display.pipe';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { format, parseISO, subMonths } from 'date-fns';

@Component({
  selector: 'lily-analytics',
  standalone: true,
  imports: [BaseChartDirective, CurrencyDisplayPipe],
  template: `
    <div class="page-header">
      <h1 class="page-header__title">Analytics</h1>
      <p class="page-header__subtitle">Spending patterns & insights</p>
    </div>

    <!-- Insights Panel -->
    @if (insights().length > 0) {
      <div class="insights-panel animate-fade-in-up">
        @for (insight of insights(); track insight.id) {
          <div class="insight-card insight-card--{{ insight.type }}">
            <span class="insight-card__text">{{ insight.text }}</span>
          </div>
        }
      </div>
    }

    <div class="grid grid--2">
      <!-- Monthly Income vs Expenses -->
      <div class="lily-card chart-card animate-fade-in-up stagger-1">
        <div class="lily-card__header"><span class="lily-card__title">Monthly Overview</span></div>
        <div class="chart-wrapper">
          <canvas baseChart [data]="monthlyBarData()" [options]="barOptions" type="bar" aria-label="Monthly income vs expenses bar chart"></canvas>
        </div>
      </div>

      <!-- Category Donut -->
      <div class="lily-card chart-card animate-fade-in-up stagger-2">
        <div class="lily-card__header"><span class="lily-card__title">By Category</span></div>
        <div class="chart-wrapper chart-wrapper--donut">
          <canvas baseChart [data]="categoryDonutData()" [options]="donutOptions" type="doughnut" aria-label="Spending by category donut chart"></canvas>
        </div>
      </div>

      <!-- Daily Spend Line -->
      <div class="lily-card chart-card animate-fade-in-up stagger-3">
        <div class="lily-card__header"><span class="lily-card__title">Daily Spend (30 Days)</span></div>
        <div class="chart-wrapper">
          <canvas baseChart [data]="dailyLineData()" [options]="lineOptions" type="line" aria-label="Daily spend line chart"></canvas>
        </div>
      </div>

      <!-- Weekday Averages -->
      <div class="lily-card chart-card animate-fade-in-up stagger-4">
        <div class="lily-card__header"><span class="lily-card__title">Weekday Averages</span></div>
        <div class="chart-wrapper">
          <canvas baseChart [data]="weekdayBarData()" [options]="weekdayOptions" type="bar" aria-label="Average spend by weekday bar chart"></canvas>
        </div>
      </div>

      <!-- Payment Methods -->
      <div class="lily-card chart-card animate-fade-in-up stagger-5">
        <div class="lily-card__header"><span class="lily-card__title">Payment Methods</span></div>
        <div class="chart-wrapper chart-wrapper--donut">
          <canvas baseChart [data]="paymentPieData()" [options]="donutOptions" type="doughnut" aria-label="Payment method pie chart"></canvas>
        </div>
      </div>

      <!-- Mood Breakdown -->
      <div class="lily-card chart-card animate-fade-in-up stagger-6">
        <div class="lily-card__header"><span class="lily-card__title">Spending Mood</span></div>
        <div class="chart-wrapper chart-wrapper--donut">
          <canvas baseChart [data]="moodDonutData()" [options]="donutOptions" type="doughnut" aria-label="Spending mood donut chart"></canvas>
        </div>
      </div>
    </div>

    <!-- Calendar Heatmap -->
    <div class="lily-card animate-fade-in-up stagger-7" style="margin-top: var(--space-6)">
      <div class="lily-card__header"><span class="lily-card__title">Spending Heatmap</span></div>
      <div class="heatmap-container">
        <div class="heatmap">
          @for (day of heatmapData(); track day.date) {
            <div class="heatmap__cell heatmap__cell--{{ day.level }}" [title]="day.date + ': ' + (day.amount | currencyDisplay)"></div>
          }
        </div>
        <div class="heatmap-legend">
          <span class="text-xs text-tertiary">Less</span>
          <div class="heatmap__cell heatmap__cell--0"></div>
          <div class="heatmap__cell heatmap__cell--1"></div>
          <div class="heatmap__cell heatmap__cell--2"></div>
          <div class="heatmap__cell heatmap__cell--3"></div>
          <div class="heatmap__cell heatmap__cell--4"></div>
          <span class="text-xs text-tertiary">More</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .insights-panel { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-6); }
    .insight-card { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); border: 1px solid;
      &--warning { background: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.2); }
      &--success { background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.2); }
      &--info { background: rgba(14, 165, 233, 0.08); border-color: rgba(14, 165, 233, 0.2); }
      &--danger { background: rgba(244, 63, 94, 0.08); border-color: rgba(244, 63, 94, 0.2); }
    }
    .insight-card__text { font-size: var(--fs-sm); color: var(--color-text-secondary); }
    .chart-card { min-height: 300px; }
    .chart-wrapper { height: 250px; position: relative; }
    .chart-wrapper--donut { height: 220px; max-width: 300px; margin: 0 auto; }
    .heatmap-container { overflow-x: auto; }
    .heatmap { display: grid; grid-template-rows: repeat(7, 1fr); grid-auto-flow: column; gap: 3px; padding: var(--space-2) 0; }
    .heatmap__cell { width: 14px; height: 14px; border-radius: 3px; transition: opacity var(--duration-fast);
      &--0 { background: var(--color-bg-input); }
      &--1 { background: rgba(139, 92, 246, 0.2); }
      &--2 { background: rgba(139, 92, 246, 0.4); }
      &--3 { background: rgba(139, 92, 246, 0.6); }
      &--4 { background: rgba(139, 92, 246, 0.9); }
      &:hover { opacity: 0.7; }
    }
    .heatmap-legend { display: flex; align-items: center; gap: 4px; margin-top: var(--space-2); justify-content: flex-end; }
  `],
})
export class AnalyticsComponent {
  private store = inject(LilyStore);
  private analytics = inject(AnalyticsService);

  insights = computed(() => this.analytics.generateInsights());
  heatmapData = computed(() => this.analytics.getCalendarHeatmapData(4));

  private chartColors = { income: '#10b981', expense: '#f43f5e', violet: '#8b5cf6', amber: '#f59e0b', sky: '#0ea5e9', pink: '#ec4899', teal: '#14b8a6', orange: '#f97316' };
  private catColors = ['#f97316', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#14b8a6', '#a855f7', '#f43f5e'];

  barOptions: ChartOptions<'bar'> = { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } } }, plugins: { legend: { display: true, labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } } } } };
  lineOptions: ChartOptions<'line'> = { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 9 }, maxTicksLimit: 10 } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } } }, plugins: { legend: { display: true, labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } } } }, elements: { point: { radius: 2 }, line: { tension: 0.4 } } };
  donutOptions: ChartOptions<'doughnut'> = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 10, font: { size: 11 }, padding: 12 } } } };
  weekdayOptions: ChartOptions<'bar'> = { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { color: '#64748b' } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b' } } }, plugins: { legend: { display: false } } };

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
}
