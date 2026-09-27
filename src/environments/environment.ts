import { Environment } from '../app/core/config/environment.model';

/**
 * Produccion: el gateway publica Keycloak (/realms/...), la API y el frontend
 * en el mismo origen, asi que el issuer es el propio origen de la pagina.
 */
export const environment: Environment = {
  production: true,
  keycloak: {
    url: window.location.origin,
    realm: 'devguard',
    clientId: 'devguard-frontend',
  },
};
