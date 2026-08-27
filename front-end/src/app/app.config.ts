import { ApplicationConfig } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideNgxMask } from "ngx-mask";
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideToastr } from 'ngx-toastr';

import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideNgxMask()],
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideToastr(),
  ]
};
