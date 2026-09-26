import { AuthConfig } from 'angular-oauth2-oidc';
import { APP_CONFIG } from './app-config';

const { url, realm, clientId } = APP_CONFIG.keycloak;

export const authConfig: AuthConfig = {
  issuer: `${url}/realms/${realm}`,
  redirectUri: window.location.origin + '/',
  postLogoutRedirectUri: window.location.origin + '/',
  clientId,

  // Authorization Code con PKCE. El flujo implicito esta obsoleto y expone el
  // token en la URL; el realm ya declara pkce.code.challenge.method = S256.
  responseType: 'code',
  scope: 'openid profile email',

  // Solo para desarrollo local. En AWS, con HTTPS, hay que quitarlo: dejarlo
  // permitiria que el token viajara en claro sin que nada avise.
  requireHttps: false,

  // Renovacion silenciosa: el token dura 15 minutos y un scan puede tardar
  // mas. Sin esto, el usuario se queda sin sesion mirando un scan en curso.
  useSilentRefresh: false,
  silentRefreshTimeout: 5000,
  timeoutFactor: 0.75,

  showDebugInformation: false,

  // El backend valida el issuer contra la URL publica. Si algun dia el
  // documento de descubrimiento y el issuer configurado difieren, es que
  // KC_HOSTNAME no coincide con PUBLIC_URL, y conviene que falle aqui de
  // forma ruidosa en lugar de dar 401 sin explicacion en cada peticion.
  strictDiscoveryDocumentValidation: true,
};
