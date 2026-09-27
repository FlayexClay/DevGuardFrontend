import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SecurityScore } from '../../../core/api/api.models';
import { GradeClassPipe } from '../../../shared/pipes/grade-class.pipe';

@Component({
  selector: 'dg-score-card',
  imports: [KeyValuePipe, GradeClassPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'dg-card block p-6 lg:p-8' },
  template: `
    <h2 class="dg-card-title">Security Score</h2>

    @if (score(); as s) {
      <div class="mt-6 flex items-end gap-3">
        <span class="text-6xl font-bold" [class]="s.grade | gradeClass">{{ s.score }}</span>
        <span class="text-2xl font-semibold text-slate-500">/ 100</span>
        <span
          class="mb-1.5 rounded-md border border-slate-700 px-2.5 py-0.5 text-base"
          [class]="s.grade | gradeClass"
        >
          {{ s.grade }}
        </span>
      </div>

      @if (s.delta !== null) {
        <p class="mt-3 text-sm" [class]="deltaClass()">
          {{ s.delta > 0 ? '+' : '' }}{{ s.delta }} respecto al scan anterior
        </p>
      }

      <dl class="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <div class="flex justify-between">
          <dt class="text-slate-500">Critical</dt>
          <dd class="font-medium text-red-400">{{ s.counts.critical }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">High</dt>
          <dd class="font-medium text-orange-400">{{ s.counts.high }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">Medium</dt>
          <dd class="font-medium text-amber-400">{{ s.counts.medium }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">Low</dt>
          <dd class="font-medium text-sky-400">{{ s.counts.low }}</dd>
        </div>
      </dl>

      <!--
        El desglose es visible a proposito: el documento de diseño exige que
        el score sea explicable y no una cifra arbitraria. Sin esto, el
        producto responde "48" y no puede justificarlo.
      -->
      <details class="mt-6">
        <summary class="cursor-pointer text-sm text-slate-500 hover:text-slate-300">
          Cómo se calcula
        </summary>
        <dl class="mt-3 space-y-1.5 text-sm text-slate-400">
          @for (entry of s.breakdown | keyvalue; track entry.key) {
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">{{ entry.key }}</dt>
              <dd class="text-right font-mono">{{ entry.value }}</dd>
            </div>
          }
        </dl>
      </details>
    } @else {
      <p class="mt-6 text-sm text-slate-500">
        Sin puntuación todavía. Lanza un scan para calcularla.
      </p>
    }
  `,
})
export class ScoreCard {
  readonly score = input<SecurityScore | null>(null);

  protected readonly deltaClass = computed(() => {
    const delta = this.score()?.delta ?? 0;
    if (delta > 0) return 'text-emerald-400';
    if (delta < 0) return 'text-red-400';
    return 'text-slate-500';
  });
}
