export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'biweekly' | 'weekly' | 'one-time';
  categoryId: string; // maps to income category (salary, freelance, etc.)
  isActive: boolean;
  createdAt: string;
}

/** Frequency multipliers to normalize all income to monthly */
export const FREQUENCY_TO_MONTHLY: Record<IncomeSource['frequency'], number> = {
  'monthly': 1,
  'biweekly': 26 / 12, // ~2.167
  'weekly': 52 / 12,   // ~4.333
  'one-time': 0,       // not recurring
};

/** Calculate monthly equivalent for an income source */
export function toMonthlyAmount(source: IncomeSource): number {
  return source.isActive ? source.amount * FREQUENCY_TO_MONTHLY[source.frequency] : 0;
}

/** 50/30/20 budget rule */
export const BUDGET_RULE = {
  needs: 0.50,    // rent, bills, groceries, transport, health
  wants: 0.30,    // food, entertainment, shopping, personal, subscriptions
  savings: 0.20,  // goals, investments, emergency fund
} as const;

export const NEEDS_CATEGORIES = ['bills', 'groceries', 'transport', 'health'];
export const WANTS_CATEGORIES = ['food', 'entertainment', 'shopping', 'personal', 'subscriptions'];
