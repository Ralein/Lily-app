import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LilyStore } from '../../core/store/lily.store';
import { ToastService } from '../../core/services/toast.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { CurrencyDisplayPipe } from '../../shared/pipes/currency-display.pipe';
import { LilyIconComponent } from '../../shared/icons/lily-icon.component';
import { BUDGET_RULE, NEEDS_CATEGORIES, WANTS_CATEGORIES } from '../../core/models/income.model';
import { format } from 'date-fns';
@Component({
  selector: 'lily-budgets',
  standalone: true,
  imports: [
    FormsModule, CurrencyDisplayPipe, LilyIconComponent,
  ],
  template: `
    <div class="budgets-page">
      <div class="page-header" anim="fadeIn">
        <div class="header-content">
          <h1 class="page-header__title">Budget Plan</h1>
          <p class="page-header__subtitle">{{ currentMonthLabel() }}</p>
        </div>
        <div class="header-actions">
          <div class="badge-glass">
            <lily-icon name="clock" [size]="14" />
            <span>Auto-calculating</span>
          </div>
        </div>
      </div>

      <!-- Hero Spending Velocity -->
      @if (hasBudget()) {
        <div class="lily-card hero-velocity-card" anim="slideUp">
          <div class="card-content">
            <div class="velocity-info">
              <span class="label-upper">Projected Monthly Spend</span>
              <div class="velocity-value" [class.danger]="velocity().projected > velocity().budget">
                {{ velocity().projected | currencyDisplay }}
                <lily-icon [name]="velocity().projected > velocity().budget ? 'trending-up' : 'trending-down'" [size]="28" class="velocity-icon" />
              </div>
              <div class="velocity-insight">
                <lily-icon [name]="velocity().projected > velocity().budget ? 'triangle-alert' : 'sparkles'" [size]="16" />
                <span>
                  @if (velocity().projected > velocity().budget) {
                    Projected to exceed budget by {{ velocity().projected - velocity().budget | currencyDisplay }}
                  } @else {
                    On track to save {{ velocity().budget - velocity().projected | currencyDisplay }} this month
                  }
                </span>
              </div>
            </div>
            <div class="velocity-visual">
              <div class="progress-ring-container">
                <svg class="progress-ring" viewBox="0 0 100 100">
                  <circle class="ring-track" cx="50" cy="50" r="45" />
                  <circle class="ring-fill" cx="50" cy="50" r="45" 
                          [style.stroke-dasharray]="(projectedPct() * 2.82) + ', 282'"
                          [style.stroke]="projectedPct() > 100 ? 'var(--color-rose)' : projectedPct() > 80 ? 'var(--color-amber)' : 'var(--color-emerald)'" />
                </svg>
                <div class="ring-content">
                  <span class="pct">{{ projectedPct() }}%</span>
                  <span class="subtext">used</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="velocity-stats">
            <div class="v-stat">
              <span class="v-stat__label">Total Budget</span>
              <span class="v-stat__value">{{ velocity().budget | currencyDisplay }}</span>
            </div>
            <div class="v-stat">
              <span class="v-stat__label">Safe Daily Burn</span>
              <span class="v-stat__value">{{ velocity().safeDaily | currencyDisplay }}</span>
            </div>
            <div class="v-stat">
              <span class="v-stat__label">Days Remaining</span>
              <span class="v-stat__value">{{ velocity().daysLeft }}</span>
            </div>
          </div>
        </div>
      }

      <!-- Income Allocation Bar -->
      @if (store.totalMonthlyIncome() > 0) {
        <div class="lily-card allocation-card" anim="slideUp">
          <div class="allocation-header">
            <div class="title-group">
              <h3 class="allocation-title">Income Allocation</h3>
              <p class="allocation-subtitle">How your monthly income is distributed</p>
            </div>
            <span class="total-income">{{ store.totalMonthlyIncome() | currencyDisplay }}</span>
          </div>
          <div class="allocation-content">
            <div class="viz-bar-group">
              <div class="viz-bar">
                <div class="viz-segment budget" [style.width.%]="(store.currentBudgetTotal() / store.totalMonthlyIncome()) * 100">
                  <div class="glow"></div>
                </div>
                <div class="viz-segment savings" [style.width.%]="(store.savingsTarget() / store.totalMonthlyIncome()) * 100">
                  <div class="glow"></div>
                </div>
              </div>
            </div>
            <div class="viz-legend">
              <div class="legend-item">
                <div class="indicator budget"></div>
                <div class="text">
                  <span class="label">Budgeted</span>
                  <span class="value">{{ store.currentBudgetTotal() | currencyDisplay }}</span>
                </div>
              </div>
              <div class="legend-item">
                <div class="indicator savings"></div>
                <div class="text">
                  <span class="label">Projected Savings</span>
                  <span class="value">{{ store.savingsTarget() | currencyDisplay }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Categories Budget -->
      <div class="lily-card budget-list-card" anim="slideUp">
        <div class="card-header">
          <div class="title-group">
            <h3 class="card-title">{{ hasBudget() ? 'Category Breakdown' : 'Budget Setup' }}</h3>
            <p class="card-subtitle">Spending limits by category</p>
          </div>
          <div class="header-actions">
            @if (editing() && store.totalMonthlyIncome() > 0) {
              <button class="btn-action" (click)="apply503020()">
                <lily-icon name="zap" [size]="14" /> <span>Smart Fill</span>
              </button>
            }
            @if (!editing()) {
              <button class="btn-action" (click)="startEditing()">
                <lily-icon name="pencil" [size]="14" /> <span>Modify</span>
              </button>
            }
          </div>
        </div>

        @if (editing()) {
          <div class="budget-editor" anim="fadeIn">
            <div class="editor-top">
              <div class="limit-input-group">
                <label>Monthly Spending Limit</label>
                <div class="amount-input">
                  <span class="currency">{{ store.currencySymbol() }}</span>
                  <input type="number" [(ngModel)]="totalLimit" placeholder="0">
                </div>
              </div>
              @if (totalAllocated() > store.totalMonthlyIncome() && store.totalMonthlyIncome() > 0) {
                <div class="allocation-warning">
                  <lily-icon name="triangle-alert" [size]="14" />
                  <span>Exceeds income by {{ totalAllocated() - store.totalMonthlyIncome() | currencyDisplay }}</span>
                </div>
              }
            </div>

            <div class="editor-grid">
              @for (cat of expenseCategories(); track cat.id) {
                <div class="cat-field">
                  <div class="cat-label">
                    <div class="icon-box" [style.background]="cat.color + '15'" [style.color]="cat.color">
                      <lily-icon [name]="cat.icon" [size]="16" />
                    </div>
                    <span>{{ cat.name }}</span>
                  </div>
                  <div class="field-wrapper">
                    <span class="sym">{{ store.currencySymbol() }}</span>
                    <input type="number" [(ngModel)]="catLimits[cat.id]" placeholder="0">
                  </div>
                </div>
              }
            </div>

            <div class="editor-footer">
              <button class="btn-premium" (click)="saveBudget()">Save Budget Plan</button>
              <button class="btn-ghost" (click)="editing.set(false)">Discard Changes</button>
            </div>
          </div>
        } @else if (hasBudget()) {
          <div class="budget-items" [@listAnimation]="budgetVariance().length">
            @for (item of budgetVariance(); track item.categoryId) {
              <div class="budget-row">
                <div class="row-main">
                  <div class="cat-group">
                    <div class="cat-icon-glass" [style.background]="getCatColor(item.categoryId) + '15'" [style.color]="getCatColor(item.categoryId)">
                      <lily-icon [name]="getCatIcon(item.categoryId)" [size]="14" />
                    </div>
                    <div class="cat-meta">
                      <span class="name">{{ getCatName(item.categoryId) }}</span>
                      <span class="remaining" [class.over]="item.variance < 0">
                        @if (item.variance < 0) {
                          {{ Math.abs(item.variance) | currencyDisplay }} over budget
                        } @else {
                          {{ item.variance | currencyDisplay }} remaining
                        }
                      </span>
                    </div>
                  </div>
                  <div class="amount-group">
                    <span class="spent">{{ item.actual | currencyDisplay }}</span>
                    <span class="divider">/</span>
                    <span class="total">{{ item.budgeted | currencyDisplay }}</span>
                  </div>
                </div>
                <div class="row-progress">
                  <div class="glass-progress">
                    <div class="fill" 
                         [style.width.%]="Math.min(item.percentage, 100)"
                         [style.background]="item.percentage > 100 ? 'var(--color-rose)' : item.percentage > 80 ? 'var(--color-amber)' : 'var(--color-emerald)'">
                      <div class="shine"></div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state-container" anim="fadeIn">
            <div class="icon-circle">
              <lily-icon name="target" [size]="32" />
            </div>
            <h4 class="title">Take Control of Your Flow</h4>
            <p class="description">Create a smart budget plan to optimize your savings and spend with confidence.</p>
            <button class="btn-premium" (click)="startEditing()">Setup Monthly Budget</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .budgets-page { 
      display: flex; 
      flex-direction: column; 
      gap: var(--space-8); 
      padding-bottom: var(--space-12); 
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      
      .page-header__title {
        font-size: 2.5rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        background: linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-text-tertiary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .page-header__subtitle {
        font-size: var(--fs-base);
        color: var(--color-text-muted);
        font-weight: 500;
        margin-top: var(--space-1);
      }
    }

    .badge-glass {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      background: var(--color-bg-card);
      border: 1px solid var(--color-bg-glass-border);
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 700;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .hero-velocity-card {
      padding: var(--space-8);
      background: linear-gradient(135deg, var(--color-bg-card) 0%, rgba(139, 92, 246, 0.05) 100%);
      border: 1px solid var(--color-bg-glass-border);
      box-shadow: var(--shadow-glass);
      overflow: hidden;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: -100px;
        right: -100px;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, var(--color-violet-alpha) 0%, transparent 70%);
        opacity: 0.2;
        pointer-events: none;
      }

      .card-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--space-8);
        margin-bottom: var(--space-8);
      }
    }

    .velocity-info {
      flex: 1;
      .label-upper { 
        font-size: 11px; 
        font-weight: 800; 
        color: var(--color-text-muted); 
        text-transform: uppercase; 
        letter-spacing: 0.1em; 
      }
      .velocity-value { 
        font-size: 3.5rem; 
        font-weight: 800; 
        color: var(--color-text-primary); 
        display: flex; 
        align-items: center; 
        gap: var(--space-4); 
        margin: var(--space-2) 0;
        letter-spacing: -0.02em;
        
        &.danger { color: var(--color-rose-light); }
        .velocity-icon { color: var(--color-text-tertiary); opacity: 0.5; }
      }
      .velocity-insight {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--fs-base);
        font-weight: 500;
        color: var(--color-text-secondary);
        background: var(--color-bg-secondary);
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-xl);
        width: fit-content;
      }
    }

    .velocity-visual {
      width: 160px;
      height: 160px;
      position: relative;
      
      .progress-ring-container {
        width: 100%;
        height: 100%;
        position: relative;
      }
      
      .progress-ring {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
        
        .ring-track {
          fill: none;
          stroke: var(--color-bg-secondary);
          stroke-width: 8;
        }
        
        .ring-fill {
          fill: none;
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dasharray 1.5s var(--ease-spring);
        }
      }
      
      .ring-content {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        
        .pct { font-size: 28px; font-weight: 800; color: var(--color-text-primary); line-height: 1; }
        .subtext { font-size: 10px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-top: 4px; }
      }
    }

    .velocity-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-4);
      padding-top: var(--space-6);
      border-top: 1px solid var(--color-bg-glass-border);
      
      .v-stat {
        display: flex;
        flex-direction: column;
        gap: 4px;
        
        &__label { 
          font-size: 10px; 
          font-weight: 800; 
          color: var(--color-text-tertiary); 
          text-transform: uppercase; 
          letter-spacing: 0.05em;
        }
        &__value { 
          font-size: var(--fs-lg); 
          font-weight: 700; 
          color: var(--color-text-primary); 
        }
      }
    }

    .allocation-card {
      padding: var(--space-8);
      background: var(--color-bg-card);
      border: 1px solid var(--color-bg-glass-border);
      box-shadow: var(--shadow-glass);
      
      .allocation-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-8);
        
        .allocation-title { font-size: var(--fs-xl); font-weight: 700; color: var(--color-text-primary); }
        .allocation-subtitle { font-size: var(--fs-sm); color: var(--color-text-muted); margin-top: 2px; }
        .total-income { font-size: var(--fs-2xl); font-weight: 800; color: var(--color-violet-light); letter-spacing: -0.01em; }
      }

      .allocation-content {
        .viz-bar-group { margin-bottom: var(--space-8); }
        .viz-bar { 
          height: 16px; 
          background: var(--color-bg-secondary); 
          border-radius: var(--radius-full); 
          overflow: hidden; 
          display: flex;
          border: 1px solid var(--color-bg-glass-border);
        }
        .viz-segment { 
          height: 100%; 
          position: relative;
          transition: width 1s var(--ease-spring);
          
          &.budget { background: var(--color-violet); }
          &.savings { background: var(--color-emerald); }
          
          .glow {
            position: absolute;
            top: 0; right: 0; bottom: 0;
            width: 20px;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.2));
            filter: blur(4px);
          }
        }
        
        .viz-legend {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-8);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-4);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-bg-glass-border);
          
          .indicator {
            width: 12px; height: 12px; border-radius: 4px;
            &.budget { background: var(--color-violet); box-shadow: 0 0 10px var(--color-violet-alpha); }
            &.savings { background: var(--color-emerald); box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
          }
          
          .text {
            display: flex;
            flex-direction: column;
            .label { font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; }
            .value { font-size: var(--fs-lg); font-weight: 700; color: var(--color-text-primary); }
          }
        }
      }
    }

    .budget-list-card {
      padding: var(--space-8);
      background: var(--color-bg-card);
      border: 1px solid var(--color-bg-glass-border);
      box-shadow: var(--shadow-glass);
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-8);
        
        .card-title { font-size: var(--fs-xl); font-weight: 700; color: var(--color-text-primary); }
        .card-subtitle { font-size: var(--fs-sm); color: var(--color-text-muted); }
      }
    }

    .btn-action {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 8px 16px;
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-bg-glass-border);
      border-radius: var(--radius-xl);
      color: var(--color-text-primary);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-out);

      &:hover {
        background: var(--color-violet-alpha-low);
        border-color: var(--color-violet-alpha);
        transform: translateY(-2px);
      }
    }

    .budget-editor {
      .editor-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: var(--space-8);
      }
      
      .limit-input-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        label { font-size: 11px; font-weight: 800; color: var(--color-text-tertiary); text-transform: uppercase; }
        .amount-input {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--color-text-primary);
          
          input {
            background: transparent;
            border: none;
            font: inherit;
            color: inherit;
            width: 200px;
            outline: none;
            border-bottom: 2px solid var(--color-bg-glass-border);
            transition: border-color 0.3s;
            &:focus { border-color: var(--color-violet); }
          }
        }
      }
      
      .allocation-warning {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        background: rgba(244, 63, 94, 0.1);
        color: var(--color-rose-light);
        padding: 10px 16px;
        border-radius: var(--radius-xl);
        font-size: 13px;
        font-weight: 600;
        border: 1px solid rgba(244, 63, 94, 0.2);
      }
      
      .editor-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-8);
      }
      
      .cat-field {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4) var(--space-5);
        background: var(--color-bg-secondary);
        border-radius: var(--radius-2xl);
        border: 1px solid var(--color-bg-glass-border);
        transition: border-color 0.3s;
        
        &:focus-within { border-color: var(--color-violet-alpha); }
        
        .cat-label {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          font-weight: 600;
          color: var(--color-text-primary);
          
          .icon-box {
            width: 36px; height: 36px; border-radius: var(--radius-xl);
            display: flex; align-items: center; justify-content: center;
          }
        }
        
        .field-wrapper {
          display: flex;
          align-items: center;
          gap: 4px;
          .sym { color: var(--color-text-muted); font-weight: 700; }
          input {
            background: transparent;
            border: none;
            text-align: right;
            font-weight: 700;
            color: var(--color-text-primary);
            outline: none;
            width: 80px;
            font-size: 16px;
          }
        }
      }
      
      .editor-footer {
        display: flex;
        gap: var(--space-4);
        padding-top: var(--space-8);
        border-top: 1px solid var(--color-bg-glass-border);
      }
    }

    .btn-premium {
      background: var(--color-violet);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: var(--radius-xl);
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 15px var(--color-violet-alpha);
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px var(--color-violet-alpha);
        filter: brightness(1.1);
      }
    }

    .btn-ghost {
      background: transparent;
      color: var(--color-text-muted);
      border: 1px solid var(--color-bg-glass-border);
      padding: 12px 24px;
      border-radius: var(--radius-xl);
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        background: var(--color-bg-secondary);
        color: var(--color-text-primary);
      }
    }

    .budget-items {
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
    }

    .budget-row {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      
      .row-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .cat-group {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        
        .cat-icon-glass {
          width: 44px; height: 44px;
          border-radius: var(--radius-2xl);
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--color-bg-glass-border);
        }
        
        .cat-meta {
          display: flex;
          flex-direction: column;
          .name { font-size: var(--fs-base); font-weight: 700; color: var(--color-text-primary); }
          .remaining { 
            font-size: 12px; font-weight: 600; color: var(--color-emerald); 
            &.over { color: var(--color-rose-light); }
          }
        }
      }
      
      .amount-group {
        display: flex;
        align-items: baseline;
        gap: 6px;
        .spent { font-size: var(--fs-lg); font-weight: 800; color: var(--color-text-primary); }
        .divider { color: var(--color-text-muted); font-size: 12px; }
        .total { font-size: 13px; font-weight: 600; color: var(--color-text-tertiary); }
      }
      
      .row-progress {
        .glass-progress {
          height: 10px;
          background: var(--color-bg-secondary);
          border-radius: var(--radius-full);
          overflow: hidden;
          border: 1px solid var(--color-bg-glass-border);
          
          .fill {
            height: 100%;
            border-radius: var(--radius-full);
            transition: width 1.2s var(--ease-spring);
            position: relative;
            
            .shine {
              position: absolute;
              top: 0; left: 0; right: 0; bottom: 0;
              background: linear-gradient(to bottom, rgba(255,255,255,0.2), transparent);
            }
          }
        }
      }
    }

    .empty-state-container {
      padding: var(--space-12) 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      
      .icon-circle {
        width: 100px; height: 100px;
        border-radius: var(--radius-full);
        background: var(--color-bg-secondary);
        display: flex; align-items: center; justify-content: center;
        color: var(--color-text-tertiary);
        margin-bottom: var(--space-6);
        border: 1px solid var(--color-bg-glass-border);
      }
      
      .title { font-size: 1.5rem; font-weight: 800; color: var(--color-text-primary); margin-bottom: var(--space-2); }
      .description { font-size: var(--fs-base); color: var(--color-text-secondary); max-width: 360px; margin-bottom: var(--space-8); }
    }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; align-items: flex-start; gap: var(--space-4); }
      .page-header__title { font-size: 2rem; }
      
      .hero-velocity-card { 
        padding: var(--space-6); 
        .card-content { flex-direction: column; gap: var(--space-6); text-align: center; } 
      }
      .velocity-info {
        .velocity-value { justify-content: center; font-size: 2.8rem; }
        .velocity-insight { margin: 0 auto; }
      }
      .velocity-stats { grid-template-columns: 1fr; gap: var(--space-4); padding-top: var(--space-6); }
      
      .allocation-card {
        padding: var(--space-6);
        .allocation-header { flex-direction: column; gap: var(--space-2); }
        .viz-legend { grid-template-columns: 1fr; gap: var(--space-4); }
      }
      
      .budget-list-card { padding: var(--space-6); }
      .budget-editor {
        .editor-top { flex-direction: column; align-items: flex-start; gap: var(--space-4); }
        .limit-input-group .amount-input { font-size: 2rem; input { width: 100%; } }
        .editor-grid { grid-template-columns: 1fr; }
        .editor-footer { flex-direction: column; gap: var(--space-3); .btn-premium, .btn-ghost { width: 100%; } }
      }
      
      .budget-row .amount-group { flex-direction: column; align-items: flex-end; gap: 0; }
    }
  `],
})
export class BudgetsComponent {
  store = inject(LilyStore);
  private analytics = inject(AnalyticsService);

  getCatColor(categoryId: string) {
    return this.store.categories().find(c => c.id === categoryId)?.color || '#64748b';
  }
  private toast = inject(ToastService);
  Math = Math;

  editing = signal(false);
  totalLimit = 0;
  catLimits: Record<string, number> = {};

  currentMonthLabel = computed(() => format(new Date(), 'MMMM yyyy'));
  currentMonth = computed(() => format(new Date(), 'yyyy-MM'));
  hasBudget = computed(() => !!this.store.currentBudget());
  velocity = computed(() => this.analytics.spendingVelocity(this.currentMonth()));
  budgetVariance = computed(() => this.analytics.budgetVariance(this.currentMonth()));
  projectedPct = computed(() => {
    const v = this.velocity();
    return v.budget > 0 ? Math.round((v.projected / v.budget) * 100) : 0;
  });

  totalAllocated = computed(() => Object.values(this.catLimits).reduce((sum, v) => sum + (v || 0), 0));

  unallocatedPct = computed(() => {
    const income = this.store.totalMonthlyIncome();
    if (income <= 0) return 0;
    return Math.round((this.store.unallocatedBudget() / income) * 100);
  });

  expenseCategories = computed(() => this.store.categories().filter(c => c.type === 'expense'));

  getCatIcon(id: string): string { return this.store.categoryMap().get(id)?.icon || 'package'; }
  getCatName(id: string): string { return this.store.categoryMap().get(id)?.name || 'Other'; }

  startEditing(): void {
    const budget = this.store.currentBudget();
    if (budget) {
      this.totalLimit = budget.totalLimit;
      this.catLimits = { ...budget.categoryLimits };
    } else {
      this.totalLimit = this.store.totalMonthlyIncome() > 0
        ? Math.round(this.store.totalMonthlyIncome() * 0.8) // default 80% of income
        : 0;
      this.catLimits = {};
    }
    this.editing.set(true);
  }

  apply503020(): void {
    const income = this.store.totalMonthlyIncome();
    if (income <= 0) return;

    const needsBudget = Math.round(income * BUDGET_RULE.needs);
    const wantsBudget = Math.round(income * BUDGET_RULE.wants);

    const categories = this.expenseCategories();
    const needsCats = categories.filter(c => NEEDS_CATEGORIES.includes(c.id));
    const wantsCats = categories.filter(c => WANTS_CATEGORIES.includes(c.id));

    const perNeed = Math.round(needsBudget / (needsCats.length || 1) / 500) * 500;
    const perWant = Math.round(wantsBudget / (wantsCats.length || 1) / 500) * 500;

    for (const cat of needsCats) this.catLimits[cat.id] = perNeed;
    for (const cat of wantsCats) this.catLimits[cat.id] = perWant;

    this.totalLimit = Object.values(this.catLimits).reduce((s, v) => s + v, 0);
    this.toast.info('Applied 50/30/20 rule');
  }

  saveBudget(): void {
    if (!this.totalLimit) { this.toast.warning('Enter a total budget'); return; }
    this.store.setBudget({
      month: this.currentMonth(),
      totalLimit: this.totalLimit,
      categoryLimits: this.catLimits,
      rollover: false,
    });
    this.store.updateSettings({ monthlyBudgetTarget: this.totalLimit });
    this.editing.set(false);
    this.toast.success('Budget saved!');
  }
}
