import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Transaction, TransactionFilter } from '../models/transaction.model';
import { Category, DEFAULT_CATEGORIES } from '../models/category.model';
import { MonthlyBudget } from '../models/budget.model';
import { SavingsGoal } from '../models/goal.model';
import { AppSettings, DEFAULT_SETTINGS } from '../models/settings.model';
import { StorageService } from '../services/storage.service';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfDay, endOfDay, subDays, isSameDay } from 'date-fns';

@Injectable({ providedIn: 'root' })
export class LilyStore {
  private storage = inject(StorageService);

  // ── State Signals ──
  private _transactions = signal<Transaction[]>(
    this.storage.get<Transaction[]>('transactions', [])
  );
  private _categories = signal<Category[]>(
    this.storage.get<Category[]>('categories', DEFAULT_CATEGORIES)
  );
  private _budgets = signal<MonthlyBudget[]>(
    this.storage.get<MonthlyBudget[]>('budgets', [])
  );
  private _goals = signal<SavingsGoal[]>(
    this.storage.get<SavingsGoal[]>('goals', [])
  );
  private _settings = signal<AppSettings>(
    this.storage.get<AppSettings>('settings', DEFAULT_SETTINGS)
  );

  // ── Public Read-Only Selectors ──
  readonly transactions = this._transactions.asReadonly();
  readonly categories = this._categories.asReadonly();
  readonly budgets = this._budgets.asReadonly();
  readonly goals = this._goals.asReadonly();
  readonly settings = this._settings.asReadonly();

  // ── Derived State ──
  readonly currentMonth = signal(format(new Date(), 'yyyy-MM'));

  readonly currentMonthTransactions = computed(() => {
    const month = this.currentMonth();
    return this._transactions()
      .filter(t => t.date.startsWith(month))
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  readonly totalIncome = computed(() =>
    this.currentMonthTransactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  readonly totalExpenses = computed(() =>
    this.currentMonthTransactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  readonly balance = computed(() => this.totalIncome() - this.totalExpenses());

  readonly todaysTransactions = computed(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return this._transactions()
      .filter(t => t.date.startsWith(today))
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  readonly todaysSpend = computed(() =>
    this.todaysTransactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  readonly yesterdaysSpend = computed(() => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    return this._transactions()
      .filter(t => t.type === 'expense' && t.date.startsWith(yesterday))
      .reduce((sum, t) => sum + t.amount, 0);
  });

  readonly dailyAverage = computed(() => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    return dayOfMonth > 0 ? this.totalExpenses() / dayOfMonth : 0;
  });

  readonly recentTransactions = computed(() =>
    this._transactions()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7)
  );

  readonly currentBudget = computed(() => {
    const month = this.currentMonth();
    return this._budgets().find(b => b.month === month);
  });

  readonly onboardingComplete = computed(() => this._settings().onboardingComplete);

  readonly currencySymbol = computed(() => this._settings().currency.symbol);

  readonly categoryMap = computed(() => {
    const map = new Map<string, Category>();
    this._categories().forEach(c => map.set(c.id, c));
    return map;
  });

  readonly expensesByCategory = computed(() => {
    const txns = this.currentMonthTransactions().filter(t => t.type === 'expense');
    const map = new Map<string, number>();
    txns.forEach(t => {
      map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
    });
    return map;
  });

  readonly budgetStreak = computed(() => {
    const budget = this.currentBudget();
    if (!budget) return 0;

    const dailyBudget = budget.totalLimit / 30;
    const today = new Date();
    let streak = 0;

    for (let i = 0; i < 365; i++) {
      const date = format(subDays(today, i), 'yyyy-MM-dd');
      const daySpend = this._transactions()
        .filter(t => t.type === 'expense' && t.date.startsWith(date))
        .reduce((sum, t) => sum + t.amount, 0);

      if (daySpend <= dailyBudget) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  });

  // ── Persistence Effects ──
  constructor() {
    effect(() => this.storage.set('transactions', this._transactions()));
    effect(() => this.storage.set('categories', this._categories()));
    effect(() => this.storage.set('budgets', this._budgets()));
    effect(() => this.storage.set('goals', this._goals()));
    effect(() => this.storage.set('settings', this._settings()));

    // Apply theme on settings change
    effect(() => {
      const theme = this._settings().theme;
      document.documentElement.setAttribute('data-theme', theme);
    });
  }

  // ── Transaction Actions ──
  addTransaction(transaction: Transaction): void {
    this._transactions.update(txns => [transaction, ...txns]);
  }

  updateTransaction(id: string, updates: Partial<Transaction>): void {
    this._transactions.update(txns =>
      txns.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
    );
  }

  deleteTransaction(id: string): void {
    this._transactions.update(txns => txns.filter(t => t.id !== id));
  }

  deleteTransactions(ids: string[]): void {
    const idSet = new Set(ids);
    this._transactions.update(txns => txns.filter(t => !idSet.has(t.id)));
  }

  setTransactions(transactions: Transaction[]): void {
    this._transactions.set(transactions);
  }

  // ── Category Actions ──
  addCategory(category: Category): void {
    this._categories.update(cats => [...cats, category]);
  }

  updateCategory(id: string, updates: Partial<Category>): void {
    this._categories.update(cats =>
      cats.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  }

  deleteCategory(id: string): void {
    this._categories.update(cats => cats.filter(c => c.id !== id));
  }

  setCategories(categories: Category[]): void {
    this._categories.set(categories);
  }

  // ── Budget Actions ──
  setBudget(budget: MonthlyBudget): void {
    this._budgets.update(budgets => {
      const idx = budgets.findIndex(b => b.month === budget.month);
      if (idx >= 0) {
        return budgets.map((b, i) => i === idx ? budget : b);
      }
      return [...budgets, budget];
    });
  }

  // ── Goal Actions ──
  addGoal(goal: SavingsGoal): void {
    this._goals.update(goals => [...goals, goal]);
  }

  updateGoal(id: string, updates: Partial<SavingsGoal>): void {
    this._goals.update(goals =>
      goals.map(g => g.id === id ? { ...g, ...updates } : g)
    );
  }

  deleteGoal(id: string): void {
    this._goals.update(goals => goals.filter(g => g.id !== id));
  }

  contributeToGoal(goalId: string, amount: number): void {
    this._goals.update(goals =>
      goals.map(g => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          currentAmount: g.currentAmount + amount,
          contributions: [
            ...g.contributions,
            { id: crypto.randomUUID(), amount, date: new Date().toISOString() }
          ]
        };
      })
    );
  }

  // ── Settings Actions ──
  updateSettings(updates: Partial<AppSettings>): void {
    this._settings.update(s => ({ ...s, ...updates }));
  }

  completeOnboarding(): void {
    this.updateSettings({ onboardingComplete: true });
  }

  resetOnboarding(): void {
    this.updateSettings({ onboardingComplete: false });
  }

  setMonth(month: string): void {
    this.currentMonth.set(month);
  }

  // ── Filtered Transactions ──
  getFilteredTransactions(filter: TransactionFilter): Transaction[] {
    let txns = this._transactions();

    if (filter.dateFrom) {
      txns = txns.filter(t => t.date >= filter.dateFrom!);
    }
    if (filter.dateTo) {
      txns = txns.filter(t => t.date <= filter.dateTo!);
    }
    if (filter.categoryIds?.length) {
      txns = txns.filter(t => filter.categoryIds!.includes(t.categoryId));
    }
    if (filter.type) {
      txns = txns.filter(t => t.type === filter.type);
    }
    if (filter.amountMin !== undefined) {
      txns = txns.filter(t => t.amount >= filter.amountMin!);
    }
    if (filter.amountMax !== undefined) {
      txns = txns.filter(t => t.amount <= filter.amountMax!);
    }
    if (filter.paymentMethods?.length) {
      txns = txns.filter(t => filter.paymentMethods!.includes(t.paymentMethod));
    }
    if (filter.moods?.length) {
      txns = txns.filter(t => t.mood && filter.moods!.includes(t.mood));
    }
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      txns = txns.filter(t =>
        t.note.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q)) ||
        (this.categoryMap().get(t.categoryId)?.name.toLowerCase().includes(q))
      );
    }

    // Sort
    const sortBy = filter.sortBy || 'date';
    const sortOrder = filter.sortOrder || 'desc';
    const multiplier = sortOrder === 'desc' ? -1 : 1;

    txns = [...txns].sort((a, b) => {
      switch (sortBy) {
        case 'date': return multiplier * a.date.localeCompare(b.date);
        case 'amount': return multiplier * (a.amount - b.amount);
        case 'category': return multiplier * a.categoryId.localeCompare(b.categoryId);
        default: return 0;
      }
    });

    return txns;
  }

  // ── Bulk Import ──
  importData(data: {
    transactions?: Transaction[];
    categories?: Category[];
    budgets?: MonthlyBudget[];
    goals?: SavingsGoal[];
    settings?: Partial<AppSettings>;
  }): void {
    if (data.transactions) this._transactions.set(data.transactions);
    if (data.categories) this._categories.set(data.categories);
    if (data.budgets) this._budgets.set(data.budgets);
    if (data.goals) this._goals.set(data.goals);
    if (data.settings) this._settings.update(s => ({ ...s, ...data.settings! }));
  }

  // ── Reset ──
  resetAll(): void {
    this._transactions.set([]);
    this._categories.set(DEFAULT_CATEGORIES);
    this._budgets.set([]);
    this._goals.set([]);
    this._settings.set(DEFAULT_SETTINGS);
    this.storage.clear();
  }
}
