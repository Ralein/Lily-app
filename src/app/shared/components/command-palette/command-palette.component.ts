import { Component, HostListener, signal, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LilyIconComponent } from '../../icons/lily-icon.component';
import * as anim from '../../animations';

interface CommandAction {
  id: string;
  label: string;
  iconName: string;
  action: () => void;
  shortcut?: string;
  category: 'Navigation' | 'Actions';
}

@Component({
  selector: 'lily-command-palette',
  standalone: true,
  imports: [
    FormsModule, LilyIconComponent
  ],
  template: `
    @if (isOpen()) {
      <div class="palette-overlay" (click)="close()" [@fadeIn]>
        <div class="palette-dialog" (click)="$event.stopPropagation()" [@slideDown]>
          
          <div class="palette-header">
            <lily-icon name="search" [size]="20" class="search-icon" />
            <input 
              #searchInput
              type="text" 
              class="palette-input" 
              placeholder="Search actions, pages, and more..."
              [(ngModel)]="searchQuery"
              (keydown)="onKeydown($event)"
              (ngModelChange)="filterActions()"
              autocomplete="off"
              spellcheck="false"
            />
            <div class="palette-kbd">ESC</div>
          </div>

          <div class="palette-body custom-scrollbar">
            @if (filteredActions().length > 0) {
              <div class="palette-sections">
                @let categories = getCategories();
                @for (cat of categories; track cat) {
                  <div class="palette-section">
                    <div class="section-header">{{ cat }}</div>
                    <div class="palette-list">
                      @for (action of getActionsByCategory(cat); track action.id) {
                        <button 
                          class="palette-item" 
                          [class.palette-item--selected]="action.id === currentSelectedId()"
                          (click)="executeAction(action)"
                          (mouseenter)="setSelectedIndexById(action.id)"
                        >
                          <div class="item-icon-box">
                            <lily-icon [name]="action.iconName" [size]="18" />
                          </div>
                          <div class="item-content">
                            <span class="item-label">{{ action.label }}</span>
                            @if (action.description) {
                              <span class="item-description">{{ action.description }}</span>
                            }
                          </div>
                          
                          @if (action.shortcut) {
                            <div class="item-shortcut">
                              @for (key of action.shortcut.split('+'); track key) {
                                <span class="key">{{ key }}</span>
                              }
                            </div>
                          }
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="palette-empty">
                <div class="empty-icon">
                  <lily-icon name="search-x" [size]="32" />
                </div>
                <p>No commands found for "{{ searchQuery() }}"</p>
                <span>Try searching for "Dashboard" or "Settings"</span>
              </div>
            }
          </div>
          
          <div class="palette-footer">
            <div class="footer-hint">
              <span class="key-hint"><span class="key">↵</span> Select</span>
              <span class="key-hint"><span class="key">↑</span><span class="key">↓</span> Navigate</span>
            </div>
            <div class="footer-logo">
              <lily-icon name="flower-2" [size]="14" />
              <span>Lily Command</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @use 'animations' as anim;

    .palette-overlay {
      position: fixed;
      inset: 0;
      background: var(--color-bg-overlay);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: var(--z-modal);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 15vh;
    }

    .palette-dialog {
      width: 100%;
      max-width: 640px;
      background: var(--color-bg-card);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--color-bg-glass-border);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-glass), 0 24px 48px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 70vh;
      margin: 0 var(--space-4);
    }

    .palette-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--color-border);
      
      .search-icon {
        color: var(--color-text-tertiary);
      }
      
      .palette-input {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--color-text-primary);
        font-size: var(--fs-md);
        font-weight: var(--fw-medium);
        padding: var(--space-1) 0;
        
        &::placeholder {
          color: var(--color-text-muted);
        }
        
        &:focus {
          outline: none;
        }
      }
      
      .palette-kbd {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        background: var(--color-bg-input);
        border: 1px solid var(--color-border);
        color: var(--color-text-tertiary);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }
    }

    .palette-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-2);
    }

    .palette-sections {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .section-header {
      font-size: var(--fs-xs);
      font-weight: var(--fw-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      padding: var(--space-3) var(--space-3) var(--space-1);
    }

    .palette-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .palette-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-lg);
      width: 100%;
      text-align: left;
      transition: all var(--duration-fast) var(--ease-out);
      color: var(--color-text-secondary);
      
      .item-icon-box {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);
        background: var(--color-bg-input);
        border: 1px solid var(--color-border);
        color: var(--color-text-tertiary);
        transition: all var(--duration-fast);
      }

      .item-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        
        .item-label {
          font-size: var(--fs-base);
          font-weight: var(--fw-semibold);
          color: var(--color-text-primary);
        }
        
        .item-description {
          font-size: var(--fs-xs);
          color: var(--color-text-muted);
        }
      }

      .item-shortcut {
        display: flex;
        gap: 4px;
        
        .key {
          min-width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-input);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 10px;
          font-weight: 700;
          color: var(--color-text-muted);
          padding: 0 4px;
        }
      }

      &--selected {
        background: var(--color-violet-glow);
        color: var(--color-text-primary);
        transform: translateX(4px);
        
        .item-icon-box {
          background: var(--color-violet);
          color: white;
          border-color: var(--color-violet);
          box-shadow: 0 0 12px var(--color-violet-glow);
        }
        
        .item-content .item-label {
          color: var(--color-violet-light);
        }

        .item-shortcut .key {
          border-color: var(--color-violet-dark);
          color: var(--color-violet-light);
        }
      }
    }

    .palette-empty {
      padding: var(--space-12) var(--space-4);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
      
      .empty-icon {
        color: var(--color-text-muted);
        opacity: 0.5;
        margin-bottom: var(--space-2);
      }
      
      p {
        font-size: var(--fs-md);
        font-weight: var(--fw-semibold);
        color: var(--color-text-primary);
      }
      
      span {
        font-size: var(--fs-sm);
        color: var(--color-text-muted);
      }
    }

    .palette-footer {
      padding: var(--space-3) var(--space-5);
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .footer-hint {
        display: flex;
        gap: var(--space-4);
        
        .key-hint {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: 10px;
          font-weight: 600;
          color: var(--color-text-muted);
          
          .key {
            font-family: var(--font-mono);
            font-size: 12px;
            color: var(--color-text-tertiary);
          }
        }
      }
      
      .footer-logo {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: 10px;
        font-weight: 700;
        color: var(--color-text-tertiary);
        opacity: 0.6;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .custom-scrollbar {
      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: var(--color-border-hover);
        border-radius: var(--radius-full);
      }
    }
  `],
  animations: [
    anim.fadeIn,
    anim.slideDown
  ]
})
export class CommandPaletteComponent implements AfterViewInit {
  private router = inject(Router);

  isOpen = signal(false);
  searchQuery = signal('');
  selectedIndex = signal(0);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  allActions: CommandAction[] = [
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View your financial overview',
      iconName: 'layout-dashboard',
      category: 'Navigation',
      shortcut: 'G+D',
      action: () => this.router.navigate(['/dashboard'])
    },
    {
      id: 'nav-transactions',
      label: 'Go to Transactions',
      description: 'Manage your history',
      iconName: 'credit-card',
      category: 'Navigation',
      shortcut: 'G+T',
      action: () => this.router.navigate(['/transactions'])
    },
    {
      id: 'nav-analytics',
      label: 'Go to Analytics',
      description: 'Analyze your spending',
      iconName: 'chart-line',
      category: 'Navigation',
      shortcut: 'G+A',
      action: () => this.router.navigate(['/analytics'])
    },
    {
      id: 'nav-budgets',
      label: 'Go to Budgets',
      description: 'Set spending limits',
      iconName: 'target',
      category: 'Navigation',
      shortcut: 'G+B',
      action: () => this.router.navigate(['/budgets'])
    },
    {
      id: 'nav-goals',
      label: 'Go to Goals',
      description: 'Track savings progress',
      iconName: 'trophy',
      category: 'Navigation',
      shortcut: 'G+G',
      action: () => this.router.navigate(['/goals'])
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      description: 'Configure app preferences',
      iconName: 'settings',
      category: 'Navigation',
      shortcut: 'G+S',
      action: () => this.router.navigate(['/settings'])
    },
    {
      id: 'action-add-transaction',
      label: 'Add Transaction',
      description: 'Record a new expense or income',
      iconName: 'plus-circle',
      category: 'Actions',
      shortcut: 'C',
      action: () => {
        this.router.navigate(['/dashboard'], { queryParams: { add: true } });
      }
    },
    {
      id: 'action-export-data',
      label: 'Export Data',
      description: 'Download your transactions as CSV',
      iconName: 'download',
      category: 'Actions',
      action: () => {
        console.log('Exporting...');
      }
    }
  ];

  filteredActions = signal<CommandAction[]>(this.allActions);
  
  currentSelectedId = computed(() => {
    const actions = this.filteredActions();
    return actions[this.selectedIndex()]?.id || '';
  });

  getCategories() {
    const categories = new Set(this.filteredActions().map(a => a.category));
    return Array.from(categories);
  }

  getActionsByCategory(category: string) {
    return this.filteredActions().filter(a => a.category === category);
  }

  ngAfterViewInit() {
    if (this.isOpen()) {
      this.focusInput();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.toggle();
    }

    if (event.key === 'Escape' && this.isOpen()) {
      this.close();
    }
  }

  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen.set(true);
    this.searchQuery.set('');
    this.filterActions();
    this.selectedIndex.set(0);
    setTimeout(() => this.focusInput(), 50);
  }

  close() {
    this.isOpen.set(false);
  }

  focusInput() {
    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.focus();
    }
  }

  filterActions() {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      this.filteredActions.set(this.allActions);
    } else {
      this.filteredActions.set(
        this.allActions.filter(a => 
          a.label.toLowerCase().includes(query) || 
          a.description?.toLowerCase().includes(query)
        )
      );
    }
    this.selectedIndex.set(0);
  }

  setSelectedIndexById(id: string) {
    const index = this.filteredActions().findIndex(a => a.id === id);
    if (index !== -1) {
      this.selectedIndex.set(index);
    }
  }

  onKeydown(event: KeyboardEvent) {
    const max = this.filteredActions().length - 1;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex.update(i => (i < max ? i + 1 : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex.update(i => (i > 0 ? i - 1 : max));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const action = this.filteredActions()[this.selectedIndex()];
      if (action) {
        this.executeAction(action);
      }
    }
  }

  executeAction(action: CommandAction) {
    action.action();
    this.close();
  }
}
