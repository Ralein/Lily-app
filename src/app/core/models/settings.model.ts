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
  symbol: string;
  locale: string;
  position: 'before' | 'after';
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', locale: 'en-IN', position: 'before' },
  { code: 'USD', symbol: '$', locale: 'en-US', position: 'before' },
  { code: 'EUR', symbol: '€', locale: 'de-DE', position: 'before' },
  { code: 'GBP', symbol: '£', locale: 'en-GB', position: 'before' },
  { code: 'JPY', symbol: '¥', locale: 'ja-JP', position: 'before' },
  { code: 'CAD', symbol: 'CA$', locale: 'en-CA', position: 'before' },
  { code: 'AUD', symbol: 'A$', locale: 'en-AU', position: 'before' },
  { code: 'CNY', symbol: '¥', locale: 'zh-CN', position: 'before' },
  { code: 'KRW', symbol: '₩', locale: 'ko-KR', position: 'before' },
  { code: 'BRL', symbol: 'R$', locale: 'pt-BR', position: 'before' },
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
