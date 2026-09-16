import { Routes } from "@angular/router";
import { PageNotFoundComponent } from "./core/layout/page-not-found/page-not-found.component";
import { UnauthorizedPageComponent } from "./core/layout/unauthorized-page/unauthorized-page.component";
import { LoginPageComponent } from "./core/auth/pages/login-page/login-page.component";
import { SignupPageComponent } from "./core/auth/pages/signup-page/signup-page.component";
import { AuthGuard } from './core/auth/guards/auth.guard';
import { RoleGuard } from './core/auth/guards/role.guard';

export const routes: Routes = [
  {
    path: "",
    redirectTo: "login",
    pathMatch: "full",
  },
  {
    path: "login",
    component: LoginPageComponent,
  },
  {
    path: "signup",
    component: SignupPageComponent,
  },
  {
    path: "error-unauthorized",
    component: UnauthorizedPageComponent,
  },
    {
    path: 'employee',
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'employee' },
    loadChildren: () =>
      import('./features/employee/employee.routes').then(
        (module) => module.employeeRoutes,
      ),
  },
  {
    path: 'client',
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'client' },
    loadChildren: () =>
      import('./features/client/client.routes').then(
        (module) => module.clientRoutes,
      ),
  },
  {
    path: "**",
    component: PageNotFoundComponent,
  },
];
