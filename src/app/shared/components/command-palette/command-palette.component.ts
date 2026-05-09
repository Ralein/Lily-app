import { Component, HostListener, signal, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LilyIconComponent } from '../../icons/lily-icon.component';

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
      <div class="palette-overlay" (click)="close()">
        <div class="palette-dialog" (click)="$event.stopPropagation()">
          
          <div class="palette-header">
            <lily-icon name="search" [size]="20" class="search-icon" />
            <input 
              #searchInput
              type="text" 
              class="palette-input" 
              placeholder="Type a command or search..."
              [(ngModel)]="searchQuery"
              (keydown)="onKeydown($event)"
              (ngModelChange)="filterActions()"
              autocomplete="off"
              spellcheck="false"
            />
            <div class="palette-hint">esc</div>
          </div>

          <div class="palette-body">
            @if (filteredActions().length > 0) {
              <div class="palette-list">
                @for (action of filteredActions(); track action.id; let i = $index) {
                  <button 
                    class="palette-item" 
                    [class.palette-item--selected]="selectedIndex() === i"
                    (click)="executeAction(action)"
                    (mouseenter)="selectedIndex.set(i)"
                  >
                    <div class="item-icon">
                      <lily-icon [name]="action.iconName" [size]="18" />
                    </div>
                    <span class="item-label">{{ action.label }}</span>
                    
                    @if (action.shortcut) {
                      <div class="item-shortcut">
                        <span class="key">{{ action.shortcut.split('+')[0] }}</span>
                        <span class="key">{{ action.shortcut.split('+')[1] }}</span>
                      </div>
                    }
                  </button>
                }
              </div>
            } @else {
              <div class="palette-empty">
                <p>No results found.</p>
              </div>
            }
          </div>
          
          <div class="palette-footer">
            <div class="footer-shortcuts">
              <span><span class="key">↑</span> <span class="key">↓</span> to navigate</span>
              <span><span class="key">↵</span> to select</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './command-palette.component.scss'
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
      iconName: 'layout-dashboard',
      category: 'Navigation',
      shortcut: 'G+D',
      action: () => this.router.navigate(['/dashboard'])
    },
    {
      id: 'nav-transactions',
      label: 'Go to Transactions',
      iconName: 'arrow-right',
      category: 'Navigation',
      shortcut: 'G+T',
      action: () => this.router.navigate(['/transactions'])
    },
    {
      id: 'nav-budgets',
      label: 'Go to Budgets',
      iconName: 'wallet',
      category: 'Navigation',
      shortcut: 'G+B',
      action: () => this.router.navigate(['/budgets'])
    },
    {
      id: 'nav-goals',
      label: 'Go to Goals',
      iconName: 'target',
      category: 'Navigation',
      shortcut: 'G+G',
      action: () => this.router.navigate(['/goals'])
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      iconName: 'settings',
      category: 'Navigation',
      shortcut: 'G+S',
      action: () => this.router.navigate(['/settings'])
    },
    {
      id: 'action-add-transaction',
      label: 'Add Transaction',
      iconName: 'plus',
      category: 'Actions',
      shortcut: 'C',
      action: () => {
        // Just route to dashboard for now, could integrate a global add modal later
        this.router.navigate(['/dashboard']);
      }
    }
  ];

  filteredActions = signal<CommandAction[]>(this.allActions);

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
        this.allActions.filter(a => a.label.toLowerCase().includes(query))
      );
    }
    this.selectedIndex.set(0);
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
