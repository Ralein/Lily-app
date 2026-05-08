import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNow, parseISO, isToday, isYesterday, format } from 'date-fns';

@Pipe({ name: 'relativeDate', standalone: true })
export class RelativeDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    try {
      const date = parseISO(value);
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return value;
    }
  }
}
