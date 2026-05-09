import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LilyStore } from '../../core/store/lily.store';
import { DemoDataService } from '../../core/services/demo-data.service';
import { ConfettiService } from '../../core/services/confetti.service';
import { CURRENCIES } from '../../core/models/settings.model';
import {
  LucideFlower2, LucideCircleDollarSign, LucideBarChart3,
  LucideActivity, LucideSparkles, LucideArrowRight, LucideArrowLeft,
} from '@lucide/angular';

@Component({
  selector: 'lily-onboarding',
  standalone: true,
  imports: [
    FormsModule,
    LucideFlower2, LucideCircleDollarSign, LucideBarChart3,
    LucideActivity, LucideSparkles, LucideArrowRight, LucideArrowLeft,
  ],
  template: `
    <div class="onboarding">
      <div class="onboarding__content">
        @switch (step()) {
          @case (0) {
            <div class="onboarding__step animate-fade-in-up">
              <div class="onboarding__icon"><svg lucideFlower2 [size]="56" style="color: var(--color-violet)"></svg></div>
              <h1 class="onboarding__title">Welcome to Lily</h1>
              <p class="onboarding__desc">Your personal finance companion. Track expenses, visualize spending, and build better money habits.</p>
              <button class="btn btn--primary btn--lg" (click)="step.set(1)">
                Get Started <svg lucideArrowRight [size]="16"></svg>
              </button>
            </div>
          }
          @case (1) {
            <div class="onboarding__step animate-fade-in-up">
              <div class="onboarding__icon"><svg lucideCircleDollarSign [size]="48" style="color: var(--color-emerald)"></svg></div>
              <h2 class="onboarding__title">Choose Your Currency</h2>
              <p class="onboarding__desc">Select the currency you primarily use.</p>
              <div class="currency-grid">
                @for (cur of popularCurrencies; track cur.code) {
                  <button class="currency-option" [class.active]="selectedCurrency() === cur.code" (click)="selectedCurrency.set(cur.code)">
                    <span class="currency-option__symbol">{{ cur.symbol }}</span>
                    <span class="currency-option__code">{{ cur.code }}</span>
                  </button>
                }
              </div>
              <div class="onboarding__nav">
                <button class="btn btn--ghost" (click)="step.set(0)">
                  <svg lucideArrowLeft [size]="14"></svg> Back
                </button>
                <button class="btn btn--primary" (click)="saveCurrency(); step.set(2)">
                  Next <svg lucideArrowRight [size]="14"></svg>
                </button>
              </div>
            </div>
          }
          @case (2) {
            <div class="onboarding__step animate-fade-in-up">
              <div class="onboarding__icon"><svg lucideBarChart3 [size]="48" style="color: var(--color-violet)"></svg></div>
              <h2 class="onboarding__title">Monthly Budget</h2>
              <p class="onboarding__desc">Set a rough monthly budget target — you can always adjust later.</p>
              <div class="budget-input">
                <span class="budget-input__symbol">{{ currencySymbol() }}</span>
                <input type="number" class="budget-input__field" [(ngModel)]="monthlyBudget" placeholder="0" min="0">
              </div>
              <p class="text-sm text-tertiary" style="margin-top: var(--space-2)">This is optional — skip if unsure</p>
              <div class="onboarding__nav">
                <button class="btn btn--ghost" (click)="step.set(1)">
                  <svg lucideArrowLeft [size]="14"></svg> Back
                </button>
                <button class="btn btn--primary" (click)="saveBudget(); step.set(3)">
                  Next <svg lucideArrowRight [size]="14"></svg>
                </button>
              </div>
            </div>
          }
          @case (3) {
            <div class="onboarding__step animate-fade-in-up">
              <div class="onboarding__icon"><svg lucideActivity [size]="48" style="color: var(--color-amber)"></svg></div>
              <h2 class="onboarding__title">Start with Demo Data?</h2>
              <p class="onboarding__desc">Load 3 months of sample data to explore Lily's features, or start fresh with your own.</p>
              <div class="demo-options">
                <button class="demo-card" (click)="loadDemo()">
                  <span class="demo-card__icon"><svg lucideBarChart3 [size]="28"></svg></span>
                  <span class="demo-card__title">Load Demo Data</span>
                  <span class="demo-card__desc">See Lily in action</span>
                </button>
                <button class="demo-card" (click)="complete()">
                  <span class="demo-card__icon"><svg lucideSparkles [size]="28"></svg></span>
                  <span class="demo-card__title">Start Fresh</span>
                  <span class="demo-card__desc">Begin with a clean slate</span>
                </button>
              </div>
            </div>
          }
        }

        <!-- Step Indicator -->
        <div class="step-dots">
          @for (s of [0,1,2,3]; track s) {
            <div class="step-dot" [class.active]="step() === s" [class.completed]="step() > s"></div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .onboarding {
      min-height: 100vh; min-height: 100dvh; display: flex; align-items: center; justify-content: center;
      background: var(--color-bg-primary); padding: var(--space-6);
    }
    .onboarding__content { max-width: 480px; width: 100%; text-align: center; }
    .onboarding__step { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
    .onboarding__icon { animation: float 3s ease-in-out infinite; }
    .onboarding__title {
      font-size: var(--fs-3xl); font-weight: var(--fw-bold);
      background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .onboarding__desc { font-size: var(--fs-base); color: var(--color-text-secondary); line-height: var(--lh-relaxed); max-width: 380px; }
    .onboarding__nav { display: flex; gap: var(--space-3); margin-top: var(--space-4); width: 100%; justify-content: center; }
    .currency-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); width: 100%; }
    .currency-option {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-1); padding: var(--space-4);
      border-radius: var(--radius-xl); border: 2px solid var(--color-border); cursor: pointer; transition: all var(--duration-fast);
      &:hover { border-color: var(--color-border-hover); transform: translateY(-2px); }
      &.active { border-color: var(--color-violet); background: var(--color-violet-glow); }
      &__symbol { font-size: var(--fs-2xl); font-weight: var(--fw-bold); }
      &__code { font-size: var(--fs-sm); color: var(--color-text-secondary); }
    }
    .budget-input {
      display: flex; align-items: center; gap: var(--space-2); justify-content: center;
      &__symbol { font-size: var(--fs-3xl); color: var(--color-text-secondary); font-weight: var(--fw-semibold); }
      &__field {
        font-size: var(--fs-4xl); font-weight: var(--fw-bold); font-family: var(--font-mono);
        background: transparent; border: none; border-bottom: 2px solid var(--color-border);
        color: var(--color-text-primary); text-align: center; width: 200px; padding: var(--space-2);
        outline: none; transition: border-color var(--duration-fast);
        &:focus { border-color: var(--color-violet); }
        &::placeholder { color: var(--color-text-muted); }
      }
    }
    .demo-options { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); width: 100%; }
    .demo-card {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
      padding: var(--space-6) var(--space-4); border-radius: var(--radius-xl);
      border: 2px solid var(--color-border); cursor: pointer; transition: all var(--duration-fast);
      &:hover { border-color: var(--color-violet); transform: translateY(-2px); background: var(--color-violet-glow); }
      &__icon { color: var(--color-text-secondary); }
      &__title { font-size: var(--fs-base); font-weight: var(--fw-bold); }
      &__desc { font-size: var(--fs-xs); color: var(--color-text-tertiary); }
    }
    .step-dots { display: flex; gap: var(--space-2); justify-content: center; margin-top: var(--space-8); }
    .step-dot {
      width: 8px; height: 8px; border-radius: var(--radius-full); background: var(--color-border); transition: all var(--duration-fast);
      &.active { width: 24px; background: var(--color-violet); }
      &.completed { background: var(--color-violet-muted); }
    }
    input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; }
    input[type="number"] { -moz-appearance: textfield; }
  `],
})
export class OnboardingComponent {
  private store = inject(LilyStore);
  private demoService = inject(DemoDataService);
  private confetti = inject(ConfettiService);
  private router = inject(Router);

  step = signal(0);
  selectedCurrency = signal('INR');
  monthlyBudget = 0;

  popularCurrencies = CURRENCIES.slice(0, 6);

  currencySymbol = () => CURRENCIES.find(c => c.code === this.selectedCurrency())?.symbol || '₹';

  saveCurrency(): void {
    const cur = CURRENCIES.find(c => c.code === this.selectedCurrency());
    if (cur) this.store.updateSettings({ currency: cur });
  }

  saveBudget(): void {
    if (this.monthlyBudget > 0) {
      this.store.updateSettings({ monthlyBudgetTarget: this.monthlyBudget });
    }
  }

  loadDemo(): void {
    this.demoService.generateDemoData();
    this.complete();
  }

  complete(): void {
    this.store.completeOnboarding();
    this.confetti.burst();
    this.router.navigate(['/dashboard']);
  }
}
