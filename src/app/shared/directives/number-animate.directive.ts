import { Directive, ElementRef, input, effect, inject } from '@angular/core';
import gsap from 'gsap';

@Directive({ selector: '[lilyNumberAnimate]', standalone: true })
export class NumberAnimateDirective {
  private el = inject(ElementRef);
  lilyNumberAnimate = input<number>(0);
  duration = input<number>(1);

  constructor() {
    effect(() => {
      const target = this.lilyNumberAnimate();
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        this.el.nativeElement.textContent = Math.round(target).toLocaleString();
        return;
      }
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: this.duration(),
        ease: 'power2.out',
        onUpdate: () => {
          this.el.nativeElement.textContent = Math.round(obj.val).toLocaleString();
        },
      });
    });
  }
}
