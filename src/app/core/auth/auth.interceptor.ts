import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Añade el token solo a las peticiones de nuestra API.
 *
 * El filtro por prefijo no es cosmetico: un interceptor que adjunta el token a
 * todo lo enviaria tambien a cualquier host externo que el frontend llegue a
 * consultar, y ahi el token se habria filtrado sin remedio.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const token = inject(AuthService).accessToken;
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
