import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LilyStore } from '../../core/store/lily.store';
import { ToastService } from '../../core/services/toast.service';
import { ConfettiService } from '../../core/services/confetti.service';
import { CurrencyDisplayPipe } from '../../shared/pipes/currency-display.pipe';
import { SavingsGoal } from '../../core/models/goal.model';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';

@Component({
  selector: 'lily-goals',
  standalone: true,
  imports: [FormsModule, CurrencyDisplayPipe],
  template: `
    <div class="page-header">
      <h1 class="page-header__title">Savings Goals</h1>
      <p class="page-header__subtitle">{{ store.goals().length }} active goals</p>
    </div>

    <!-- Goal Cards -->
    <div class="goals-grid">
      @for (goal of store.goals(); track goal.id) {
        <div class="lily-card goal-card animate-fade-in-up">
          <div class="goal-card__header">
            <div class="goal-card__icon" [style.background]="goal.color + '22'">{{ goal.icon }}</div>
            <div class="goal-card__info">
              <h3 class="goal-card__name">{{ goal.name }}</h3>
              <span class="text-xs text-tertiary">{{ daysLeft(goal) }} days left</span>
            </div>
            <button class="btn btn--ghost btn--sm" (click)="deleteGoal(goal.id)">🗑️</button>
          </div>

          <div class="goal-card__progress">
            <div class="progress-bar" style="height: 10px">
              <div class="progress-bar__fill" [style.width.%]="progressPct(goal)" [style.background]="goal.color"></div>
            </div>
            <div class="goal-card__amounts">
              <span class="text-sm font-semibold">{{ goal.currentAmount | currencyDisplay }}</span>
              <span class="text-xs text-tertiary">of {{ goal.targetAmount | currencyDisplay }}</span>
            </div>
          </div>

          <div class="goal-card__projection">
            <span class="text-xs text-tertiary">Need {{ requiredMonthly(goal) | currencyDisplay }}/month to hit target</span>
          </div>

          <!-- Contribute -->
          <div class="goal-card__contribute">
            <input type="number" class="input input--sm" [(ngModel)]="contributeAmounts[goal.id]" placeholder="Amount" style="flex: 1; max-width: 120px" min="0">
            <button class="btn btn--primary btn--sm" (click)="contribute(goal)">+ Add</button>
          </div>
        </div>
      } @empty {
        <div class="empty-state" style="grid-column: 1 / -1">
          <span class="empty-state__icon">🏆</span>
          <p class="empty-state__title">No goals yet</p>
          <p class="empty-state__description">Set a savings goal and start building towards it</p>
        </div>
      }

      <!-- Add Goal Card -->
      <div class="lily-card goal-card goal-card--add animate-fade-in-up" (click)="showAddForm.set(!showAddForm())">
        @if (!showAddForm()) {
          <div class="goal-card--add__placeholder">
            <span class="text-3xl">+</span>
            <span class="text-sm text-tertiary">New Goal</span>
          </div>
        }
      </div>
    </div>

    <!-- Add Goal Form -->
    @if (showAddForm()) {
      <div class="lily-card animate-fade-in-up" style="margin-top: var(--space-4)">
        <h3 class="lily-card__title" style="margin-bottom: var(--space-4)">Create New Goal</h3>
        <div class="goal-form">
          <input type="text" class="input" [(ngModel)]="newGoal.name" placeholder="Goal name (e.g. Japan Trip ✈️)">
          <div class="flex gap-3 flex-wrap">
            <div class="flex flex-col gap-1" style="flex: 1">
              <label class="filter-label">Target Amount</label>
              <input type="number" class="input" [(ngModel)]="newGoal.targetAmount" placeholder="0" min="0">
            </div>
            <div class="flex flex-col gap-1" style="flex: 1">
              <label class="filter-label">Deadline</label>
              <input type="date" class="input" [(ngModel)]="newGoal.deadline">
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="filter-label">Color</label>
            <div class="flex gap-2">
              @for (c of goalColors; track c) {
                <button class="color-dot" [style.background]="c" [class.active]="newGoal.color === c" (click)="newGoal.color = c"></button>
              }
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="filter-label">Icon</label>
            <div class="flex gap-2 flex-wrap">
              @for (icon of goalIcons; track icon) {
                <button class="pill" [class.active]="newGoal.icon === icon" (click)="newGoal.icon = icon">{{ icon }}</button>
              }
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn--primary" (click)="createGoal()">Create Goal</button>
            <button class="btn btn--ghost" (click)="showAddForm.set(false)">Cancel</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .goals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-4); }
    .goal-card {
      &__header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
      &__icon { width: 44px; height: 44px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
      &__info { flex: 1; }
      &__name { font-size: var(--fs-lg); font-weight: var(--fw-bold); }
      &__progress { margin-bottom: var(--space-3); }
      &__amounts { display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-2); }
      &__projection { margin-bottom: var(--space-3); }
      &__contribute { display: flex; gap: var(--space-2); align-items: center; }
      &--add { cursor: pointer; border: 2px dashed var(--color-border); &:hover { border-color: var(--color-violet); } }
      &--add__placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-8) 0; color: var(--color-text-tertiary); }
    }
    .goal-form { display: flex; flex-direction: column; gap: var(--space-4); }
    .color-dot { width: 28px; height: 28px; border-radius: var(--radius-full); border: 2px solid transparent; cursor: pointer; transition: all var(--duration-fast);
      &.active { border-color: white; box-shadow: var(--shadow-glow); transform: scale(1.15); }
    }
  `],
})
export class GoalsComponent {
  store = inject(LilyStore);
  private toast = inject(ToastService);
  private confetti = inject(ConfettiService);

  showAddForm = signal(false);
  contributeAmounts: Record<string, number> = {};

  goalColors = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9', '#f43f5e', '#6366f1', '#14b8a6'];
  goalIcons = ['✈️', '🏠', '🚗', '📚', '💻', '🎮', '🏋️', '💍', '🎓', '🏖️', '🎸', '📱'];

  newGoal = { name: '', targetAmount: 0, deadline: '', color: '#8b5cf6', icon: '✈️' };

  progressPct(goal: SavingsGoal): number {
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  }

  daysLeft(goal: SavingsGoal): number {
    return Math.max(0, differenceInDays(parseISO(goal.deadline), new Date()));
  }

  requiredMonthly(goal: SavingsGoal): number {
    const remaining = goal.targetAmount - goal.currentAmount;
    const months = Math.max(1, this.daysLeft(goal) / 30);
    return Math.ceil(remaining / months);
  }

  createGoal(): void {
    if (!this.newGoal.name || !this.newGoal.targetAmount || !this.newGoal.deadline) {
      this.toast.warning('Fill in all fields'); return;
    }
    this.store.addGoal({
      id: crypto.randomUUID(),
      name: this.newGoal.name,
      targetAmount: this.newGoal.targetAmount,
      currentAmount: 0,
      deadline: this.newGoal.deadline,
      color: this.newGoal.color,
      icon: this.newGoal.icon,
      createdAt: new Date().toISOString(),
      contributions: [],
    });
    this.toast.success('Goal created! 🎯');
    this.showAddForm.set(false);
    this.newGoal = { name: '', targetAmount: 0, deadline: '', color: '#8b5cf6', icon: '✈️' };
  }

  contribute(goal: SavingsGoal): void {
    const amount = this.contributeAmounts[goal.id];
    if (!amount || amount <= 0) { this.toast.warning('Enter a valid amount'); return; }
    this.store.contributeToGoal(goal.id, amount);
    this.contributeAmounts[goal.id] = 0;
    const newTotal = goal.currentAmount + amount;
    if (newTotal >= goal.targetAmount) {
      this.confetti.fireworks();
      this.toast.success('🎉 Goal reached! Congratulations!');
    } else {
      this.toast.success(`Added ${this.store.currencySymbol()}${amount.toLocaleString()} to ${goal.name}`);
    }
  }

  deleteGoal(id: string): void {
    this.store.deleteGoal(id);
    this.toast.success('Goal deleted');
  }
}
