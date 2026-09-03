import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { map, take } from "rxjs";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data?.["requiredRole"] as
    | "client"
    | "employee"
    | undefined;

  return authService.currentUser$.pipe(
    take(1),
    map((user) => {
      if (!user) {
        return router.createUrlTree(["/login"]);
      }

      if (requiredRole && user.userAccess !== requiredRole) {
        return router.createUrlTree(["/error-unauthorized"]);
      }

      return true;
    }),
  );
};
