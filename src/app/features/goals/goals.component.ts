import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LilyStore } from '../../core/store/lily.store';
import { ToastService } from '../../core/services/toast.service';
import { ConfettiService } from '../../core/services/confetti.service';
import { CurrencyDisplayPipe } from '../../shared/pipes/currency-display.pipe';
import { SavingsGoal } from '../../core/models/goal.model';
import { LilyIconComponent } from '../../shared/icons/lily-icon.component';
import { differenceInDays, parseISO } from 'date-fns';
import {
  LucideTrash2, LucidePlus, LucideTrophy, LucideTarget,
} from '@lucide/angular';

@Component({
  selector: 'lily-goals',
  standalone: true,
  imports: [
    FormsModule, CurrencyDisplayPipe, LilyIconComponent,
    LucideTrash2, LucidePlus, LucideTrophy, LucideTarget,
  ],
  template: `
    <div class="goals-page">
      <div class="page-header" anim="fadeIn">
        <div class="header-content">
          <h1 class="page-header__title">Financial Goals</h1>
          <p class="page-header__subtitle">Saving for what matters most</p>
        </div>
        <div class="header-stats">
          <div class="stat-badge">
            <span class="stat-badge__label">Active</span>
            <span class="stat-badge__value">{{ store.goals().length }}</span>
          </div>
        </div>
      </div>

      <!-- Goals Grid -->
      <div class="goals-grid">
        @for (goal of store.goals(); track goal.id; let i = $index) {
          <div class="lily-card goal-card" [class.glass]="true" [style.--anim-delay]="(i * 100) + 'ms'" anim="slideUp">
            <div class="goal-card__header">
              <div class="goal-card__visual">
                <div class="goal-card__icon-wrapper" [style.background]="goal.color + '20'" [style.color]="goal.color">
                  <lily-icon [name]="goal.icon" [size]="28" />
                </div>
                <div class="goal-card__progress-ring">
                  <svg viewBox="0 0 36 36" class="circular-chart" [style.color]="goal.color">
                    <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="circle" [style.stroke-dasharray]="progressPct(goal) + ', 100'" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                </div>
              </div>
              
              <div class="goal-card__info">
                <h3 class="goal-card__name">{{ goal.name }}</h3>
                <div class="goal-card__meta">
                  <span class="deadline">
                    <lily-icon name="calendar" [size]="12" />
                    {{ daysLeft(goal) }} days left
                  </span>
                </div>
              </div>

              <button class="btn-action" (click)="deleteGoal(goal.id)" title="Delete goal">
                <svg lucideTrash2 [size]="16"></svg>
              </button>
            </div>

            <div class="goal-card__content">
              <div class="progress-section">
                <div class="progress-labels">
                  <span class="percentage">{{ progressPct(goal) }}%</span>
                  <span class="remaining-text">{{ goal.targetAmount - goal.currentAmount | currencyDisplay }} to go</span>
                </div>
                <div class="premium-progress">
                  <div class="premium-progress__track">
                    <div class="premium-progress__fill" 
                         [style.width.%]="progressPct(goal)" 
                         [style.background]="'linear-gradient(90deg, ' + goal.color + ', ' + goal.color + 'dd)'">
                      <div class="premium-progress__glow" [style.background]="goal.color"></div>
                    </div>
                  </div>
                </div>
                <div class="amount-summary">
                  <div class="amount-item">
                    <span class="label">Saved</span>
                    <span class="value">{{ goal.currentAmount | currencyDisplay }}</span>
                  </div>
                  <div class="amount-item text-right">
                    <span class="label">Target</span>
                    <span class="value">{{ goal.targetAmount | currencyDisplay }}</span>
                  </div>
                </div>
              </div>

              <div class="projection-box">
                <div class="projection-item">
                  <div class="icon-box"><svg lucideTarget [size]="14"></svg></div>
                  <div class="text-content">
                    <span class="label">Monthly Target</span>
                    <span class="value">{{ requiredMonthly(goal) | currencyDisplay }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="goal-card__footer">
              <div class="contribution-control">
                <div class="input-wrapper">
                  <span class="currency">{{ store.currencySymbol() }}</span>
                  <input type="number" [(ngModel)]="contributeAmounts[goal.id]" placeholder="0.00">
                </div>
                <button class="btn-contribute" (click)="contribute(goal)" [style.background]="goal.color">
                  <svg lucidePlus [size]="18"></svg>
                  <span>Add Funds</span>
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-state" anim="fadeIn">
            <div class="empty-state__visual">
              <div class="empty-state__icon"><svg lucideTrophy [size]="48"></svg></div>
              <div class="empty-state__blobs"></div>
            </div>
            <h3 class="empty-state__title">Dream Big</h3>
            <p class="empty-state__description">Set your first savings goal and let Lily help you reach it with smart tracking and projections.</p>
          </div>
        }

        <!-- Add Goal CTA -->
        <button class="add-goal-premium" (click)="showAddForm.set(!showAddForm())" [class.active]="showAddForm()" anim="slideUp" style="--anim-delay: 300ms">
          <div class="cta-inner">
            <div class="plus-icon"><svg lucidePlus [size]="32"></svg></div>
            <span class="cta-label">Initialize New Goal</span>
          </div>
          <div class="cta-bg-glow"></div>
        </button>
      </div>

      <!-- Add Goal Premium Form Overlay -->
      @if (showAddForm()) {
        <div class="form-overlay" (click)="$event.target === overlay && showAddForm.set(false)" #overlay>
          <div class="lily-card form-card glass premium" anim="scaleIn">
            <div class="form-card__header">
              <div class="title-group">
                <h3 class="form-card__title">Goal Setup</h3>
                <p class="form-card__subtitle">Configure your next financial milestone</p>
              </div>
              <button class="btn-close" (click)="showAddForm.set(false)">
                <svg lucideTrash2 [size]="18"></svg>
              </button>
            </div>
            
            <div class="form-card__body">
              <div class="form-row">
                <div class="field-group full">
                  <label>Goal Name</label>
                  <input type="text" class="premium-input" [(ngModel)]="newGoal.name" placeholder="e.g. Wedding Fund, New Car...">
                </div>
              </div>
              
              <div class="form-row split">
                <div class="field-group">
                  <label>Target Amount</label>
                  <div class="premium-input-wrapper">
                    <span class="symbol">{{ store.currencySymbol() }}</span>
                    <input type="number" [(ngModel)]="newGoal.targetAmount" placeholder="0.00">
                  </div>
                </div>
                
                <div class="field-group">
                  <label>Completion Date</label>
                  <input type="date" class="premium-input" [(ngModel)]="newGoal.deadline">
                </div>
              </div>

              <div class="field-group">
                <label>Theme Identity</label>
                <div class="selection-grid">
                  <div class="color-selection">
                    @for (c of goalColors; track c) {
                      <button class="color-pill" 
                              [style.background]="c" 
                              [class.active]="newGoal.color === c" 
                              (click)="newGoal.color = c">
                        <div class="inner-ring"></div>
                      </button>
                    }
                  </div>
                  
                  <div class="icon-selection">
                    @for (icon of goalIcons; track icon.name) {
                      <button class="icon-pill" 
                              [class.active]="newGoal.icon === icon.name" 
                              (click)="newGoal.icon = icon.name"
                              [style.color]="newGoal.icon === icon.name ? newGoal.color : ''">
                        <lily-icon [name]="icon.name" [size]="20" />
                        <span class="icon-label">{{ icon.label }}</span>
                      </button>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div class="form-card__footer">
              <button class="btn-submit" (click)="createGoal()" [style.background]="newGoal.color">
                <span>Launch Goal</span>
                <lily-icon name="sparkles" [size]="18" />
              </button>
              <button class="btn-cancel" (click)="showAddForm.set(false)">Discard</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .goals-page { display: flex; flex-direction: column; gap: var(--space-8); padding-bottom: var(--space-20); }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-end;
      .page-header__title { font-size: 32px; font-weight: 900; letter-spacing: -0.03em; color: var(--color-text-primary); margin-bottom: 4px; }
      .page-header__subtitle { font-size: var(--fs-base); color: var(--color-text-tertiary); font-weight: 500; }
      
      .stat-badge {
        background: var(--color-bg-secondary); padding: 8px 16px; border-radius: var(--radius-full); border: 1px solid var(--color-border);
        display: flex; align-items: center; gap: var(--space-2);
        &__label { font-size: 11px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; }
        &__value { font-size: var(--fs-base); font-weight: 800; color: var(--color-violet); }
      }
    }

    .goals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: var(--space-6); }

    .goal-card {
      padding: var(--space-6);
      display: flex; flex-direction: column; gap: var(--space-6);
      position: relative; overflow: hidden;
      transition: all 0.4s var(--ease-spring);
      
      &:hover { transform: translateY(-8px) scale(1.01); box-shadow: var(--shadow-2xl); }

      &__header { 
        display: flex; align-items: center; gap: var(--space-4); 
        .goal-card__visual { position: relative; width: 64px; height: 64px; }
        .goal-card__icon-wrapper { 
          position: absolute; inset: 6px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          z-index: 2;
        }
        .circular-chart { display: block; margin: 0 auto; max-width: 100%; max-height: 100%; }
        .circle-bg { stroke: var(--color-bg-input); stroke-width: 2.8; fill: none; }
        .circle { stroke-width: 2.8; stroke-linecap: round; fill: none; transition: stroke-dasharray 1s ease-in-out; }
        
        .goal-card__info { flex: 1; }
        .goal-card__name { font-size: var(--fs-xl); font-weight: 900; color: var(--color-text-primary); margin-bottom: 2px; }
        .goal-card__meta { 
          display: flex; gap: var(--space-3);
          .deadline { font-size: 11px; font-weight: 800; color: var(--color-text-tertiary); display: flex; align-items: center; gap: 4px; text-transform: uppercase; }
        }
        
        .btn-action { 
          width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
          color: var(--color-text-tertiary); background: transparent; border: 1px solid transparent; cursor: pointer;
          transition: all 0.2s;
          &:hover { background: rgba(244, 63, 94, 0.1); color: var(--color-expense); border-color: rgba(244, 63, 94, 0.2); }
        }
      }

      &__content {
        display: flex; flex-direction: column; gap: var(--space-5);
        
        .progress-section {
          .progress-labels { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--space-2); }
          .percentage { font-size: 32px; font-weight: 900; color: var(--color-text-primary); line-height: 1; }
          .remaining-text { font-size: 12px; font-weight: 700; color: var(--color-text-tertiary); }
          
          .premium-progress { 
            height: 10px; border-radius: var(--radius-full); background: var(--color-bg-input); overflow: visible; position: relative; margin: 4px 0;
            &__track { height: 100%; width: 100%; border-radius: inherit; overflow: hidden; }
            &__fill { height: 100%; border-radius: inherit; position: relative; transition: width 1.5s var(--ease-spring); }
            &__glow { position: absolute; inset: 0; filter: blur(12px); opacity: 0.4; }
          }
          
          .amount-summary { 
            display: flex; justify-content: space-between; margin-top: var(--space-4);
            .amount-item { 
              display: flex; flex-direction: column;
              .label { font-size: 10px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; margin-bottom: 2px; }
              .value { font-size: var(--fs-sm); font-weight: 700; color: var(--color-text-secondary); }
            }
          }
        }

        .projection-box {
          background: var(--color-bg-input); padding: var(--space-4); border-radius: var(--radius-xl); border: 1px solid var(--color-border);
          .projection-item {
            display: flex; align-items: center; gap: var(--space-3);
            .icon-box { width: 32px; height: 32px; border-radius: 8px; background: var(--color-bg-secondary); display: flex; align-items: center; justify-content: center; color: var(--color-violet); }
            .text-content {
              display: flex; flex-direction: column;
              .label { font-size: 10px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; }
              .value { font-size: var(--fs-base); font-weight: 800; color: var(--color-text-primary); }
            }
          }
        }
      }

      &__footer {
        padding-top: var(--space-2);
        .contribution-control {
          display: flex; gap: var(--space-3);
          .input-wrapper {
            flex: 1; display: flex; align-items: center; gap: var(--space-2); background: var(--color-bg-input); padding: 0 16px; border-radius: 14px; border: 1px solid var(--color-border);
            height: 48px; transition: all 0.2s;
            &:focus-within { border-color: var(--color-violet); box-shadow: 0 0 0 4px var(--color-violet-glow); }
            .currency { font-weight: 800; color: var(--color-text-tertiary); }
            input { background: transparent; border: none; outline: none; font-weight: 800; color: var(--color-text-primary); width: 100%; font-size: var(--fs-base); }
          }
          .btn-contribute {
            height: 48px; padding: 0 20px; border-radius: 14px; border: none; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 800;
            transition: all 0.3s;
            &:hover { transform: scale(1.05); filter: brightness(1.1); box-shadow: var(--shadow-lg); }
            &:active { transform: scale(0.95); }
          }
        }
      }
    }

    .add-goal-premium {
      background: var(--color-bg-secondary); border: 2px dashed var(--color-border); border-radius: 24px; padding: var(--space-12) var(--space-6); cursor: pointer; position: relative; overflow: hidden;
      transition: all 0.4s var(--ease-spring);
      &:hover { 
        border-style: solid; border-color: var(--color-violet); background: var(--color-bg-input); transform: translateY(-4px);
        .plus-icon { background: var(--color-violet); color: white; transform: rotate(90deg) scale(1.1); }
        .cta-bg-glow { opacity: 1; }
      }
      .cta-inner { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
      .plus-icon { width: 64px; height: 64px; border-radius: 20px; background: var(--color-bg-input); display: flex; align-items: center; justify-content: center; color: var(--color-text-tertiary); transition: all 0.4s var(--ease-spring); }
      .cta-label { font-size: var(--fs-lg); font-weight: 800; color: var(--color-text-secondary); letter-spacing: -0.01em; }
      .cta-bg-glow { position: absolute; inset: 0; background: radial-gradient(circle at center, var(--color-violet-glow) 0%, transparent 70%); opacity: 0; transition: opacity 0.4s; }
    }

    .form-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: var(--space-6);
    }
    
    .form-card {
      width: 100%; max-width: 560px; padding: var(--space-8); position: relative; border: 1px solid rgba(255,255,255,0.1);
      &__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-8); }
      &__title { font-size: 28px; font-weight: 900; letter-spacing: -0.03em; margin-bottom: 4px; }
      &__subtitle { color: var(--color-text-tertiary); font-weight: 500; }
      
      .btn-close { width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--color-text-tertiary); cursor: pointer; transition: all 0.2s; &:hover { background: rgba(244,63,94,0.1); color: var(--color-expense); } }
      
      .form-card__body { display: flex; flex-direction: column; gap: var(--space-8); }
      .form-row { display: flex; gap: var(--space-6); &.split > * { flex: 1; } }
      
      .field-group { 
        display: flex; flex-direction: column; gap: var(--space-3);
        label { font-size: 11px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
        .premium-input { background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 14px; height: 52px; padding: 0 20px; font-size: var(--fs-base); font-weight: 600; color: var(--color-text-primary); transition: all 0.2s; &:focus { border-color: var(--color-violet); box-shadow: 0 0 0 4px var(--color-violet-glow); outline: none; } }
        .premium-input-wrapper { 
          position: relative; display: flex; align-items: center; background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 14px; height: 52px; padding: 0 20px; transition: all 0.2s;
          &:focus-within { border-color: var(--color-violet); box-shadow: 0 0 0 4px var(--color-violet-glow); }
          .symbol { font-weight: 800; color: var(--color-text-tertiary); font-size: var(--fs-xl); margin-right: 12px; }
          input { background: transparent; border: none; outline: none; font-size: var(--fs-xl); font-weight: 800; color: var(--color-text-primary); width: 100%; }
        }
      }

      .selection-grid {
        display: flex; flex-direction: column; gap: var(--space-6);
        .color-selection { display: flex; gap: 10px; flex-wrap: wrap; }
        .color-pill { 
          width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s var(--ease-spring);
          .inner-ring { width: 0; height: 0; border: 2px solid white; border-radius: 50%; opacity: 0; transition: all 0.2s; }
          &.active { transform: scale(1.2); box-shadow: 0 0 20px rgba(0,0,0,0.2); .inner-ring { width: 20px; height: 20px; opacity: 1; } }
        }
        
        .icon-selection { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; }
        .icon-pill { 
          height: 44px; padding: 0 12px; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-bg-input); cursor: pointer; display: flex; align-items: center; gap: 8px; color: var(--color-text-tertiary); transition: all 0.2s;
          .icon-label { font-size: 11px; font-weight: 700; text-transform: capitalize; }
          &:hover { background: var(--color-bg-secondary); color: var(--color-text-primary); }
          &.active { background: white; color: var(--color-bg-dark); border-color: white; transform: scale(1.05); box-shadow: var(--shadow-lg); }
        }
      }

      &__footer { 
        margin-top: var(--space-10); display: flex; flex-direction: column; gap: var(--space-3);
        .btn-submit { height: 56px; border: none; border-radius: 16px; color: white; font-weight: 900; font-size: var(--fs-lg); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: all 0.3s; &:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: var(--shadow-lg); } &:active { transform: translateY(0); } }
        .btn-cancel { height: 48px; background: transparent; border: none; color: var(--color-text-tertiary); font-weight: 700; cursor: pointer; &:hover { color: var(--color-text-secondary); } }
      }
    }

    .empty-state {
      grid-column: 1 / -1; padding: var(--space-20) 0; display: flex; flex-direction: column; align-items: center; gap: var(--space-6); text-align: center;
      &__visual { 
        position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;
        .empty-state__icon { z-index: 2; color: var(--color-violet); filter: drop-shadow(0 0 20px var(--color-violet-glow)); }
        .empty-state__blobs { position: absolute; inset: 0; background: radial-gradient(circle, var(--color-violet-glow) 0%, transparent 70%); border-radius: 50%; filter: blur(20px); opacity: 0.5; animation: pulse 4s infinite; }
      }
      &__title { font-size: 28px; font-weight: 900; letter-spacing: -0.02em; }
      &__description { font-size: var(--fs-base); color: var(--color-text-tertiary); max-width: 380px; line-height: 1.6; }
    }

    @media (max-width: 1024px) {
      .goals-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; align-items: flex-start; gap: var(--space-4); }
      .page-header__title { font-size: 28px; }
      
      .goals-grid { grid-template-columns: 1fr; }
      .goal-card { padding: var(--space-5); gap: var(--space-5); }
      .goal-card__header { flex-direction: column; align-items: flex-start; gap: var(--space-4); 
        .goal-card__info { width: 100%; }
        .btn-action { position: absolute; top: var(--space-5); right: var(--space-5); }
      }
      .goal-card__content { 
        .percentage { font-size: 24px; }
        .amount-summary { flex-direction: column; gap: var(--space-3); .amount-item.text-right { text-align: left; } }
      }
      .goal-card__footer .contribution-control { flex-direction: column; 
        .btn-contribute { width: 100%; justify-content: center; }
      }
      
      .form-card { padding: var(--space-6); 
        &__title { font-size: 24px; }
        .form-row.split { flex-direction: column; gap: var(--space-8); }
        .icon-selection { grid-template-columns: repeat(2, 1fr); }
      }
      
      .add-goal-premium { padding: var(--space-8) var(--space-4); }
    }

    @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0.8; } }
  `],
})
export class GoalsComponent {
  store = inject(LilyStore);
  private toast = inject(ToastService);
  private confetti = inject(ConfettiService);

  showAddForm = signal(false);
  contributeAmounts: Record<string, number> = {};

  goalColors = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9', '#f43f5e', '#6366f1', '#14b8a6'];
  goalIcons = [
    { name: 'plane', label: 'Travel' },
    { name: 'house', label: 'Home' },
    { name: 'car', label: 'Car' },
    { name: 'graduation-cap', label: 'Education' },
    { name: 'laptop', label: 'Tech' },
    { name: 'smartphone', label: 'Phone' },
    { name: 'target', label: 'Target' },
    { name: 'trophy', label: 'Prize' },
    { name: 'gift', label: 'Gift' },
    { name: 'sparkles', label: 'Other' },
  ];

  newGoal = { name: '', targetAmount: 0, deadline: '', color: '#8b5cf6', icon: 'plane' };

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
    this.toast.success('Goal created!');
    this.showAddForm.set(false);
    this.newGoal = { name: '', targetAmount: 0, deadline: '', color: '#8b5cf6', icon: 'plane' };
  }

  contribute(goal: SavingsGoal): void {
    const amount = this.contributeAmounts[goal.id];
    if (!amount || amount <= 0) { this.toast.warning('Enter a valid amount'); return; }
    this.store.contributeToGoal(goal.id, amount);
    this.contributeAmounts[goal.id] = 0;
    const newTotal = goal.currentAmount + amount;
    if (newTotal >= goal.targetAmount) {
      this.confetti.fireworks();
      this.toast.success('Goal reached! Congratulations!');
    } else {
      this.toast.success(`Added ${this.store.currencySymbol()}${amount.toLocaleString()} to ${goal.name}`);
    }
  }

  deleteGoal(id: string): void {
    this.store.deleteGoal(id);
    this.toast.success('Goal deleted');
  }
}
