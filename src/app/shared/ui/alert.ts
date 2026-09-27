import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AlertKind = 'error' | 'info' | 'warning';

const KIND_CLASSES: Record<AlertKind, string> = {
  error: 'border-red-900 bg-red-950/40 text-red-200',
  info: 'border-sky-900 bg-sky-950/40 text-sky-200',
  warning: 'border-amber-900 bg-amber-950/40 text-amber-200',
};

@Component({
  selector: 'dg-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block rounded border px-4 py-3 text-sm',
    '[class]': 'kindClass()',
    '[attr.role]': "kind() === 'error' ? 'alert' : 'status'",
  },
  template: `<ng-content />`,
})
export class Alert {
  readonly kind = input<AlertKind>('info');

  protected readonly kindClass = computed(() => KIND_CLASSES[this.kind()]);
}
