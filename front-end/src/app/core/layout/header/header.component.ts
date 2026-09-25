import { Component } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, UserState } from '../../auth/services/auth.service';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { Observable } from 'rxjs';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-header',
  imports: [CommonModule, MatToolbar, MatIconModule, AsyncPipe, MatButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  public isEmployee$: Observable<boolean>;
  public currentUser$: Observable<UserState>;

  constructor(
    private authService: AuthService,
    private sidebarState: SidebarStateService
  ) {
    this.isEmployee$ = this.authService.isEmployee$;
    this.currentUser$ = this.authService.currentUser$;
  }

  logout() {
    this.authService.logout();
  }

  isSidebarExpanded(): boolean {
    return this.sidebarState.isExpandedValue();
  }
}
