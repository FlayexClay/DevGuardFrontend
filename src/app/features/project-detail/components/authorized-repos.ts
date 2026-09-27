import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Repository } from '../../../core/api/api.models';

@Component({
  selector: 'dg-authorized-repos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'dg-card block p-6' },
  template: `
    <h2 class="text-sm font-medium text-slate-400">Repositorios autorizados</h2>

    @if (authorized().length === 0) {
      <p class="mt-4 text-sm text-slate-500">
        Ninguno conectado. Solo se escanean repositorios con autorización explícita.
      </p>
    } @else {
      <ul class="mt-4 space-y-3">
        @for (repo of authorized(); track repo.id) {
          <li class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-mono text-xs text-slate-300">{{ repo.fullName }}</p>
              <p class="text-xs text-slate-600">{{ repo.defaultBranch }}</p>
            </div>
            <button
              type="button"
              class="dg-btn-primary shrink-0 px-3 py-1.5 text-xs"
              [disabled]="scanInProgress()"
              (click)="scanRequested.emit(repo.id)"
            >
              Escanear
            </button>
          </li>
        }
      </ul>
      @if (scanInProgress()) {
        <p class="mt-3 text-xs text-amber-400">
          Hay un scan en curso. Solo se permite uno a la vez por repositorio.
        </p>
      }
    }
  `,
})
export class AuthorizedRepos {
  readonly repositories = input.required<Repository[]>();
  readonly scanInProgress = input(false);

  /** Emite el id del repositorio a escanear. */
  readonly scanRequested = output<string>();

  protected readonly authorized = computed(() => this.repositories().filter((r) => r.authorized));
}
