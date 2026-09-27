import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DECISIONS_REQUIRING_NOTE, Finding, ReviewDecision } from '../../../core/api/api.models';
import { FindingsApi } from '../../../core/api/findings.api';
import { describeHttpError } from '../../../core/http/http-error';
import { Alert } from '../../../shared/ui/alert';

/**
 * Dialogo para descartar, aceptar o confirmar un hallazgo.
 *
 * Usa <dialog> nativo con showModal(): el navegador ya se encarga de atrapar
 * el foco, de cerrar con Escape y de marcar el resto de la pagina como inerte.
 */
@Component({
  selector: 'dg-finding-review-dialog',
  imports: [FormsModule, Alert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      aria-labelledby="review-title"
      class="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-6 text-slate-100
             backdrop:bg-black/70"
      (cancel)="$event.preventDefault(); closed.emit()"
    >
      <form (ngSubmit)="submit()">
        <h3 id="review-title" class="text-lg font-semibold">Revisar hallazgo</h3>
        <p class="mt-1 text-sm text-slate-400">{{ finding().title }}</p>
        <p class="mt-1 font-mono text-xs text-slate-600">{{ finding().filePath }}</p>

        <label class="mt-5 block text-sm text-slate-300">
          Decisión
          <select name="decision" class="dg-input mt-1" [(ngModel)]="decision">
            <option value="FALSE_POSITIVE">Falso positivo</option>
            <option value="ACCEPTED_RISK">Riesgo aceptado</option>
            <option value="CONFIRMED">Confirmado</option>
          </select>
        </label>

        <label class="mt-4 block text-sm text-slate-300">
          Justificación
          @if (needsNote()) {
            <span class="text-red-400" aria-hidden="true">*</span>
          }
          <textarea
            name="note"
            rows="3"
            class="dg-input mt-1"
            placeholder="Por qué se descarta o acepta este hallazgo"
            [required]="needsNote()"
            [(ngModel)]="note"
          ></textarea>
        </label>

        <!--
          La nota es obligatoria para descartar, y el motivo no es burocratico:
          un falso positivo sin justificacion es indistinguible de alguien
          silenciando un problema para limpiar el tablero.
        -->
        @if (needsNote()) {
          <p class="mt-2 text-xs text-slate-500">
            Queda registrada con tu usuario. Es lo que permite después distinguir un descarte
            deliberado de un problema ignorado.
          </p>
        }

        @if (error(); as message) {
          <dg-alert kind="error" class="mt-4">{{ message }}</dg-alert>
        }

        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="dg-btn-secondary" (click)="closed.emit()">Cancelar</button>
          <button type="submit" class="dg-btn-primary" [disabled]="saving()">
            {{ saving() ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </form>
    </dialog>
  `,
})
export class FindingReviewDialog {
  private readonly findingsApi = inject(FindingsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly finding = input.required<Finding>();

  readonly saved = output<Finding>();
  readonly closed = output<void>();

  protected readonly decision = signal<ReviewDecision>('FALSE_POSITIVE');
  protected readonly note = signal('');
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly needsNote = computed(() => DECISIONS_REQUIRING_NOTE.includes(this.decision()));

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }

  protected submit(): void {
    if (this.saving()) {
      return;
    }
    const note = this.note().trim();

    // El backend lo rechaza igualmente, pero avisar aqui evita un viaje y
    // explica el motivo en el momento.
    if (this.needsNote() && !note) {
      this.error.set('Descartar o aceptar un hallazgo requiere una nota justificativa');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.findingsApi
      .updateStatus(this.finding().id, this.decision(), note || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => this.saved.emit(updated),
        error: (e) => {
          this.error.set(describeHttpError(e));
          this.saving.set(false);
        },
      });
  }
}
