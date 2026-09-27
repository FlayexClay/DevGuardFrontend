import { Pipe, PipeTransform } from '@angular/core';

/**
 * Color del score segun la nota.
 *
 * Las letras siguen la convencion de los informes de seguridad, no la
 * escolar: una C ya es un aviso.
 */
@Pipe({ name: 'gradeClass' })
export class GradeClassPipe implements PipeTransform {
  transform(grade: string | null | undefined): string {
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
}
