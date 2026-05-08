export interface MonthlyBudget {
  month: string; // "YYYY-MM"
  totalLimit: number;
  categoryLimits: Record<string, number>;
  rollover: boolean;
}

export interface BudgetVariance {
  categoryId: string;
  budgeted: number;
  actual: number;
  variance: number;
  percentage: number;
}

export interface BudgetHealth {
  score: number; // 0-100
  label: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  details: BudgetVariance[];
}
