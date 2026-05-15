import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { LilyStore } from '../../core/store/lily.store';
import { ConfettiService } from '../../core/services/confetti.service';
import { CURRENCIES } from '../../core/models/settings.model';
import { IncomeSource, BUDGET_RULE, FREQUENCY_TO_MONTHLY } from '../../core/models/income.model';
import { format } from 'date-fns';
import { LilyIconComponent } from '../../shared/icons/lily-icon.component';
@Component({
  selector: 'lily-onboarding',
  standalone: true,
  imports: [
    FormsModule, DecimalPipe, LilyIconComponent,
  ],
  template: `
    <div class="onboarding-wrapper">
      <!-- Background Elements -->
      <div class="bg-blur bg-blur--1"></div>
      <div class="bg-blur bg-blur--2"></div>

      <div class="onboarding-container">
        <!-- Progress Stepper -->
        <div class="stepper" anim="fadeIn">
          @for (s of steps; track s.id; let i = $index) {
            <div class="stepper__item" 
                 [class.active]="step() === i" 
                 [class.completed]="step() > i">
              <div class="stepper__dot">
                @if (step() > i) { <lily-icon name="check" [size]="12" /> }
                @else { <span>{{ i + 1 }}</span> }
              </div>
              <span class="stepper__label">{{ s.label }}</span>
              @if (i < steps.length - 1) {
                <div class="stepper__line"></div>
              }
            </div>
          }
        </div>

        <div class="step-content">
          @switch (step()) {
            @case (0) {
              <!-- Welcome -->
              <div class="step-card" anim="slideUp">
                <div class="step-card__logo welcome-logo">
                  <img src="logo.png" alt="Lily Logo" class="logo-image">
                </div>
                <h1 class="step-card__title">Welcome to <span class="text-gradient">Lily</span></h1>
                <p class="step-card__desc">Your financial ecosystem, refined. Lily helps you orchestrate your income, budgets, and goals with surgical precision and beautiful clarity.</p>
                
                <div class="feature-pills">
                  <div class="pill"><lily-icon name="shield-check" [size]="14" /> Privacy First</div>
                  <div class="pill"><lily-icon name="zap" [size]="14" /> Real-time Sync</div>
                  <div class="pill"><lily-icon name="layers" [size]="14" /> Smart Budgets</div>
                </div>

                <button class="btn-premium primary" (click)="nextStep()">
                  <span>Begin Initialization</span>
                  <lily-icon name="arrow-right" [size]="18" />
                </button>
              </div>
            }

            @case (1) {
              <!-- Currency -->
              <div class="step-card" anim="slideUp">
                <div class="step-card__header">
                  <h2 class="step-card__title">Primary Currency</h2>
                  <p class="step-card__desc">Select the baseline currency for your financial tracking.</p>
                </div>

                <div class="currency-grid">
                  @for (cur of popularCurrencies; track cur.code) {
                    <button class="currency-card" 
                            [class.active]="selectedCurrency() === cur.code" 
                            (click)="selectedCurrency.set(cur.code)">
                      <div class="currency-card__info">
                        <span class="symbol">{{ cur.symbol }}</span>
                        <span class="code">{{ cur.code }}</span>
                      </div>
                      <span class="name">{{ cur.name }}</span>
                      <div class="active-ring"></div>
                    </button>
                  }
                </div>

                <div class="step-actions">
                  <button class="btn-premium ghost" (click)="prevStep()">
                    <lily-icon name="arrow-left" [size]="18" />
                    <span>Back</span>
                  </button>
                  <button class="btn-premium primary" (click)="saveCurrency(); nextStep()">
                    <span>Continue</span>
                    <lily-icon name="arrow-right" [size]="18" />
                  </button>
                </div>
              </div>
            }

            @case (2) {
              <!-- Income -->
              <div class="step-card step-card--large" anim="slideUp">
                <div class="step-card__header">
                  <h2 class="step-card__title">Income Architecture</h2>
                  <p class="step-card__desc">Define your monthly inflow. Lily uses this to architect your budget rules.</p>
                </div>

                <div class="income-manager">
                  <div class="income-list custom-scrollbar">
                    @for (source of tempSources(); track source.id; let i = $index) {
                      <div class="income-item glass" anim="fadeIn">
                        <div class="income-item__name">
                          <label>Source Name</label>
                          <input type="text" [ngModel]="source.name" (ngModelChange)="updateSource(i, {name: $event})" placeholder="e.g. Main Salary" />
                        </div>
                        <div class="income-item__amount">
                          <label>Amount</label>
                          <div class="input-wrap">
                            <span class="symbol">{{ currencySymbol() }}</span>
                            <input type="number" [ngModel]="source.amount" (ngModelChange)="updateSource(i, {amount: $event})" placeholder="0" />
                          </div>
                        </div>
                        <div class="income-item__freq">
                          <label>Frequency</label>
                          <select [ngModel]="source.frequency" (ngModelChange)="updateSource(i, {frequency: $event})">
                            <option value="monthly">Monthly</option>
                            <option value="biweekly">Bi-weekly</option>
                            <option value="weekly">Weekly</option>
                            <option value="one-time">One-time</option>
                          </select>
                        </div>
                        <button class="btn-delete" (click)="removeSource(i)" [disabled]="tempSources().length === 1">
                          <lily-icon name="trash-2" [size]="16" />
                        </button>
                      </div>
                    }
                  </div>

                  <button class="btn-add-source" (click)="addSource()">
                    <lily-icon name="plus" [size]="16" />
                    <span>Register Another Source</span>
                  </button>

                  @if (tempTotalIncome() > 0) {
                    <div class="total-bar glass">
                      <div class="label-group">
                        <span class="label">Total Estimated Inflow</span>
                        <span class="monthly">per month</span>
                      </div>
                      <span class="value text-income">{{ currencySymbol() }}{{ tempTotalIncome() | number:'1.0-0' }}</span>
                    </div>
                  }
                </div>

                <div class="step-actions">
                  <button class="btn-premium ghost" (click)="prevStep()">
                    <lily-icon name="arrow-left" [size]="18" />
                    <span>Back</span>
                  </button>
                  <button class="btn-premium primary" (click)="saveIncome(); nextStep()" [disabled]="tempTotalIncome() <= 0">
                    <span>Continue</span>
                    <lily-icon name="arrow-right" [size]="18" />
                  </button>
                </div>
              </div>
            }

            @case (3) {
              <!-- Budget -->
              <div class="step-card step-card--large" anim="slideUp">
                <div class="step-card__header">
                  <h2 class="step-card__title">Budget Allocation</h2>
                  <p class="step-card__desc">Optimizing your 50/30/20 rule. Adjust limits based on your lifestyle.</p>
                </div>

                <div class="budget-planner">
                  <div class="visualization glass">
                    <div class="progress-labels">
                      <div class="l needs" [style.width.%]="needsPct()">Needs <span>{{ needsPct() }}%</span></div>
                      <div class="l wants" [style.width.%]="wantsPct()">Wants <span>{{ wantsPct() }}%</span></div>
                      <div class="l savings" [style.width.%]="savingsPct()">Savings <span>{{ savingsPct() }}%</span></div>
                    </div>
                    <div class="progress-bar">
                      <div class="segment needs" [style.width.%]="needsPct()"></div>
                      <div class="segment wants" [style.width.%]="wantsPct()"></div>
                      <div class="segment savings" [style.width.%]="savingsPct()"></div>
                    </div>
                  </div>

                  <div class="category-grid custom-scrollbar">
                    @for (cat of budgetCategories(); track cat.id; let i = $index) {
                      <div class="cat-pill glass">
                        <span class="cat-name">{{ cat.name }}</span>
                        <div class="cat-input">
                          <span class="symbol">{{ currencySymbol() }}</span>
                          <input type="number" [ngModel]="cat.limit" (ngModelChange)="updateBudget(i, $event)" min="0" step="100" />
                        </div>
                      </div>
                    }
                  </div>

                  <div class="total-status" [class.danger]="totalBudgetAllocated() > tempTotalIncome()">
                    <div class="status-info">
                      <span class="label">Allocated Budget</span>
                      <span class="subtext">out of {{ currencySymbol() }}{{ tempTotalIncome() | number:'1.0-0' }}</span>
                    </div>
                    <div class="status-value">
                      {{ currencySymbol() }}{{ totalBudgetAllocated() | number:'1.0-0' }}
                    </div>
                  </div>
                </div>

                <div class="step-actions">
                  <button class="btn-premium ghost" (click)="prevStep()">
                    <lily-icon name="arrow-left" [size]="18" />
                    <span>Back</span>
                  </button>
                  <button class="btn-premium primary" (click)="saveBudget(); nextStep()">
                    <span>Finalize Setup</span>
                    <lily-icon name="arrow-right" [size]="18" />
                  </button>
                </div>
              </div>
            }

            @case (4) {
              <!-- Completion -->
              <div class="step-card celebratory" anim="scaleIn">
                <div class="sparkle-visual">
                  <lily-icon name="sparkles" [size]="80" class="main-sparkle" />
                  <div class="ring"></div>
                  <div class="ring"></div>
                </div>

                <h1 class="step-card__title">Ready for Launch</h1>
                <p class="step-card__desc">Your financial ecosystem has been successfully initialized. Welcome to the future of personal finance.</p>

                <div class="snapshot-grid">
                  <div class="snapshot-item glass">
                    <span class="label">Inflow</span>
                    <span class="value text-income">{{ currencySymbol() }}{{ tempTotalIncome() | number:'1.0-0' }}</span>
                  </div>
                  <div class="snapshot-item glass">
                    <span class="label">Budget</span>
                    <span class="value">{{ currencySymbol() }}{{ totalBudgetAllocated() | number:'1.0-0' }}</span>
                  </div>
                  <div class="snapshot-item glass">
                    <span class="label">Projected Savings</span>
                    <span class="value text-violet">{{ currencySymbol() }}{{ tempTotalIncome() - totalBudgetAllocated() | number:'1.0-0' }}</span>
                  </div>
                </div>

                <button class="btn-premium primary btn--lg" (click)="complete()">
                  <span>Enter Dashboard</span>
                  <lily-icon name="activity" [size]="18" />
                </button>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .onboarding-wrapper {
      min-height: 100vh;
      min-height: 100dvh;
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-6);
    }

    .bg-blur {
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.15;
      z-index: 0;
      pointer-events: none;
      
      &--1 { background: var(--color-violet); top: -100px; right: -100px; }
      &--2 { background: var(--color-pink); bottom: -100px; left: -100px; }
    }

    .onboarding-container {
      width: 100%;
      max-width: 800px;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
    }

    // ── Stepper ──
    .stepper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 var(--space-4);
      
      &__item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        position: relative;
        flex: 1;

        &.active {
          .stepper__dot { background: var(--color-violet); border-color: var(--color-violet); color: white; box-shadow: 0 0 20px var(--color-violet-glow); }
          .stepper__label { color: var(--color-text-primary); font-weight: 700; }
        }

        &.completed {
          .stepper__dot { background: var(--color-emerald); border-color: var(--color-emerald); color: white; }
          .stepper__line { background: var(--color-emerald); }
        }
      }

      &__dot {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid var(--color-border);
        background: var(--color-bg-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 800;
        color: var(--color-text-tertiary);
        transition: all 0.4s var(--ease-spring);
        z-index: 2;
      }

      &__label {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--color-text-tertiary);
        transition: color 0.3s;
      }

      &__line {
        position: absolute;
        top: 16px;
        left: calc(50% + 20px);
        right: calc(-50% + 20px);
        height: 2px;
        background: var(--color-border);
        transition: background 0.4s;
        z-index: 1;
      }
    }

    // ── Step Cards ──
    .step-card {
      background: var(--color-bg-card);
      backdrop-filter: blur(24px);
      border: 1px solid var(--color-bg-glass-border);
      border-radius: 32px;
      padding: var(--space-10);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: var(--shadow-glass);
      
      &--large { max-width: 720px; align-self: center; width: 100%; }

      &__logo.welcome-logo {
        position: relative;
        margin-bottom: var(--space-8);
        display: flex;
        align-items: center;
        gap: 16px;
        
        .logo-image {
          width: 150px;
          height: 150px;
          object-fit: contain;
          position: relative;
          z-index: 1;
        }
        
        .logo-text {
          font-size: 48px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--color-text-primary);
          line-height: 1;
        }
      }

      &__header { margin-bottom: var(--space-8); width: 100%; }
      &__title { font-size: 36px; font-weight: 900; letter-spacing: -0.04em; margin-bottom: var(--space-3); line-height: 1.1; }
      &__desc { font-size: 16px; color: var(--color-text-secondary); line-height: 1.6; max-width: 480px; }
    }

    .text-gradient { background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

    .feature-pills {
      display: flex; gap: var(--space-3); margin: var(--space-8) 0;
      .pill { 
        padding: 8px 16px; background: var(--color-bg-input); border-radius: var(--radius-full); 
        border: 1px solid var(--color-border); font-size: 12px; font-weight: 700; color: var(--color-text-secondary);
        display: flex; align-items: center; gap: 8px;
      }
    }

    // ── Currency Grid ──
    .currency-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); width: 100%; margin-bottom: var(--space-8);
    }

    .currency-card {
      background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 20px; padding: var(--space-5);
      display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-3); cursor: pointer; transition: all 0.3s var(--ease-out);
      position: relative; overflow: hidden;
      
      &__info { display: flex; align-items: baseline; gap: var(--space-2); }
      .symbol { font-size: 24px; font-weight: 800; color: var(--color-text-primary); }
      .code { font-size: 11px; font-weight: 700; color: var(--color-text-tertiary); text-transform: uppercase; }
      .name { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
      
      .active-ring { position: absolute; inset: 0; border: 2px solid transparent; border-radius: inherit; transition: all 0.3s; }

      &:hover { background: var(--color-bg-card-hover); border-color: var(--color-violet-alpha); transform: translateY(-2px); }
      &.active { 
        background: var(--color-bg-secondary); border-color: var(--color-violet); 
        .active-ring { border-color: var(--color-violet); box-shadow: 0 0 20px var(--color-violet-glow); }
        .symbol { color: var(--color-violet-light); }
      }
    }

    // ── Income Manager ──
    .income-manager { width: 100%; display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-8); }
    .income-list { max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-3); padding-right: 8px; }
    
    .income-item {
      display: grid; grid-template-columns: 1.2fr 160px 160px 48px; gap: var(--space-4); padding: var(--space-5); border-radius: 24px;
      
      label { font-size: 11px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; display: block; }
      input, select { 
        background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 12px; height: 44px; padding: 0 16px; 
        color: var(--color-text-primary); font-size: 14px; font-weight: 600; width: 100%;
        &:focus { border-color: var(--color-violet); outline: none; background: var(--color-bg-secondary); }
      }
      
      .input-wrap { position: relative; display: flex; align-items: center; }
      .symbol { position: absolute; left: 14px; color: var(--color-text-tertiary); font-weight: 700; }
      input[type="number"] { padding-left: 28px; font-family: var(--font-mono); }
      
      .btn-delete { 
        align-self: flex-end; height: 44px; border-radius: 12px; background: rgba(244, 63, 94, 0.1); border: none; color: var(--color-rose); cursor: pointer;
        &:hover:not(:disabled) { background: var(--color-rose); color: white; }
        &:disabled { opacity: 0.3; cursor: not-allowed; }
      }
    }

    .btn-add-source {
      background: transparent; border: 2px dashed var(--color-border); border-radius: 16px; padding: var(--space-4); color: var(--color-text-tertiary);
      font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: all 0.2s;
      &:hover { border-color: var(--color-violet); color: var(--color-violet-light); background: var(--color-bg-input); }
    }

    .total-bar {
      padding: var(--space-5) var(--space-6); border-radius: 20px; display: flex; justify-content: space-between; align-items: center;
      .label-group { display: flex; flex-direction: column; }
      .label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--color-text-tertiary); }
      .monthly { font-size: 11px; font-weight: 600; color: var(--color-text-muted); }
      .value { font-size: 28px; font-weight: 900; letter-spacing: -0.02em; font-family: var(--font-mono); }
    }

    // ── Budget Planner ──
    .budget-planner { width: 100%; display: flex; flex-direction: column; gap: var(--space-6); margin-bottom: var(--space-8); }
    .visualization {
      padding: var(--space-6); border-radius: 24px;
      .progress-labels { display: flex; margin-bottom: var(--space-3); }
      .l { 
        font-size: 11px; font-weight: 800; text-transform: uppercase; 
        transition: width 0.8s var(--ease-spring);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        
        span { font-weight: 900; opacity: 1; margin-left: 4px; } 
        
        &.needs { color: var(--color-sky); text-align: left; }
        &.wants { color: var(--color-amber); text-align: center; }
        &.savings { color: var(--color-emerald); text-align: right; }
      }
      
      .progress-bar { height: 12px; border-radius: var(--radius-full); background: var(--color-bg-input); display: flex; overflow: hidden; gap: 2px; }
      .segment { transition: width 0.8s var(--ease-spring); }
      .segment.needs { background: var(--color-sky); }
      .segment.wants { background: var(--color-amber); }
      .segment.savings { background: var(--color-emerald); }
    }

    .category-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); max-height: 280px; overflow-y: auto; padding-right: 8px; }
    .cat-pill {
      display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-radius: 16px;
      .cat-name { font-size: 13px; font-weight: 700; color: var(--color-text-secondary); }
      .cat-input {
        display: flex; align-items: center; gap: 6px;
        .symbol { font-size: 12px; font-weight: 800; color: var(--color-text-tertiary); }
        input { background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: 8px; width: 80px; height: 32px; text-align: right; font-family: var(--font-mono); font-weight: 800; color: var(--color-text-primary); padding: 0 8px; }
      }
    }

    .total-status {
      padding: var(--space-5) var(--space-6); border-radius: 24px; background: var(--color-bg-secondary); border: 1px solid var(--color-border);
      display: flex; justify-content: space-between; align-items: center;
      &.danger { border-color: var(--color-rose); .status-value { color: var(--color-rose); } }
      .status-info { display: flex; flex-direction: column; .label { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--color-text-tertiary); } .subtext { font-size: 11px; color: var(--color-text-muted); } }
      .status-value { font-size: 24px; font-weight: 900; font-family: var(--font-mono); }
    }

    // ── Celebration ──
    .step-card.celebratory {
      .sparkle-visual { position: relative; margin-bottom: var(--space-8); }
      .main-sparkle { color: var(--color-violet); filter: drop-shadow(0 0 20px var(--color-violet-glow)); }
      .ring { position: absolute; inset: -20px; border: 2px solid var(--color-violet-glow); border-radius: 50%; animation: pulse-ring 4s infinite; }
      .ring:nth-child(2) { animation-delay: 1s; }
      
      .snapshot-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); width: 100%; margin: var(--space-8) 0; }
      .snapshot-item {
        padding: var(--space-5) var(--space-2); border-radius: 20px; display: flex; flex-direction: column; gap: 4px;
        .label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--color-text-tertiary); }
        .value { font-size: 18px; font-weight: 900; font-family: var(--font-mono); }
      }
    }

    @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(2); opacity: 0; } }

    // ── Buttons ──
    .btn-premium {
      height: 56px; padding: 0 32px; border-radius: 18px; font-size: 16px; font-weight: 800; border: none; cursor: pointer;
      display: flex; align-items: center; gap: 12px; transition: all 0.3s var(--ease-spring);
      
      &.primary { 
        background: var(--gradient-primary); color: white; box-shadow: 0 8px 24px -6px var(--color-violet-glow);
        &:hover { transform: translateY(-3px) scale(1.02); filter: brightness(1.1); box-shadow: 0 12px 32px -8px var(--color-violet-glow); }
      }
      
      &.ghost { background: var(--color-bg-input); color: var(--color-text-secondary); border: 1px solid var(--color-border); &:hover { background: var(--color-bg-secondary); color: var(--color-text-primary); } }
      
      &.btn--lg { height: 64px; padding: 0 48px; font-size: 18px; }
      &:active { transform: translateY(0) scale(0.98); }
      &:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
    }

    .step-actions { display: flex; justify-content: space-between; width: 100%; margin-top: var(--space-4); gap: var(--space-3); }

    .custom-scrollbar { &::-webkit-scrollbar { width: 4px; } &::-webkit-scrollbar-track { background: transparent; } &::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; } }
    .glass { background: var(--color-bg-input); border: 1px solid var(--color-border); backdrop-filter: blur(10px); }

    // ── Mobile Responsiveness ──
    @media (max-width: 820px) {
      .onboarding-wrapper { padding: var(--space-4); align-items: flex-start; padding-top: var(--space-10); min-height: 100dvh; }
      .onboarding-container { gap: var(--space-6); width: 100%; }

      .stepper__label { display: none; }
      .stepper__dot { width: 32px; height: 32px; font-size: 12px; }
      .stepper__line { left: calc(50% + 16px); right: calc(-50% + 16px); }

      .step-card { 
        padding: var(--space-6); 
        border-radius: 24px; 
        width: 100%;
        
        &__title { font-size: 28px; }
        &__desc { font-size: 14px; }
        
        &__logo.welcome-logo {
          margin-bottom: var(--space-6);
          .logo-image { width: 100px; height: 100px; }
          .logo-text { font-size: 32px; }
        }
      }

      .currency-grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-2); }
      .currency-card { padding: var(--space-4); .symbol { font-size: 20px; } .name { font-size: 11px; } }

      .income-item { 
        grid-template-columns: 1fr; 
        padding: var(--space-5);
        gap: var(--space-4);
        
        .income-item__freq, .income-item__amount { width: 100%; }
        .btn-delete { width: 100%; margin-top: 4px; height: 44px; justify-content: center; }
      }

      .total-bar { 
        flex-direction: column; align-items: flex-start; gap: 8px; padding: var(--space-5);
        .value { font-size: 24px; }
      }

      .category-grid { grid-template-columns: 1fr; gap: var(--space-2); max-height: 320px; }
      
      .visualization {
        padding: var(--space-4);
        .l { font-size: 9px; }
      }

      .snapshot-grid { grid-template-columns: 1fr; gap: var(--space-3); }
      
      .btn-premium { 
        height: 52px; padding: 0 20px; font-size: 15px; border-radius: 16px; width: 100%; justify-content: center;
        lily-icon { --icon-size: 18px; }
        
        &.btn--lg { height: 60px; font-size: 17px; }
      }

      .feature-pills { flex-wrap: wrap; justify-content: center; gap: var(--space-2); .pill { padding: 6px 12px; font-size: 10px; } }
      
      .total-status {
        flex-direction: column; align-items: flex-start; gap: 12px; padding: var(--space-5);
        .status-value { font-size: 20px; }
      }

      .step-actions { flex-direction: column; gap: var(--space-3); }
    }

    @media (max-width: 400px) {
      .currency-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class OnboardingComponent {
  private store = inject(LilyStore);
  private confetti = inject(ConfettiService);
  private router = inject(Router);

  step = signal(0);
  steps = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'currency', label: 'Currency' },
    { id: 'income', label: 'Income' },
    { id: 'budget', label: 'Budget' },
    { id: 'ready', label: 'Ready' },
  ];

  selectedCurrency = signal('USD');

  tempSources = signal<IncomeSource[]>([
    {
      id: crypto.randomUUID(), name: 'Main Salary', amount: 0,
      frequency: 'monthly', categoryId: 'salary', isActive: true,
      createdAt: new Date().toISOString(),
    },
  ]);

  tempTotalIncome = computed(() =>
    this.tempSources().reduce((sum, s) => {
      const multiplier = FREQUENCY_TO_MONTHLY[s.frequency] || 0;
      return sum + (s.amount * multiplier);
    }, 0)
  );

  budgetCategories = signal([
    { id: 'food', name: 'Food & Dining', limit: 0, type: 'wants' },
    { id: 'transport', name: 'Transport', limit: 0, type: 'needs' },
    { id: 'entertainment', name: 'Entertainment', limit: 0, type: 'wants' },
    { id: 'shopping', name: 'Shopping', limit: 0, type: 'wants' },
    { id: 'bills', name: 'Bills & Utilities', limit: 0, type: 'needs' },
    { id: 'health', name: 'Health', limit: 0, type: 'needs' },
    { id: 'groceries', name: 'Groceries', limit: 0, type: 'needs' },
    { id: 'subscriptions', name: 'Subscriptions', limit: 0, type: 'wants' },
    { id: 'personal', name: 'Personal', limit: 0, type: 'wants' },
  ]);

  totalBudgetAllocated = computed(() =>
    this.budgetCategories().reduce((sum, c) => sum + (c.limit || 0), 0)
  );

  needsPct = computed(() => {
    const total = this.tempTotalIncome();
    if (total <= 0) return 0;
    const needs = this.budgetCategories().filter(c => c.type === 'needs').reduce((s, c) => s + (c.limit || 0), 0);
    return Math.round((needs / total) * 100);
  });

  wantsPct = computed(() => {
    const total = this.tempTotalIncome();
    if (total <= 0) return 0;
    const wants = this.budgetCategories().filter(c => c.type === 'wants').reduce((s, c) => s + (c.limit || 0), 0);
    return Math.round((wants / total) * 100);
  });

  savingsPct = computed(() => Math.max(0, 100 - this.needsPct() - this.wantsPct()));

  popularCurrencies = CURRENCIES.slice(0, 9);
  currencySymbol = () => CURRENCIES.find(c => c.code === this.selectedCurrency())?.symbol || '$';

  nextStep(): void { if (this.step() < 4) this.step.update(s => s + 1); }
  prevStep(): void { if (this.step() > 0) this.step.update(s => s - 1); }

  addSource(): void {
    this.tempSources.update(s => [...s, {
      id: crypto.randomUUID(), name: '', amount: 0,
      frequency: 'monthly' as const, categoryId: 'freelance', isActive: true,
      createdAt: new Date().toISOString(),
    }]);
  }

  updateSource(index: number, change: Partial<IncomeSource>): void {
    this.tempSources.update(sources => {
      const newSources = [...sources];
      newSources[index] = { ...newSources[index], ...change };
      return newSources;
    });
  }

  removeSource(index: number): void {
    this.tempSources.update(s => s.filter((_, i) => i !== index));
  }

  updateBudget(index: number, limit: number): void {
    this.budgetCategories.update(cats => {
      const newCats = [...cats];
      newCats[index] = { ...newCats[index], limit };
      return newCats;
    });
  }

  onBudgetChange(): void {
    // Force computed update if needed
  }

  saveCurrency(): void {
    const cur = CURRENCIES.find(c => c.code === this.selectedCurrency());
    if (cur) this.store.updateSettings({ currency: cur });
  }

  saveIncome(): void {
    const sources = this.tempSources().filter(s => s.amount > 0 && s.name.trim());
    // Auto-suggest 50/30/20 allocation if categories are empty
    if (this.totalBudgetAllocated() === 0) {
      const income = this.tempTotalIncome();
      const needsBudget = Math.round(income * BUDGET_RULE.needs);
      const wantsBudget = Math.round(income * BUDGET_RULE.wants);

      const needsCats = this.budgetCategories().filter(c => c.type === 'needs');
      const wantsCats = this.budgetCategories().filter(c => c.type === 'wants');

      const perNeed = Math.floor(needsBudget / needsCats.length / 50) * 50;
      const perWant = Math.floor(wantsBudget / wantsCats.length / 50) * 50;

      needsCats.forEach((c, i) => {
        c.limit = perNeed;
        if (i === 0) c.limit += (needsBudget - (perNeed * needsCats.length));
      });
      
      wantsCats.forEach((c, i) => {
        c.limit = perWant;
        if (i === 0) c.limit += (wantsBudget - (perWant * wantsCats.length));
      });

      // Update the signal to trigger UI refresh
      this.budgetCategories.set([...this.budgetCategories()]);
    }
  }

  saveBudget(): void {
    const month = format(new Date(), 'yyyy-MM');
    const categoryLimits: Record<string, number> = {};
    for (const cat of this.budgetCategories()) {
      if (cat.limit > 0) categoryLimits[cat.id] = cat.limit;
    }
    this.store.setBudget({
      month,
      totalLimit: this.totalBudgetAllocated(),
      categoryLimits,
      rollover: false,
    });
    this.store.updateSettings({ monthlyBudgetTarget: this.totalBudgetAllocated() });
  }

  complete(): void {
    const sources = this.tempSources().filter(s => s.amount > 0 && s.name.trim());
    sources.forEach(s => this.store.addIncomeSource(s));

    this.store.completeOnboarding();
    this.confetti.burst();
    this.router.navigate(['/dashboard']);
  }
}
