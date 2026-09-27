import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Repository } from '../../../core/api/api.models';
import { AuthService } from '../../../core/auth/auth.service';
import { ConnectRepoForm } from './connect-repo-form';

@Component({
  selector: 'dg-authorized-repos',
  imports: [ConnectRepoForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'dg-card block p-6 lg:p-8' },
  template: `
    <div class="flex items-center justify-between gap-3">
      <h2 class="dg-card-title">Repositorios autorizados</h2>
      @if (auth.isAdmin()) {
        <button
          type="button"
          class="dg-btn-secondary px-4 py-2"
          (click)="formOpen.set(!formOpen())"
        >
          {{ formOpen() ? 'Cancelar' : 'Conectar' }}
        </button>
      }
    </div>

    @if (auth.isAdmin() && formOpen()) {
      <dg-connect-repo-form
        class="mt-6 block border-b border-slate-800 pb-8"
        [projectId]="projectId()"
        (connected)="onConnected($event)"
      />
    }

    @if (authorized().length === 0) {
      <p class="mt-6 text-sm text-slate-500">
        Ninguno conectado. Solo se escanean repositorios con autorización explícita.
      </p>
    } @else {
      <ul class="mt-6 divide-y divide-slate-800">
        @for (repo of authorized(); track repo.id) {
          <li class="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div class="min-w-0">
              <p class="truncate font-mono text-sm text-slate-200">{{ repo.fullName }}</p>
              <p class="mt-1 text-sm text-slate-500">{{ repo.defaultBranch }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-3">
              @if (auth.isAdmin()) {
                <button
                  type="button"
                  class="dg-btn-secondary px-4 py-2"
                  (click)="confirmRevoke(repo)"
                >
                  Revocar
                </button>
              }
              <button
                type="button"
                class="dg-btn-primary px-4 py-2"
                [disabled]="scanInProgress()"
                (click)="scanRequested.emit(repo.id)"
              >
                Escanear
              </button>
            </div>
          </li>
        }
      </ul>
      @if (scanInProgress()) {
        <p class="mt-4 text-sm text-amber-400">
          Hay un scan en curso. Solo se permite uno a la vez por repositorio.
        </p>
      }
    }

    <!--
      Los revocados se siguen mostrando: existen, conservan su historial y
      pueden volver a conectarse, pero no se pueden analizar.
    -->
    @if (unauthorized().length > 0) {
      <h3 class="mt-8 text-sm font-medium text-slate-500">Sin autorización</h3>
      <ul class="mt-3 space-y-3">
        @for (repo of unauthorized(); track repo.id) {
          <li class="min-w-0">
            <p class="truncate font-mono text-sm text-slate-500 line-through">
              {{ repo.fullName }}
            </p>
            <p class="mt-0.5 text-sm text-slate-600">No se puede escanear</p>
          </li>
        }
      </ul>
    }
  `,
})
export class AuthorizedRepos {
  protected readonly auth = inject(AuthService);

  readonly projectId = input.required<string>();
  readonly repositories = input.required<Repository[]>();
  readonly scanInProgress = input(false);

  /** Emite el id del repositorio a escanear. */
  readonly scanRequested = output<string>();
  /** Emite el id del repositorio cuya autorizacion se revoca, ya confirmado. */
  readonly revokeRequested = output<string>();
  readonly connected = output<Repository>();

  protected readonly formOpen = signal(false);

  protected readonly authorized = computed(() => this.repositories().filter((r) => r.authorized));
  protected readonly unauthorized = computed(() =>
    this.repositories().filter((r) => !r.authorized),
  );

  protected confirmRevoke(repo: Repository): void {
    const ok = confirm(
      `¿Revocar la autorización de ${repo.fullName}?\n\n` +
        'No se borra el repositorio ni su historial de scans: solo deja de poder escanearse.',
    );
    if (ok) {
      this.revokeRequested.emit(repo.id);
    }
  }

  protected onConnected(repo: Repository): void {
    this.formOpen.set(false);
    this.connected.emit(repo);
  }
}
