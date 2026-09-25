import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/layout/header/header.component';
import { SideBarComponent } from './core/layout/side-bar/side-bar.component';
import { AuthService } from './core/auth/services/auth.service';
import { combineLatest, filter, map, Observable, startWith } from 'rxjs';
import { NgxSpinnerModule } from 'ngx-spinner';

const PUBLIC_ROUTES = new Set(['/login', '/signup', '/error-unauthorized']);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, SideBarComponent, AsyncPipe, NgxSpinnerModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'front-end';

  public showEmployeeShell$: Observable<boolean>;
  public showClientShell$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    const currentUrl$ = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    );

    const shellContext$ = combineLatest([
      this.authService.isLoggedIn$,
      this.authService.isEmployee$,
      currentUrl$,
    ]);

    this.showEmployeeShell$ = shellContext$.pipe(
      map(([loggedIn, isEmployee, url]) =>
        loggedIn && isEmployee && !this.isPublicRoute(url),
      ),
    );

    this.showClientShell$ = shellContext$.pipe(
      map(([loggedIn, isEmployee, url]) =>
        loggedIn && !isEmployee && !this.isPublicRoute(url),
      ),
    );
  }

  private isPublicRoute(url: string): boolean {
    const path = url.split('?')[0].split('#')[0];
    return PUBLIC_ROUTES.has(path);
  }
}
