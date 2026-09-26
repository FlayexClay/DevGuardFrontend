import { DatePipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import {
  Finding,
  Project,
  RemediationGroup,
  Repository,
  Scan,
  ScoreTrendPoint,
  SecurityScore,
} from '../../core/api.models';

@Component({
  selector: 'dg-project-detail',
  // En standalone hay que declarar hasta los pipes: keyvalue para el desglose
  // del score, number y date para la tabla de scans.
  imports: [RouterLink, FormsModule, KeyValuePipe, DecimalPipe, DatePipe],
  templateUrl: './project-detail.html',
})
export class ProjectDetailPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);

  protected readonly projectId = this.route.snapshot.paramMap.get('id')!;

  protected readonly project = signal<Project | null>(null);
  protected readonly score = signal<SecurityScore | null>(null);
  protected readonly trend = signal<ScoreTrendPoint[]>([]);
  protected readonly groups = signal<RemediationGroup[]>([]);
  protected readonly repositories = signal<Repository[]>([]);
  protected readonly scans = signal<Scan[]>([]);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  /** Grupo desplegado y sus hallazgos concretos. */
  protected readonly expandedKey = signal<string | null>(null);
  protected readonly expandedFindings = signal<Finding[]>([]);

  /** Formulario de descarte del hallazgo que se esta revisando. */
  protected readonly reviewing = signal<Finding | null>(null);
  protected reviewNote = '';
  protected reviewStatus = 'FALSE_POSITIVE';

  protected readonly scanInProgress = computed(() =>
    this.scans().some((s) => ['REQUESTED', 'QUEUED', 'RUNNING'].includes(s.status)),
  );

  protected readonly authorizedRepos = computed(() =>
    this.repositories().filter((r) => r.authorized),
  );

  constructor() {
    this.loadAll();
  }

  protected loadAll(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.project(this.projectId).subscribe({
      next: (p) => {
        this.project.set(p);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.describe(e));
        this.loading.set(false);
      },
    });

    // El score puede no existir: un proyecto sin scans no tiene puntuacion, y
    // el backend devuelve 404. No es un error que haya que mostrar en rojo.
    this.api.score(this.projectId).subscribe({
      next: (s) => this.score.set(s),
      error: () => this.score.set(null),
    });

    this.api.scoreHistory(this.projectId, 15).subscribe({
      next: (t) => this.trend.set(t.slice().reverse()),
      error: () => this.trend.set([]),
    });

    this.api.remediations(this.projectId, 20).subscribe({
      next: (g) => this.groups.set(g),
      error: (e) => this.error.set(this.describe(e)),
    });

    this.api.repositories(this.projectId).subscribe({
      next: (r) => this.repositories.set(r),
      error: () => this.repositories.set([]),
    });

    this.api.scans(this.projectId).subscribe({
      next: (s) => this.scans.set(s),
      error: () => this.scans.set([]),
    });
  }

  protected toggleGroup(group: RemediationGroup): void {
    if (this.expandedKey() === group.remediationKey) {
      this.expandedKey.set(null);
      this.expandedFindings.set([]);
      return;
    }
    this.expandedKey.set(group.remediationKey);
    this.expandedFindings.set([]);

    this.api.remediationFindings(this.projectId, group.remediationKey).subscribe({
      next: (f) => this.expandedFindings.set(f),
      error: (e) => this.error.set(this.describe(e)),
    });
  }

  protected requestScan(repositoryId: string): void {
    this.notice.set(null);
    this.error.set(null);

    this.api.requestScan(this.projectId, repositoryId).subscribe({
      next: (scan) => {
        this.scans.update((list) => [scan, ...list]);
        this.notice.set(
          'Scan encolado. El analisis tarda varios minutos; actualiza para ver el estado.',
        );
      },
      error: (e) => this.error.set(this.describe(e)),
    });
  }

  protected openReview(finding: Finding): void {
    this.reviewing.set(finding);
    this.reviewNote = '';
    this.reviewStatus = 'FALSE_POSITIVE';
  }

  protected closeReview(): void {
    this.reviewing.set(null);
  }

  protected submitReview(): void {
    const finding = this.reviewing();
    if (!finding) {
      return;
    }
    // El backend lo rechaza igualmente, pero avisar aqui evita un viaje y
    // explica el motivo en el momento.
    if (this.needsNote() && !this.reviewNote.trim()) {
      this.error.set('Descartar o aceptar un hallazgo requiere una nota justificativa');
      return;
    }

    this.api.updateFinding(finding.id, this.reviewStatus, this.reviewNote.trim() || undefined)
      .subscribe({
        next: (updated) => {
          this.expandedFindings.update((list) =>
            list.map((f) => (f.id === updated.id ? updated : f)),
          );
          this.reviewing.set(null);
          this.notice.set(
            'Hallazgo actualizado. El Security Score se recalculara en el proximo scan.',
          );
          // Los grupos se recargan porque un hallazgo descartado sale de la
          // vista de acciones activas.
          this.api.remediations(this.projectId, 20).subscribe({
            next: (g) => this.groups.set(g),
          });
        },
        error: (e) => this.error.set(this.describe(e)),
      });
  }

  protected needsNote(): boolean {
    return this.reviewStatus === 'FALSE_POSITIVE' || this.reviewStatus === 'ACCEPTED_RISK';
  }

  // ------------------------------------------------------------- presentacion

  protected severityClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-950 text-red-300 border-red-900';
      case 'HIGH':
        return 'bg-orange-950 text-orange-300 border-orange-900';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-300 border-amber-900';
      case 'LOW':
        return 'bg-sky-950 text-sky-300 border-sky-900';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  }

  /**
   * Color del score segun la nota.
   *
   * Las letras siguen la convencion de los informes de seguridad, no la
   * escolar: una C ya es un aviso.
   */
  protected gradeClass(grade: string | undefined): string {
    switch (grade) {
      case 'A':
        return 'text-emerald-400';
      case 'B':
        return 'text-lime-400';
      case 'C':
        return 'text-amber-400';
      case 'D':
        return 'text-orange-400';
      default:
        return 'text-red-400';
    }
  }

  /** Altura relativa de cada barra de la tendencia. */
  protected barHeight(point: ScoreTrendPoint): string {
    return `${Math.max(4, point.score)}%`;
  }

  protected statusClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'text-emerald-400';
      case 'FAILED':
        return 'text-red-400';
      case 'RUNNING':
        return 'text-sky-400';
      default:
        return 'text-slate-400';
    }
  }

  private describe(e: unknown): string {
    const err = e as { error?: { detail?: string }; status?: number };
    if (err.error?.detail) {
      return err.error.detail;
    }
    if (err.status === 403) {
      return 'No tienes permisos para esta operacion';
    }
    if (err.status === 404) {
      return 'No encontrado';
    }
    return 'No se pudo completar la operacion';
  }
}
