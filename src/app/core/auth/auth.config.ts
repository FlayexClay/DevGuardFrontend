import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../../environments/environment';

const { url, realm, clientId } = environment.keycloak;

export const authConfig: AuthConfig = {
  issuer: `${url}/realms/${realm}`,
  redirectUri: window.location.origin + '/',
  postLogoutRedirectUri: window.location.origin + '/',
  clientId,

  // Authorization Code con PKCE. El flujo implicito esta obsoleto y expone el
  // token en la URL; el realm ya declara pkce.code.challenge.method = S256.
  responseType: 'code',
  scope: 'openid profile email',

  // HTTP solo se admite contra localhost. Cualquier otro host exige HTTPS, asi
  // que un despliegue sin TLS falla de forma visible en lugar de dejar viajar
  // el token en claro.
  requireHttps: 'remoteOnly',

  // El token dura 15 minutos y un scan puede tardar mas. AuthService activa la
  // renovacion automatica; con useSilentRefresh = false se hace con el
  // refresh token del flujo code, sin el iframe oculto de silent refresh.
  useSilentRefresh: false,
  timeoutFactor: 0.75,

  showDebugInformation: false,

  // El backend valida el issuer contra la URL publica. Si algun dia el
  // documento de descubrimiento y el issuer configurado difieren, es que
  // KC_HOSTNAME no coincide con PUBLIC_URL, y conviene que falle aqui de
  // forma ruidosa en lugar de dar 401 sin explicacion en cada peticion.
  strictDiscoveryDocumentValidation: true,
};
