import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Repository } from '../../../core/api/api.models';
import { ProjectsApi } from '../../../core/api/projects.api';
import { describeHttpError } from '../../../core/http/http-error';
import { Alert } from '../../../shared/ui/alert';

/** Mismo patron que valida el backend para owner/repo. */
const FULL_NAME_PATTERN = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

type Provider = 'GITHUB' | 'GITLAB';
type Visibility = 'PUBLIC' | 'PRIVATE' | 'INTERNAL';

@Component({
  selector: 'dg-connect-repo-form',
  imports: [FormsModule, Alert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="space-y-5" (ngSubmit)="submit()">
      <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <label class="dg-label">
          Proveedor
          <select
            name="provider"
            class="dg-input mt-1.5"
            [ngModel]="provider()"
            (ngModelChange)="onProviderChange($event)"
          >
            <option value="GITHUB">GitHub</option>
            <option value="GITLAB">GitLab</option>
          </select>
        </label>
        <label class="dg-label">
          Visibilidad
          <select name="visibility" class="dg-input mt-1.5" [(ngModel)]="visibility">
            <option value="PUBLIC">Pública</option>
            <option value="PRIVATE">Privada</option>
            <option value="INTERNAL">Interna</option>
          </select>
        </label>

        <label class="dg-label sm:col-span-2">
          Repositorio
          <input
            type="text"
            name="fullName"
            placeholder="owner/repo"
            autocomplete="off"
            class="dg-input mt-1.5 font-mono"
            [attr.aria-invalid]="fullNameInvalid()"
            [ngModel]="fullName()"
            (ngModelChange)="onFullNameChange($event)"
          />
          @if (fullNameInvalid()) {
            <span class="mt-1.5 block text-xs text-red-400">Usa el formato owner/repo.</span>
          }
        </label>
      </div>

      <div class="grid gap-5 sm:grid-cols-3">
        <label class="dg-label sm:col-span-2">
          URL de clonado
          <input
            type="text"
            name="cloneUrl"
            placeholder="https://..."
            autocomplete="off"
            class="dg-input mt-1.5 font-mono"
            [ngModel]="cloneUrl()"
            (ngModelChange)="onCloneUrlChange($event)"
          />
        </label>

        <label class="dg-label">
          Rama por defecto
          <input
            type="text"
            name="defaultBranch"
            placeholder="main"
            autocomplete="off"
            class="dg-input mt-1.5 font-mono"
            [(ngModel)]="defaultBranch"
          />
        </label>
      </div>

      <label class="flex items-start gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          name="authorizationConfirmed"
          class="mt-1 accent-sky-600"
          [(ngModel)]="authorizationConfirmed"
        />
        <span>
          Declaro que tengo derecho a escanear este repositorio, ya sea como propietario o con
          permiso explícito de quien lo es.
        </span>
      </label>

      @if (error(); as message) {
        <dg-alert kind="error">{{ message }}</dg-alert>
      }

      <button type="submit" class="dg-btn-primary w-full sm:w-auto" [disabled]="!canSubmit()">
        {{ saving() ? 'Conectando...' : 'Conectar repositorio' }}
      </button>
    </form>
  `,
})
export class ConnectRepoForm {
  private readonly projectsApi = inject(ProjectsApi);

  readonly projectId = input.required<string>();
  readonly connected = output<Repository>();

  protected readonly provider = signal<Provider>('GITHUB');
  protected readonly fullName = signal('');
  protected readonly cloneUrl = signal('');
  protected readonly defaultBranch = signal('');
  protected readonly visibility = signal<Visibility>('PRIVATE');
  protected readonly authorizationConfirmed = signal(false);

  /**
   * La URL se autocompleta mientras el usuario no la toque. Despues se
   * respeta lo que escribio: GitLab autoalojado, o un mirror, usan otro host.
   */
  private readonly cloneUrlEdited = signal(false);

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly fullNameValid = computed(() => FULL_NAME_PATTERN.test(this.fullName().trim()));

  protected readonly fullNameInvalid = computed(
    () => this.fullName().trim() !== '' && !this.fullNameValid(),
  );

  protected readonly canSubmit = computed(
    () =>
      !this.saving() &&
      this.fullNameValid() &&
      this.cloneUrl().trim() !== '' &&
      this.authorizationConfirmed(),
  );

  protected onProviderChange(value: Provider): void {
    this.provider.set(value);
    this.syncCloneUrl();
  }

  protected onFullNameChange(value: string): void {
    this.fullName.set(value);
    this.syncCloneUrl();
  }

  protected onCloneUrlChange(value: string): void {
    this.cloneUrl.set(value);
    // Vaciar el campo devuelve el control al autocompletado.
    this.cloneUrlEdited.set(value.trim() !== '');
  }

  protected submit(): void {
    if (!this.canSubmit()) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);

    this.projectsApi
      .connectRepository(this.projectId(), {
        provider: this.provider(),
        fullName: this.fullName().trim(),
        cloneUrl: this.cloneUrl().trim(),
        // Vacia se omite y el backend usa main.
        defaultBranch: this.defaultBranch().trim() || undefined,
        visibility: this.visibility(),
        authorizationConfirmed: this.authorizationConfirmed(),
      })
      .subscribe({
        next: (repo) => {
          this.reset();
          this.connected.emit(repo);
        },
        error: (e) => {
          this.error.set(describeHttpError(e));
          this.saving.set(false);
        },
      });
  }

  private syncCloneUrl(): void {
    if (this.cloneUrlEdited()) {
      return;
    }
    const name = this.fullName().trim();
    // Solo GitHub tiene un host fijo. Para GitLab se deja vacia en lugar de
    // arrastrar una URL de GitHub que el usuario no escribio.
    this.cloneUrl.set(this.provider() === 'GITHUB' && name ? `https://github.com/${name}.git` : '');
  }

  private reset(): void {
    this.provider.set('GITHUB');
    this.fullName.set('');
    this.cloneUrl.set('');
    this.cloneUrlEdited.set(false);
    this.defaultBranch.set('');
    this.visibility.set('PRIVATE');
    this.authorizationConfirmed.set(false);
    this.saving.set(false);
  }
}
