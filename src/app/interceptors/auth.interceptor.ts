import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // For cookie-based auth, we just need to add withCredentials: true
  // The cookies will be sent automatically by the browser
  
  const clonedReq = req.clone({
    withCredentials: true // 👈 This is the most important line
  });
  
  return next(clonedReq);
};