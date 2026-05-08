export interface Category {
  id: string;
  name: string;
  icon: string; // emoji
  color: string; // hex color
  budget?: number;
  type: 'expense' | 'income' | 'both';
  order: number;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: '🍕', color: '#f97316', type: 'expense', order: 0 },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#0ea5e9', type: 'expense', order: 1 },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#8b5cf6', type: 'expense', order: 2 },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#ec4899', type: 'expense', order: 3 },
  { id: 'bills', name: 'Bills & Utilities', icon: '💡', color: '#f59e0b', type: 'expense', order: 4 },
  { id: 'health', name: 'Health', icon: '🏥', color: '#10b981', type: 'expense', order: 5 },
  { id: 'education', name: 'Education', icon: '📚', color: '#6366f1', type: 'expense', order: 6 },
  { id: 'groceries', name: 'Groceries', icon: '🥬', color: '#14b8a6', type: 'expense', order: 7 },
  { id: 'subscriptions', name: 'Subscriptions', icon: '📱', color: '#a855f7', type: 'expense', order: 8 },
  { id: 'personal', name: 'Personal Care', icon: '💅', color: '#f43f5e', type: 'expense', order: 9 },
  { id: 'salary', name: 'Salary', icon: '💰', color: '#10b981', type: 'income', order: 10 },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#0ea5e9', type: 'income', order: 11 },
  { id: 'investments', name: 'Investments', icon: '📈', color: '#8b5cf6', type: 'income', order: 12 },
  { id: 'gifts', name: 'Gifts', icon: '🎁', color: '#ec4899', type: 'both', order: 13 },
  { id: 'other', name: 'Other', icon: '📦', color: '#64748b', type: 'both', order: 14 },
];

export function getCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find(c => c.id === id);
}

export function getCategoriesByType(categories: Category[], type: 'expense' | 'income'): Category[] {
  return categories.filter(c => c.type === type || c.type === 'both');
}
