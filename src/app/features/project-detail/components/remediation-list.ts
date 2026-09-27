import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { Finding, RemediationGroup } from '../../../core/api/api.models';
import { FindingsApi } from '../../../core/api/findings.api';
import { AuthService } from '../../../core/auth/auth.service';
import { describeHttpError } from '../../../core/http/http-error';
import { SeverityBadge } from '../../../shared/ui/severity-badge';
import { FindingLocationPipe } from './finding-location.pipe';
import { FindingReviewDialog } from './finding-review-dialog';

type FindingsState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'dg-remediation-list',
  imports: [SeverityBadge, FindingReviewDialog, FindingLocationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './remediation-list.html',
  host: { class: 'block' },
})
export class RemediationList {
  private readonly findingsApi = inject(FindingsApi);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  readonly projectId = input.required<string>();
  readonly groups = input.required<RemediationGroup[]>();

  /** Un hallazgo cambio de estado: la pagina recarga la cola de acciones. */
  readonly findingUpdated = output<Finding>();

  /** Grupo desplegado y sus hallazgos concretos. */
  protected readonly expandedKey = signal<string | null>(null);
  protected readonly findings = signal<Finding[]>([]);
  protected readonly findingsState = signal<FindingsState>('loading');
  protected readonly findingsError = signal<string | null>(null);

  protected readonly reviewing = signal<Finding | null>(null);

  private findingsRequest?: Subscription;

  protected toggle(group: RemediationGroup): void {
    // Cancelar la peticion anterior evita que la respuesta de un grupo que ya
    // se cerro llegue tarde y pise los hallazgos del grupo abierto.
    this.findingsRequest?.unsubscribe();
    this.findings.set([]);

    if (this.expandedKey() === group.remediationKey) {
      this.expandedKey.set(null);
      return;
    }

    this.expandedKey.set(group.remediationKey);
    this.findingsState.set('loading');
    this.findingsError.set(null);

    this.findingsRequest = this.findingsApi
      .remediationFindings(this.projectId(), group.remediationKey)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (findings) => {
          this.findings.set(findings);
          this.findingsState.set('loaded');
        },
        error: (e) => {
          this.findingsError.set(describeHttpError(e));
          this.findingsState.set('error');
        },
      });
  }

  protected onReviewSaved(updated: Finding): void {
    this.findings.update((list) => list.map((f) => (f.id === updated.id ? updated : f)));
    this.reviewing.set(null);
    this.findingUpdated.emit(updated);
  }
}
