import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Scan } from '../../../core/api/api.models';
import { ScanStatusClassPipe } from '../../../shared/pipes/scan-status-class.pipe';

const MAX_ROWS = 8;

@Component({
  selector: 'dg-scan-history',
  imports: [DatePipe, DecimalPipe, ScanStatusClassPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h2 class="text-xl font-semibold">Últimos scans</h2>
    <div class="mt-6 overflow-x-auto rounded-xl border border-slate-800">
      <table class="w-full text-sm">
        <thead class="bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" class="px-5 py-3 font-medium">Estado</th>
            <th scope="col" class="px-5 py-3 font-medium">Commit</th>
            <th scope="col" class="px-5 py-3 font-medium">Duración</th>
            <th scope="col" class="px-5 py-3 font-medium">Solicitado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
          @for (scan of recent(); track scan.id) {
            <tr class="bg-slate-900/20">
              <td class="px-5 py-3.5">
                <span [class]="scan.status | scanStatusClass">{{ scan.status }}</span>
                @if (scan.errorCode) {
                  <span class="ml-2 text-xs text-amber-500">{{ scan.errorCode }}</span>
                }
              </td>
              <td class="px-5 py-3.5 font-mono text-sm text-slate-400">
                {{ scan.commitSha ? scan.commitSha.slice(0, 8) : '—' }}
              </td>
              <td class="px-5 py-3.5 text-sm text-slate-400">
                {{ scan.durationMs ? (scan.durationMs / 1000 | number: '1.0-0') + ' s' : '—' }}
              </td>
              <td class="px-5 py-3.5 text-sm text-slate-500">
                {{ scan.requestedAt | date: 'short' }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class ScanHistory {
  readonly scans = input.required<Scan[]>();

  protected readonly recent = computed(() => this.scans().slice(0, MAX_ROWS));
}
