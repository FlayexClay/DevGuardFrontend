/**
 * Configuracion de entorno.
 *
 * apiBase queda vacio a proposito. En desarrollo, ng serve hace de proxy de
 * /api hacia el gateway (ver proxy.conf.json), y en produccion nginx sirve el
 * frontend y la API desde el mismo origen. Asi las peticiones son siempre
 * relativas y el navegador nunca ve dos origenes distintos: CORS no entra en
 * juego para nuestra propia API, ni en desarrollo ni en produccion.
 *
 * La alternativa habria sido abrir CORS en Spring Security, o sea relajar de
 * forma permanente una cabecera de seguridad para resolver una comodidad de
 * desarrollo. En un producto de seguridad eso es dificil de justificar.
 *
 * Keycloak si se llama directamente a su origen. Es deliberado: el claim iss
 * del token lo fija KC_HOSTNAME, y si el navegador pidiera el token a traves
 * del proxy, la libreria validaria un issuer distinto del que emite Keycloak y
 * el inicio de sesion fallaria. Keycloak resuelve su propio CORS con
 * webOrigins, que es el mecanismo previsto para eso.
 */
export const APP_CONFIG = {
  apiBase: '',
  keycloak: {
    url: 'http://localhost:8081',
    realm: 'devguard',
    clientId: 'devguard-frontend',
  },
} as const;
