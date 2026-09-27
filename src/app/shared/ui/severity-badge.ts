import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Severity } from '../../core/api/api.models';

const SEVERITY_CLASSES: Record<Severity, string> = {
  CRITICAL: 'bg-red-950 text-red-300 border-red-900',
  HIGH: 'bg-orange-950 text-orange-300 border-orange-900',
  MEDIUM: 'bg-amber-950 text-amber-300 border-amber-900',
  LOW: 'bg-sky-950 text-sky-300 border-sky-900',
  INFO: 'bg-slate-800 text-slate-400 border-slate-700',
};

@Component({
  selector: 'dg-severity-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-block shrink-0 rounded border font-medium',
    '[class]': 'classes()',
  },
  template: `{{ severity() }}`,
})
export class SeverityBadge {
  readonly severity = input.required<Severity>();
  readonly size = input<'sm' | 'xs'>('sm');

  protected readonly classes = computed(() => {
    const color = SEVERITY_CLASSES[this.severity()] ?? SEVERITY_CLASSES.INFO;
    const size = this.size() === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-0.5 text-[10px]';
    return `${color} ${size}`;
  });
}
