import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '../configs/api.token';
import { apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  const apiUrl = 'http://localhost:8080/api';
  let http: HttpClient;
  let requests: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([apiInterceptor])),
      provideHttpClientTesting(),
      { provide: API_URL, useValue: apiUrl },
    ] });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
    localStorage.setItem('token', 'token-de-teste');
  });

  afterEach(() => {
    requests.verify();
    localStorage.removeItem('token');
  });

  for (const url of [apiUrl, `${apiUrl}/requests/client`]) {
    it(`envia Bearer somente à API: ${url}`, () => {
      http.get(url).subscribe();
      const request = requests.expectOne(url);
      expect(request.request.headers.get('Authorization')).toBe('Bearer token-de-teste');
      request.flush({});
    });
  }

  for (const url of ['https://viacep.com.br/ws/80010000/json', `${apiUrl}-externa`, 'http://localhost:8080.exemplo.com/api']) {
    it(`não transmite o token a ${url}`, () => {
      http.get(url).subscribe();
      const request = requests.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBeFalse();
      request.flush({});
    });
  }
});
