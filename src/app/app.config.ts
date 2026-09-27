import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  inject,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideOAuthClient } from 'angular-oauth2-oidc';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Los parametros de ruta (:id) llegan a las paginas como inputs.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),

    // allowedUrls limita a que hosts puede la libreria adjuntar el token.
    // Con la lista vacia por defecto lo enviaria a cualquiera. El token lo
    // adjunta authInterceptor, por eso sendAccessToken queda en false.
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
