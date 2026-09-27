import { Injectable, computed, inject, signal } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './auth.config';

export type Role = 'ADMIN' | 'SECURITY_ANALYST' | (string & {});

export interface SessionUser {
  subject: string;
  email: string | null;
  name: string | null;
  organization: string | null;
  roles: Role[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oauth = inject(OAuthService);
  private readonly userSignal = signal<SessionUser | null>(null);
  private readonly unavailableSignal = signal(false);

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  /** El proveedor de identidad no respondio al arrancar. */
  readonly unavailable = this.unavailableSignal.asReadonly();

  /** Roles que pueden cambiar el estado de un hallazgo. */
  readonly canManageFindings = computed(() => this.hasAnyRole('ADMIN', 'SECURITY_ANALYST'));

  readonly isAdmin = computed(() => this.hasAnyRole('ADMIN'));

  async init(): Promise<void> {
    this.oauth.configure(authConfig);
    this.oauth.setupAutomaticSilentRefresh();

    // Los claims se releen con cada token nuevo, y la sesion se cierra en la
    // interfaz si la renovacion falla: si no, se seguiria mostrando un usuario
    // cuyas peticiones ya reciben 401.
    this.oauth.events.subscribe((event) => {
      switch (event.type) {
        case 'token_received':
        case 'token_refreshed':
          this.readClaims();
          break;
        case 'token_refresh_error':
        case 'session_terminated':
        case 'logout':
          this.userSignal.set(null);
          break;
      }
    });

    // loadDiscoveryDocumentAndTryLogin resuelve el retorno del proveedor: si
    // la URL trae el code, lo canjea; si no, simplemente no hay sesion.
    // Si Keycloak no responde, la app arranca igual y lo indica, en lugar de
    // quedarse en blanco por un inicializador que lanza.
    try {
      await this.oauth.loadDiscoveryDocumentAndTryLogin();
      this.readClaims();
    } catch (e) {
      console.error('No se pudo contactar con el proveedor de identidad', e);
      this.unavailableSignal.set(true);
    }
  }

  login(): void {
    this.oauth.initCodeFlow();
  }

  logout(): void {
    this.userSignal.set(null);
    this.oauth.logOut();
  }

  get accessToken(): string | null {
    return this.oauth.hasValidAccessToken() ? this.oauth.getAccessToken() : null;
  }

  private hasAnyRole(...roles: Role[]): boolean {
    const current = this.userSignal()?.roles ?? [];
    return roles.some((r) => current.includes(r));
  }

  /**
   * Lee los claims del token.
   *
   * organization_id y realm_access.roles son los dos que importan, y son los
   * mismos que el backend usa para el aislamiento y la autorizacion. Aqui solo
   * sirven para la interfaz: ocultar un boton no es una medida de seguridad,
   * la decision real la toma el servidor con el mismo token.
   */
  private readClaims(): void {
    if (!this.oauth.hasValidAccessToken()) {
      this.userSignal.set(null);
      return;
    }

    const claims = this.oauth.getIdentityClaims() as Record<string, unknown> | null;
    const accessClaims = decodeJwtPayload(this.oauth.getAccessToken());

    const realmAccess = accessClaims?.['realm_access'] as { roles?: string[] } | undefined;

    this.userSignal.set({
      subject: (accessClaims?.['sub'] as string) ?? '',
      email: (claims?.['email'] as string) ?? (accessClaims?.['email'] as string) ?? null,
      name: (claims?.['name'] as string) ?? (claims?.['preferred_username'] as string) ?? null,
      organization: (accessClaims?.['organization_id'] as string) ?? null,
      roles: realmAccess?.roles ?? [],
    });
  }
}

/**
 * organization_id y los roles viajan en el access token, no en el id token,
 * asi que hay que decodificarlo a mano. Solo se lee el payload: la firma la
 * valida el backend, que es quien debe hacerlo.
 */
function decodeJwtPayload(token: string | null): Record<string, unknown> | null {
  if (!token) {
    return null;
  }
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}
