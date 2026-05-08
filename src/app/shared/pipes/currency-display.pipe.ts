import { Pipe, PipeTransform, inject } from '@angular/core';
import { LilyStore } from '../../core/store/lily.store';

@Pipe({ name: 'currencyDisplay', standalone: true })
export class CurrencyDisplayPipe implements PipeTransform {
  private store = inject(LilyStore);

  transform(value: number | null | undefined, showSign = false): string {
    if (value === null || value === undefined) return '';
    const config = this.store.settings().currency;
    const formatted = Math.abs(value).toLocaleString(config.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const sign = showSign ? (value >= 0 ? '+' : '-') : (value < 0 ? '-' : '');
    return config.position === 'before' ? `${sign}${config.symbol}${formatted}` : `${sign}${formatted}${config.symbol}`;
  }
}
