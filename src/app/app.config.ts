import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  inject,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideOAuthClient } from 'angular-oauth2-oidc';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import { AuthService } from './core/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),

    // allowedUrls limita a que hosts puede la libreria adjuntar el token.
    // Con la lista vacia por defecto lo enviaria a cualquiera.
    provideOAuthClient({
      resourceServer: {
        allowedUrls: ['/api'],
        sendAccessToken: false,
      },
    }),

    // La sesion se resuelve ANTES de que arranque la aplicacion. Si no, el
    // primer componente pediria datos sin token y recibiria un 401 antes de
    // que la libreria termine de canjear el code por el token.
    provideAppInitializer(() => inject(AuthService).init()),
  ],
};
