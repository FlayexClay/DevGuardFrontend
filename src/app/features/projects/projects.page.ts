import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Project } from '../../core/api/api.models';
import { ProjectsApi } from '../../core/api/projects.api';
import { AuthService } from '../../core/auth/auth.service';
import { describeHttpError } from '../../core/http/http-error';
import { Alert } from '../../shared/ui/alert';
import { CreateProjectForm } from './components/create-project-form';

@Component({
  selector: 'dg-projects-page',
  imports: [RouterLink, Alert, CreateProjectForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects.page.html',
})
export class ProjectsPage {
  private readonly projectsApi = inject(ProjectsApi);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  protected readonly projects = signal<Project[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.projectsApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projects) => {
          this.projects.set(projects);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(describeHttpError(e));
          this.loading.set(false);
        },
      });
  }

  protected onCreated(project: Project): void {
    this.projects.update((list) => [project, ...list]);
  }
}
