import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  ACTIVE_SCAN_STATUSES,
  Project,
  RemediationGroup,
  Repository,
  Scan,
  ScoreTrendPoint,
  SecurityScore,
} from '../../core/api/api.models';
import { FindingsApi } from '../../core/api/findings.api';
import { ProjectsApi } from '../../core/api/projects.api';
import { ScansApi } from '../../core/api/scans.api';
import { describeHttpError } from '../../core/http/http-error';
import { Alert } from '../../shared/ui/alert';
import { AuthorizedRepos } from './components/authorized-repos';
import { RemediationList } from './components/remediation-list';
import { ScanHistory } from './components/scan-history';
import { ScoreCard } from './components/score-card';
import { ScoreTrend } from './components/score-trend';

const TREND_POINTS = 15;
const REMEDIATION_LIMIT = 20;

@Component({
  selector: 'dg-project-detail-page',
  imports: [
    RouterLink,
    Alert,
    ScoreCard,
    ScoreTrend,
    AuthorizedRepos,
    RemediationList,
    ScanHistory,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-detail.page.html',
})
export class ProjectDetailPage implements OnInit {
  private readonly projectsApi = inject(ProjectsApi);
  private readonly scansApi = inject(ScansApi);
  private readonly findingsApi = inject(FindingsApi);
  private readonly destroyRef = inject(DestroyRef);

  /** Parametro :id de la ruta. */
  readonly id = input.required<string>();

  protected readonly project = signal<Project | null>(null);
  protected readonly score = signal<SecurityScore | null>(null);
  protected readonly trend = signal<ScoreTrendPoint[]>([]);
  protected readonly groups = signal<RemediationGroup[]>([]);
  protected readonly repositories = signal<Repository[]>([]);
  protected readonly scans = signal<Scan[]>([]);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected readonly scanInProgress = computed(() =>
    this.scans().some((s) => ACTIVE_SCAN_STATUSES.includes(s.status)),
  );

  ngOnInit(): void {
    this.loadAll();
  }

  protected loadAll(): void {
    const id = this.id();
    this.loading.set(true);
    this.error.set(null);

    this.projectsApi
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.project.set(p);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(describeHttpError(e));
          this.loading.set(false);
        },
      });

    // El score puede no existir: un proyecto sin scans no tiene puntuacion, y
    // el backend devuelve 404. No es un error que haya que mostrar en rojo.
    this.scansApi
      .score(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (s) => this.score.set(s),
        error: () => this.score.set(null),
      });

    // La API devuelve el historial del mas reciente al mas antiguo; la grafica
    // se dibuja en orden cronologico.
    this.scansApi
      .scoreHistory(id, TREND_POINTS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (t) => this.trend.set(t.slice().reverse()),
        error: () => this.trend.set([]),
      });

    this.projectsApi
      .repositories(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => this.repositories.set(r),
        error: () => this.repositories.set([]),
      });

    this.scansApi
      .list(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (s) => this.scans.set(s),
        error: () => this.scans.set([]),
      });

    this.loadGroups();
  }

  protected requestScan(repositoryId: string): void {
    this.notice.set(null);
    this.error.set(null);

    this.scansApi
      .request(this.id(), repositoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (scan) => {
          this.scans.update((list) => [scan, ...list]);
          this.notice.set(
            'Scan encolado. El análisis tarda varios minutos; actualiza para ver el estado.',
          );
        },
        error: (e) => this.error.set(describeHttpError(e)),
      });
  }

  protected onFindingUpdated(): void {
    this.notice.set('Hallazgo actualizado. El Security Score se recalculará en el próximo scan.');
    // Los grupos se recargan porque un hallazgo descartado sale de la vista
    // de acciones activas.
    this.loadGroups();
  }

  private loadGroups(): void {
    this.findingsApi
      .remediations(this.id(), REMEDIATION_LIMIT)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (g) => this.groups.set(g),
        error: (e) => this.error.set(describeHttpError(e)),
      });
  }
}
