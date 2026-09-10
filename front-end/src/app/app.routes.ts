import { Routes } from "@angular/router";
import { PageNotFoundComponent } from "./core/layout/page-not-found/page-not-found.component";
import { UnauthorizedPageComponent } from "./core/layout/unauthorized-page/unauthorized-page.component";
import { LoginPageComponent } from "./core/auth/pages/login-page/login-page.component";
import { SignupPageComponent } from "./core/auth/pages/signup-page/signup-page.component";
import { authGuard } from "./core/auth/guards/auth.guard";

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
    path: "employee",
    canActivate: [authGuard],
    data: { requiredRole: "employee" },
    loadChildren: () =>
      import("./features/employee/employee.routes").then(
        (module) => module.employeeRoutes,
      ),
  },
  {
    path: "client",
    canActivate: [authGuard],
    data: { requiredRole: "client" },
    loadChildren: () =>
      import("./features/client/client.routes").then(
        (module) => module.clientRoutes,
      ),
  },
  {
    path: "**",
    component: PageNotFoundComponent,
  },
];
