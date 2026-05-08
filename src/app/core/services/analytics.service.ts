import { Injectable, inject } from '@angular/core';
import { LilyStore } from '../store/lily.store';
import { Transaction } from '../models/transaction.model';
import { format, subMonths, subDays, parseISO, differenceInDays, getDaysInMonth } from 'date-fns';

export interface BudgetVarianceResult { categoryId: string; budgeted: number; actual: number; variance: number; percentage: number; }
export interface SpendingVelocityResult { projected: number; budget: number; daysLeft: number; safeDaily: number; }
export interface CategoryTrend { categoryId: string; trend: 'rising' | 'falling' | 'stable'; changePct: number; }
export interface RecurringPattern { categoryId: string; note: string; avgAmount: number; frequency: string; nextExpected: string; }
export interface CorrelationResult { catA: string; catB: string; correlation: number; }
export interface SimulationResult { newMonthlySavings: number; annualImpact: number; currentCategorySpend: number; reducedCategorySpend: number; }
export interface MonthRank { month: string; score: number; label: 'best' | 'worst' | 'average'; savingsRate: number; totalExpenses: number; totalIncome: number; }
export interface Insight { id: string; emoji: string; text: string; type: 'info' | 'warning' | 'success' | 'danger'; priority: number; }

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private store = inject(LilyStore);

  calculateMovingAverage(data: number[], window: number): number[] {
    if (data.length < window) return data;
    const result: number[] = [];
    for (let i = 0; i <= data.length - window; i++) {
      const slice = data.slice(i, i + window);
      result.push(slice.reduce((a, b) => a + b, 0) / window);
    }
    return result;
  }

  budgetVariance(month: string): BudgetVarianceResult[] {
    const budget = this.store.budgets().find(b => b.month === month);
    if (!budget) return [];
    const txns = this.store.transactions().filter(t => t.date.startsWith(month) && t.type === 'expense');
    const spend = new Map<string, number>();
    txns.forEach(t => spend.set(t.categoryId, (spend.get(t.categoryId) || 0) + t.amount));
    return Object.entries(budget.categoryLimits).map(([catId, budgeted]) => {
      const actual = spend.get(catId) || 0;
      return { categoryId: catId, budgeted, actual, variance: budgeted - actual, percentage: budgeted > 0 ? (actual / budgeted) * 100 : 0 };
    });
  }

  spendingVelocity(month: string): SpendingVelocityResult {
    const txns = this.store.transactions().filter(t => t.date.startsWith(month) && t.type === 'expense');
    const totalSpent = txns.reduce((s, t) => s + t.amount, 0);
    const today = new Date(); const daysElapsed = today.getDate(); const totalDays = getDaysInMonth(today); const daysLeft = totalDays - daysElapsed;
    const dailyRate = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
    const projected = totalSpent + dailyRate * daysLeft;
    const budget = this.store.budgets().find(b => b.month === month);
    const budgetAmt = budget?.totalLimit || this.store.settings().monthlyBudgetTarget || 0;
    const safeDaily = daysLeft > 0 ? Math.max(0, budgetAmt - totalSpent) / daysLeft : 0;
    return { projected, budget: budgetAmt, daysLeft, safeDaily };
  }

  detectCategoryTrends(): CategoryTrend[] {
    const cur = format(new Date(), 'yyyy-MM'); const prev = format(subMonths(new Date(), 1), 'yyyy-MM');
    const curSpend = this.monthCatSpend(cur); const prevSpend = this.monthCatSpend(prev);
    const trends: CategoryTrend[] = [];
    new Set([...curSpend.keys(), ...prevSpend.keys()]).forEach(catId => {
      const c = curSpend.get(catId) || 0; const p = prevSpend.get(catId) || 0;
      if (p === 0 && c === 0) return;
      const pct = p > 0 ? ((c - p) / p) * 100 : (c > 0 ? 100 : 0);
      trends.push({ categoryId: catId, trend: pct > 15 ? 'rising' : pct < -15 ? 'falling' : 'stable', changePct: Math.round(pct) });
    });
    return trends;
  }

  detectAnomalies(): Transaction[] {
    const expenses = this.store.transactions().filter(t => t.type === 'expense');
    const catAmts = new Map<string, number[]>();
    expenses.forEach(t => { if (!catAmts.has(t.categoryId)) catAmts.set(t.categoryId, []); catAmts.get(t.categoryId)!.push(t.amount); });
    return expenses.filter(t => {
      const amts = catAmts.get(t.categoryId); if (!amts || amts.length < 3) return false;
      const mean = amts.reduce((a, b) => a + b, 0) / amts.length;
      const stdDev = Math.sqrt(amts.reduce((s, x) => s + (x - mean) ** 2, 0) / amts.length);
      return stdDev > 0 && Math.abs((t.amount - mean) / stdDev) > 2;
    });
  }

  detectRecurring(): RecurringPattern[] {
    const expenses = this.store.transactions().filter(t => t.type === 'expense').sort((a, b) => a.date.localeCompare(b.date));
    const groups = new Map<string, Transaction[]>();
    expenses.forEach(t => { const k = `${t.categoryId}-${t.note.toLowerCase().trim()}`; if (!groups.has(k)) groups.set(k, []); groups.get(k)!.push(t); });
    const patterns: RecurringPattern[] = [];
    groups.forEach((txns) => {
      if (txns.length < 2) return;
      const amts = txns.map(t => t.amount); const avg = amts.reduce((a, b) => a + b, 0) / amts.length;
      if (!amts.every(a => Math.abs(a - avg) / avg < 0.1)) return;
      const intervals: number[] = []; for (let i = 1; i < txns.length; i++) intervals.push(differenceInDays(parseISO(txns[i].date), parseISO(txns[i - 1].date)));
      if (!intervals.length) return;
      const avgI = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      let freq = ''; if (avgI >= 25 && avgI <= 35) freq = 'monthly'; else if (avgI >= 6 && avgI <= 8) freq = 'weekly'; else return;
      const last = parseISO(txns[txns.length - 1].date);
      patterns.push({ categoryId: txns[0].categoryId, note: txns[0].note || 'Unnamed', avgAmount: Math.round(avg), frequency: freq, nextExpected: format(new Date(last.getTime() + avgI * 86400000), 'yyyy-MM-dd') });
    });
    return patterns;
  }

  savingsRate(month: string): number {
    const txns = this.store.transactions().filter(t => t.date.startsWith(month));
    const inc = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0;
  }

  findCorrelatedCategories(): CorrelationResult[] {
    const days = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));
    const expenses = this.store.transactions().filter(t => t.type === 'expense');
    const cats = [...new Set(expenses.map(t => t.categoryId))]; if (cats.length < 2) return [];
    const daily = new Map<string, number[]>();
    cats.forEach(c => daily.set(c, days.map(d => expenses.filter(t => t.categoryId === c && t.date.startsWith(d)).reduce((s, t) => s + t.amount, 0))));
    const results: CorrelationResult[] = [];
    for (let i = 0; i < cats.length; i++) for (let j = i + 1; j < cats.length; j++) {
      const r = this.pearson(daily.get(cats[i])!, daily.get(cats[j])!);
      if (Math.abs(r) > 0.5) results.push({ catA: cats[i], catB: cats[j], correlation: Math.round(r * 100) / 100 });
    }
    return results.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  simulate(categoryId: string, reductionPct: number): SimulationResult {
    const month = format(new Date(), 'yyyy-MM');
    const txns = this.store.transactions().filter(t => t.date.startsWith(month));
    const inc = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const catSpend = txns.filter(t => t.type === 'expense' && t.categoryId === categoryId).reduce((s, t) => s + t.amount, 0);
    const reduced = catSpend * (1 - reductionPct / 100); const savings = catSpend - reduced;
    return { newMonthlySavings: inc - exp + savings, annualImpact: savings * 12, currentCategorySpend: catSpend, reducedCategorySpend: reduced };
  }

  rankMonths(): MonthRank[] {
    const txns = this.store.transactions(); const months = [...new Set(txns.map(t => t.date.substring(0, 7)))].sort();
    if (!months.length) return [];
    const ranks: MonthRank[] = months.map(m => {
      const mt = txns.filter(t => t.date.startsWith(m)); const inc = mt.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0); const exp = mt.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { month: m, score: 0, label: 'average' as const, savingsRate: inc > 0 ? ((inc - exp) / inc) * 100 : 0, totalExpenses: exp, totalIncome: inc };
    });
    const max = Math.max(...ranks.map(r => r.savingsRate), 1);
    ranks.forEach(r => r.score = Math.round((r.savingsRate / max) * 100));
    ranks.sort((a, b) => b.score - a.score);
    if (ranks.length > 0) ranks[0].label = 'best';
    if (ranks.length > 1) ranks[ranks.length - 1].label = 'worst';
    return ranks;
  }

  generateInsights(): Insight[] {
    const insights: Insight[] = []; const month = format(new Date(), 'yyyy-MM'); const prev = format(subMonths(new Date(), 1), 'yyyy-MM');
    const cats = this.store.categories(); const cn = (id: string) => cats.find(c => c.id === id)?.name || id;
    const sym = this.store.settings().currency.symbol;
    this.detectCategoryTrends().filter(t => t.trend === 'rising' && t.changePct > 25).forEach(t => insights.push({ id: `tr-${t.categoryId}`, emoji: '🚨', text: `${cn(t.categoryId)} spending is up ${t.changePct}% vs last month`, type: 'warning', priority: 1 }));
    const cr = this.savingsRate(month); const pr = this.savingsRate(prev);
    if (cr > pr && pr > 0) insights.push({ id: 'sr', emoji: '📈', text: `Savings rate improved from ${pr}% → ${cr}% this month`, type: 'success', priority: 2 });
    const rec = this.detectRecurring();
    if (rec.length > 0) insights.push({ id: 'rec', emoji: '🔁', text: `Detected ${rec.length} recurring expense${rec.length > 1 ? 's' : ''} totaling ${sym}${rec.reduce((s, r) => s + r.avgAmount, 0).toLocaleString()}/month`, type: 'info', priority: 3 });
    const expByCat = this.store.expensesByCategory();
    if (expByCat.size > 0) { const top = [...expByCat.entries()].sort((a, b) => b[1] - a[1])[0]; const sim = this.simulate(top[0], 20);
      if (sim.annualImpact > 0) insights.push({ id: 'wif', emoji: '💡', text: `Cut ${cn(top[0])} by 20% → save ${sym}${sim.annualImpact.toLocaleString()} extra/year`, type: 'info', priority: 2 });
    }
    const vel = this.spendingVelocity(month);
    if (vel.budget > 0 && vel.projected > vel.budget * 1.1) insights.push({ id: 'vel', emoji: '⚡', text: `At current pace, you'll spend ${sym}${Math.round(vel.projected).toLocaleString()} — ${Math.round(((vel.projected / vel.budget) - 1) * 100)}% over budget`, type: 'danger', priority: 1 });
    return insights.sort((a, b) => a.priority - b.priority);
  }

  getDailySpendLast30Days(): { date: string; amount: number }[] {
    const r: { date: string; amount: number }[] = [];
    for (let i = 29; i >= 0; i--) { const d = format(subDays(new Date(), i), 'yyyy-MM-dd'); r.push({ date: d, amount: this.store.transactions().filter(t => t.type === 'expense' && t.date.startsWith(d)).reduce((s, t) => s + t.amount, 0) }); }
    return r;
  }

  getMonthlyTotals(n = 12): { month: string; income: number; expenses: number }[] {
    const r: { month: string; income: number; expenses: number }[] = [];
    for (let i = n - 1; i >= 0; i--) { const m = format(subMonths(new Date(), i), 'yyyy-MM'); const t = this.store.transactions().filter(tx => tx.date.startsWith(m)); r.push({ month: m, income: t.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0), expenses: t.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0) }); }
    return r;
  }

  getWeekdayAverages(): { day: string; average: number }[] {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const totals = new Array(7).fill(0); const weeks = 13;
    const dateSet = new Set(Array.from({ length: weeks * 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')));
    this.store.transactions().filter(t => t.type === 'expense' && dateSet.has(t.date.substring(0, 10))).forEach(t => { totals[parseISO(t.date).getDay()] += t.amount; });
    return days.map((d, i) => ({ day: d, average: Math.round(totals[i] / weeks) }));
  }

  getPaymentMethodBreakdown(): { method: string; amount: number }[] {
    const m = format(new Date(), 'yyyy-MM'); const map = new Map<string, number>();
    this.store.transactions().filter(t => t.date.startsWith(m) && t.type === 'expense').forEach(t => map.set(t.paymentMethod, (map.get(t.paymentMethod) || 0) + t.amount));
    return [...map.entries()].map(([method, amount]) => ({ method, amount }));
  }

  getMoodBreakdown(): { mood: string; amount: number; count: number }[] {
    const m = format(new Date(), 'yyyy-MM'); const map = new Map<string, { amount: number; count: number }>();
    this.store.transactions().filter(t => t.date.startsWith(m) && t.type === 'expense' && t.mood).forEach(t => { const c = map.get(t.mood!) || { amount: 0, count: 0 }; map.set(t.mood!, { amount: c.amount + t.amount, count: c.count + 1 }); });
    return [...map.entries()].map(([mood, d]) => ({ mood, ...d }));
  }

  getCalendarHeatmapData(months = 6): { date: string; amount: number; level: number }[] {
    const totalDays = months * 30; const result: { date: string; amount: number; level: number }[] = []; const amounts: number[] = [];
    for (let i = totalDays - 1; i >= 0; i--) { const d = format(subDays(new Date(), i), 'yyyy-MM-dd'); const a = this.store.transactions().filter(t => t.type === 'expense' && t.date.startsWith(d)).reduce((s, t) => s + t.amount, 0); amounts.push(a); result.push({ date: d, amount: a, level: 0 }); }
    const nz = amounts.filter(a => a > 0).sort((a, b) => a - b);
    if (nz.length > 0) { const q = [nz[Math.floor(nz.length * 0.25)], nz[Math.floor(nz.length * 0.5)], nz[Math.floor(nz.length * 0.75)], nz[nz.length - 1]];
      result.forEach(r => { if (r.amount === 0) r.level = 0; else if (r.amount <= q[0]) r.level = 1; else if (r.amount <= q[1]) r.level = 2; else if (r.amount <= q[2]) r.level = 3; else r.level = 4; }); }
    return result;
  }

  private monthCatSpend(month: string): Map<string, number> {
    const m = new Map<string, number>();
    this.store.transactions().filter(t => t.date.startsWith(month) && t.type === 'expense').forEach(t => m.set(t.categoryId, (m.get(t.categoryId) || 0) + t.amount));
    return m;
  }

  private pearson(x: number[], y: number[]): number {
    const n = x.length; if (!n) return 0;
    const sx = x.reduce((a, b) => a + b, 0); const sy = y.reduce((a, b) => a + b, 0);
    const sxy = x.reduce((s, xi, i) => s + xi * y[i], 0);
    const sx2 = x.reduce((s, xi) => s + xi * xi, 0); const sy2 = y.reduce((s, yi) => s + yi * yi, 0);
    const d = Math.sqrt((n * sx2 - sx * sx) * (n * sy2 - sy * sy));
    return d === 0 ? 0 : (n * sxy - sx * sy) / d;
  }
}
