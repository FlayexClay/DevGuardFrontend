import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ScoreTrendPoint } from '../../../core/api/api.models';

@Component({
  selector: 'dg-score-trend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'dg-card block p-6' },
  template: `
    <h2 class="text-sm font-medium text-slate-400">Tendencia</h2>
    @if (points().length > 1) {
      <div class="mt-6 flex h-32 items-end gap-1" role="img" [attr.aria-label]="summary()">
        @for (point of points(); track point.calculatedAt) {
          <div
            class="flex-1 rounded-t bg-sky-800 transition hover:bg-sky-600"
            [style.height.%]="barHeight(point.score)"
            [title]="point.score + ' (' + point.grade + ')'"
          ></div>
        }
      </div>
      <p class="mt-3 text-xs text-slate-500">
        {{ points().length }} mediciones. Es posible porque los scores se guardan como serie
        histórica y no como un valor que se sobrescribe.
      </p>
    } @else {
      <p class="mt-4 text-sm text-slate-500">
        Hacen falta al menos dos scans para ver una tendencia.
      </p>
    }
  `,
})
export class ScoreTrend {
  /** Puntos en orden cronologico, del mas antiguo al mas reciente. */
  readonly points = input.required<ScoreTrendPoint[]>();

  protected readonly summary = computed(() => {
    const scores = this.points().map((p) => p.score);
    return `Evolución del score en ${scores.length} mediciones: ${scores.join(', ')}`;
  });

  /** Altura minima para que un score de 0 siga viendose como barra. */
  protected barHeight(score: number): number {
    return Math.max(4, score);
  }
}
