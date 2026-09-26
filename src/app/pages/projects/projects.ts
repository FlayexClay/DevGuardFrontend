import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Project } from '../../core/api.models';

@Component({
  selector: 'dg-projects',
  imports: [RouterLink, FormsModule],
  templateUrl: './projects.html',
})
export class ProjectsPage {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);

  protected readonly projects = signal<Project[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly creating = signal(false);

  protected newName = '';
  protected newDescription = '';

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.projects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.describe(e));
        this.loading.set(false);
      },
    });
  }

  protected create(): void {
    if (!this.newName.trim()) {
      return;
    }
    this.creating.set(true);
    this.error.set(null);

    this.api.createProject(this.newName.trim(), this.newDescription.trim() || undefined)
      .subscribe({
        next: (project) => {
          this.projects.update((list) => [project, ...list]);
          this.newName = '';
          this.newDescription = '';
          this.creating.set(false);
        },
        error: (e) => {
          this.error.set(this.describe(e));
          this.creating.set(false);
        },
      });
  }

  /**
   * El backend responde con ProblemDetail, asi que el campo "detail" trae un
   * mensaje util: la cuota del plan agotada, un slug repetido. Mostrar
   * "Error 409" en su lugar obligaria al usuario a abrir las herramientas del
   * navegador para entender que le pasa.
   */
  private describe(e: unknown): string {
    const err = e as { error?: { detail?: string }; status?: number };
    if (err.error?.detail) {
      return err.error.detail;
    }
    if (err.status === 403) {
      return 'No tienes permisos para esta operacion';
    }
    return 'No se pudo completar la operacion';
  }
}
