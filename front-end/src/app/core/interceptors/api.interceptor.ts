import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URL } from '../configs/api.token';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  
  const token = localStorage.getItem('token'); 
  const apiUrl = inject(API_URL);

  if (token && (req.url === apiUrl || req.url.startsWith(`${apiUrl}/`))) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};