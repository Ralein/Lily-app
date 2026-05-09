import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('200ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('150ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 0 }))
  ])
]);

export const slideDown = trigger('slideDown', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-20px) scale(0.98)' }),
    animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
  ]),
  transition(':leave', [
    animate('200ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 0, transform: 'translateY(-10px) scale(0.98)' }))
  ])
]);

export const slideUp = trigger('slideUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

export const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
      stagger('50ms', animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' })))
    ], { optional: true })
  ])
]);
