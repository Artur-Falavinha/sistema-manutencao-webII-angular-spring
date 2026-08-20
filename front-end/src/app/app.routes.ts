import { Routes } from "@angular/router";

import { FoundationPageComponent } from "./foundation-page/foundation-page.component";
import { LoginPageComponent } from "./core/auth/pages/login-page/login-page.component";
import { SignupPageComponent } from "./core/auth/pages/signup-page/signup-page.component";

export const routes: Routes = [
  {
    path: "",
    component: FoundationPageComponent,
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
    path: "employee",
    loadChildren: () =>
      import("./features/employee/employee.routes").then(
        (module) => module.employeeRoutes,
      ),
  },
  {
    path: "**",
    redirectTo: "",
  },
];
