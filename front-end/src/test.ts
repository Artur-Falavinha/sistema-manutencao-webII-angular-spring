import { getTestBed, TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { provideNgxMask } from 'ngx-mask';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { mockApiInterceptor } from './testing/core/interceptors/mock-api.interceptor';
import { API_URL } from './app/core/configs/api.token';
import { provideBrazilianMaterialDate } from './app/shared/providers/material-date.providers';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
);

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      provideNgxMask(),
      { provide: API_URL, useValue: 'http://localhost:8080/api' },
      ...provideBrazilianMaterialDate(),
      provideNoopAnimations(),
      provideToastr(),
      provideHttpClient(withInterceptors([mockApiInterceptor])),
      provideHttpClientTesting(),
    ],
  });
});
