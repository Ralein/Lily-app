import { Directive, ElementRef, inject, afterNextRender } from '@angular/core';

@Directive({ selector: '[lilyAutoFocus]', standalone: true })
export class AutoFocusDirective {
  private el = inject(ElementRef);

  constructor() {
    afterNextRender(() => {
      setTimeout(() => this.el.nativeElement.focus(), 50);
    });
  }
}
