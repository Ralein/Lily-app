export interface Transaction {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  categoryId: string;
  note: string;
  date: string; // ISO 8601
  tags: string[];
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  paymentMethod: 'cash' | 'card' | 'upi' | 'netbanking' | 'other';
  mood?: 'need' | 'want' | 'impulse';
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = Transaction['type'];
export type PaymentMethod = Transaction['paymentMethod'];
export type MoodTag = NonNullable<Transaction['mood']>;
export type RecurringFrequency = NonNullable<Transaction['recurringFrequency']>;

export interface TransactionFilter {
  dateFrom?: string;
  dateTo?: string;
  categoryIds?: string[];
  type?: TransactionType;
  amountMin?: number;
  amountMax?: number;
  paymentMethods?: PaymentMethod[];
  moods?: MoodTag[];
  searchQuery?: string;
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
}
