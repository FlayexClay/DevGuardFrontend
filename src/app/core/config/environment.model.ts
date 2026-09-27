/**
 * Configuracion de entorno.
 *
 * La API siempre se llama con rutas relativas (/api). En desarrollo, ng serve
 * hace de proxy de /api hacia el gateway (ver proxy.conf.json), y en
 * produccion el gateway sirve el frontend y la API desde el mismo origen. Asi
 * el navegador nunca ve dos origenes distintos: CORS no entra en juego para
 * nuestra propia API, ni en desarrollo ni en produccion.
 *
 * La alternativa habria sido abrir CORS en Spring Security, o sea relajar de
 * forma permanente una cabecera de seguridad para resolver una comodidad de
 * desarrollo. En un producto de seguridad eso es dificil de justificar.
 *
 * Keycloak si se llama directamente a su origen. Es deliberado: el claim iss
 * del token lo fija KC_HOSTNAME, y si el navegador pidiera el token a traves
 * del proxy de ng serve, la libreria validaria un issuer distinto del que
 * emite Keycloak y el inicio de sesion fallaria.
 */
export interface Environment {
  production: boolean;
  keycloak: {
    /** Origen publico de Keycloak. Debe coincidir con KC_HOSTNAME. */
    url: string;
    realm: string;
    clientId: string;
  };
}
