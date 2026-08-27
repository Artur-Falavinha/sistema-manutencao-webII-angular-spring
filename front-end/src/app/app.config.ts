import { ApplicationConfig } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideNgxMask } from "ngx-mask";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideToastr } from "ngx-toastr";

import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideNgxMask(),
    provideAnimationsAsync(),
    provideToastr(),
  ],
};
