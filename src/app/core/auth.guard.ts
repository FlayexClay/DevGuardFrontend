import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Redirige al inicio de sesion si no hay sesion.
 *
 * Es comodidad de navegacion, no seguridad: cualquiera puede saltarse un guard
 * del navegador. Lo que protege los datos es que cada peticion lleva el token
 * y el backend lo valida.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) {
    return true;
  }
  auth.login();
  return false;
};
