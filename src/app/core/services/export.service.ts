import { Injectable, inject } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { LilyStore } from '../store/lily.store';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private store = inject(LilyStore);

  exportCSV(transactions: Transaction[]): void {
    const cats = this.store.categoryMap();
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Note', 'Payment Method', 'Mood', 'Tags'];
    const rows = transactions.map(t => [
      t.date, t.type, cats.get(t.categoryId)?.name || t.categoryId, t.amount.toString(),
      `"${t.note.replace(/"/g, '""')}"`, t.paymentMethod, t.mood || '', t.tags.join(';')
    ].join(','));
    this.download([headers.join(','), ...rows].join('\n'), 'lily-transactions.csv', 'text/csv');
  }

  exportJSON(): void {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions: this.store.transactions(),
      categories: this.store.categories(),
      budgets: this.store.budgets(),
      goals: this.store.goals(),
      settings: this.store.settings(),
    };
    this.download(JSON.stringify(data, null, 2), 'lily-backup.json', 'application/json');
  }

  importJSON(json: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(json);
      if (!data.version) return { success: false, message: 'Invalid backup file format' };
      this.store.importData(data);
      return { success: true, message: `Imported ${data.transactions?.length || 0} transactions` };
    } catch {
      return { success: false, message: 'Failed to parse backup file' };
    }
  }

  parseCSV(csv: string): { headers: string[]; rows: string[][] } {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const result: string[] = [];
      let current = ''; let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
        else { current += char; }
      }
      result.push(current.trim());
      return result;
    });
    return { headers, rows };
  }

  private download(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}
