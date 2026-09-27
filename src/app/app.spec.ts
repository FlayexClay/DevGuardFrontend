import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AuthService } from './core/auth/auth.service';

function authStub(state: { authenticated?: boolean; unavailable?: boolean }) {
  return {
    isAuthenticated: signal(state.authenticated ?? false),
    unavailable: signal(state.unavailable ?? false),
    user: signal(null),
    login: vi.fn(),
    logout: vi.fn(),
  };
}

async function render(state: { authenticated?: boolean; unavailable?: boolean }) {
  await TestBed.configureTestingModule({
    imports: [App],
    providers: [provideRouter([]), { provide: AuthService, useValue: authStub(state) }],
  }).compileComponents();

  const fixture = TestBed.createComponent(App);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('App', () => {
  it('pide iniciar sesion cuando no hay sesion', async () => {
    const el = await render({});
    expect(el.querySelector('h1')?.textContent).toContain('Inicia sesión');
    expect(el.querySelector('router-outlet')).toBeNull();
  });

  it('avisa cuando el proveedor de identidad no responde', async () => {
    const el = await render({ unavailable: true });
    expect(el.querySelector('h1')?.textContent).toContain('servicio de identidad');
  });

  it('muestra las rutas cuando hay sesion', async () => {
    const el = await render({ authenticated: true });
    expect(el.querySelector('router-outlet')).not.toBeNull();
  });
});
