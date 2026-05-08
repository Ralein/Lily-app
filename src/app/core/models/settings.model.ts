export interface AppSettings {
  currency: CurrencyConfig;
  theme: 'dark' | 'light' | 'amoled';
  defaultPaymentMethod: 'cash' | 'card' | 'upi' | 'netbanking' | 'other';
  monthlyIncome: number;
  monthlyBudgetTarget: number;
  tags: string[];
  onboardingComplete: boolean;
}

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  position: 'before' | 'after';
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN', position: 'before' },
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US', position: 'before' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE', position: 'before' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB', position: 'before' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', position: 'before' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', locale: 'en-CA', position: 'before' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU', position: 'before' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN', position: 'before' },
  { code: 'KRW', name: 'Korean Won', symbol: '₩', locale: 'ko-KR', position: 'before' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', locale: 'pt-BR', position: 'before' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  currency: CURRENCIES[0], // INR
  theme: 'dark',
  defaultPaymentMethod: 'upi',
  monthlyIncome: 0,
  monthlyBudgetTarget: 0,
  tags: ['food', 'travel', 'work', 'personal', 'emergency'],
  onboardingComplete: false,
};

export { };
