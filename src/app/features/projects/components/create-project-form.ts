import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Project } from '../../../core/api/api.models';
import { ProjectsApi } from '../../../core/api/projects.api';
import { describeHttpError } from '../../../core/http/http-error';
import { Alert } from '../../../shared/ui/alert';

@Component({
  selector: 'dg-create-project-form',
  imports: [FormsModule, Alert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'dg-card block p-5' },
  template: `
    <h2 class="text-sm font-medium text-slate-300">Nuevo proyecto</h2>
    <form class="mt-3 flex flex-col gap-3 sm:flex-row" (ngSubmit)="submit()">
      <input
        type="text"
        name="name"
        placeholder="Nombre"
        aria-label="Nombre del proyecto"
        class="dg-input flex-1"
        [(ngModel)]="name"
      />
      <input
        type="text"
        name="description"
        placeholder="Descripción (opcional)"
        aria-label="Descripción del proyecto"
        class="dg-input flex-1"
        [(ngModel)]="description"
      />
      <button type="submit" class="dg-btn-primary" [disabled]="!canSubmit()">
        {{ creating() ? 'Creando...' : 'Crear' }}
      </button>
    </form>
    @if (error(); as message) {
      <dg-alert kind="error" class="mt-3">{{ message }}</dg-alert>
    }
  `,
})
export class CreateProjectForm {
  private readonly projectsApi = inject(ProjectsApi);

  readonly created = output<Project>();

  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly creating = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly canSubmit = computed(() => !this.creating() && !!this.name().trim());

  protected submit(): void {
    if (!this.canSubmit()) {
      return;
    }
    this.creating.set(true);
    this.error.set(null);

    this.projectsApi.create(this.name().trim(), this.description().trim() || undefined).subscribe({
      next: (project) => {
        this.name.set('');
        this.description.set('');
        this.creating.set(false);
        this.created.emit(project);
      },
      error: (e) => {
        this.error.set(describeHttpError(e));
        this.creating.set(false);
      },
    });
  }
}
