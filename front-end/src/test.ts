import { getTestBed, TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { provideNgxMask } from 'ngx-mask';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { mockApiInterceptor } from './app/core/interceptors/mock-api.interceptor';

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
      provideHttpClient(withInterceptors([mockApiInterceptor])),
    ],
  });
});
