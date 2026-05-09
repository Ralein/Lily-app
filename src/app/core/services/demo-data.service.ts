import { Injectable, inject } from '@angular/core';
import { LilyStore } from '../store/lily.store';
import { Transaction } from '../models/transaction.model';
import { DEFAULT_CATEGORIES } from '../models/category.model';
import { format, subDays, subMonths } from 'date-fns';

@Injectable({ providedIn: 'root' })
export class DemoDataService {
  private store = inject(LilyStore);

  private expenseCats = ['food', 'transport', 'entertainment', 'shopping', 'bills', 'health', 'groceries', 'subscriptions', 'personal'];
  private incomeCats = ['salary', 'freelance'];
  private notes: Record<string, string[]> = {
    food: ['Lunch at cafe', 'Dinner out', 'Street food', 'Restaurant', 'Coffee', 'Zomato order', 'Swiggy order'],
    transport: ['Uber ride', 'Metro pass', 'Auto rickshaw', 'Petrol', 'Ola ride', 'Bus ticket'],
    entertainment: ['Movie tickets', 'Netflix', 'Concert', 'Bowling night', 'Book purchase'],
    shopping: ['Amazon order', 'Clothes', 'Flipkart', 'Electronics', 'Shoes', 'Home decor'],
    bills: ['Electricity bill', 'Internet bill', 'Phone recharge', 'Water bill', 'Gas bill'],
    health: ['Gym membership', 'Medicine', 'Doctor visit', 'Health checkup'],
    groceries: ['Weekly groceries', 'Fruits & vegs', 'BigBasket order', 'Dairy products'],
    subscriptions: ['Spotify', 'Netflix', 'YouTube Premium', 'Cloud storage', 'ChatGPT Plus'],
    personal: ['Haircut', 'Skincare', 'Laundry', 'Dry cleaning'],
    salary: ['Monthly salary', 'Salary credited'],
    freelance: ['Client project', 'Consulting fee', 'Design work'],
  };
  private methods: Transaction['paymentMethod'][] = ['cash', 'card', 'upi', 'netbanking'];
  private moods: Transaction['mood'][] = ['need', 'want', 'impulse'];

  generateDemoData(): void {
    const transactions: Transaction[] = [];
    const today = new Date();

    for (let m = 2; m >= 0; m--) {
      const monthDate = subMonths(today, m);
      // Income
      transactions.push(this.makeTxn('salary', 'income', this.rand(50000, 80000), format(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1), 'yyyy-MM-dd'), 'Monthly salary'));
      if (Math.random() > 0.5) {
        transactions.push(this.makeTxn('freelance', 'income', this.rand(5000, 25000), format(new Date(monthDate.getFullYear(), monthDate.getMonth(), this.rand(5, 20)), 'yyyy-MM-dd'), 'Client project'));
      }
      // Expenses — 20-30 per month
      const numExpenses = this.rand(20, 30);
      for (let i = 0; i < numExpenses; i++) {
        const cat = this.expenseCats[Math.floor(Math.random() * this.expenseCats.length)];
        const day = Math.min(this.rand(1, 28), m === 0 ? today.getDate() : 28);
        const date = format(new Date(monthDate.getFullYear(), monthDate.getMonth(), day), 'yyyy-MM-dd');
        const amount = this.getAmountForCategory(cat);
        const noteList = this.notes[cat] || ['Misc expense'];
        const note = noteList[Math.floor(Math.random() * noteList.length)];
        transactions.push(this.makeTxn(cat, 'expense', amount, date, note));
      }
    }

    this.store.setTransactions(transactions);
    // Set budget
    const month = format(today, 'yyyy-MM');
    this.store.setBudget({
      month,
      totalLimit: 40000,
      categoryLimits: { food: 8000, transport: 4000, entertainment: 5000, shopping: 6000, bills: 5000, health: 3000, groceries: 5000, subscriptions: 2000, personal: 2000 },
      rollover: false,
    });
    // Set a sample goal
    this.store.addGoal({
      id: crypto.randomUUID(),
      name: 'Japan Trip',
      targetAmount: 200000,
      currentAmount: 45000,
      deadline: format(subMonths(today, -8), 'yyyy-MM-dd'),
      color: '#8b5cf6',
      icon: 'plane',
      createdAt: format(subMonths(today, 2), 'yyyy-MM-dd'),
      contributions: [
        { id: crypto.randomUUID(), amount: 25000, date: format(subMonths(today, 2), 'yyyy-MM-dd') },
        { id: crypto.randomUUID(), amount: 20000, date: format(subMonths(today, 1), 'yyyy-MM-dd') },
      ],
    });
  }

  private makeTxn(catId: string, type: 'income' | 'expense', amount: number, date: string, note: string): Transaction {
    return {
      id: crypto.randomUUID(), amount, type, categoryId: catId, note, date: date + 'T12:00:00.000Z',
      tags: [], isRecurring: false, paymentMethod: this.methods[Math.floor(Math.random() * this.methods.length)],
      mood: type === 'expense' ? this.moods[Math.floor(Math.random() * this.moods.length)] : undefined,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
  }

  private getAmountForCategory(cat: string): number {
    const ranges: Record<string, [number, number]> = {
      food: [100, 1500], transport: [50, 800], entertainment: [200, 2000], shopping: [500, 5000],
      bills: [300, 3000], health: [200, 2000], groceries: [200, 2000], subscriptions: [99, 999], personal: [100, 1000],
    };
    const [min, max] = ranges[cat] || [100, 1000];
    return Math.round(this.rand(min, max) / 10) * 10;
  }

  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
