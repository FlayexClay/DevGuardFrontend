import { Environment } from '../app/core/config/environment.model';

/**
 * Desarrollo con ng serve (localhost:4200): Keycloak se alcanza a traves del
 * gateway local, cuyo puerto es HTTP_PORT en el .env de la infraestructura.
 */
export const environment: Environment = {
  production: false,
  keycloak: {
    url: 'http://localhost:8081',
    realm: 'devguard',
    clientId: 'devguard-frontend',
  },
};
