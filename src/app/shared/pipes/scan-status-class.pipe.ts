import { Pipe, PipeTransform } from '@angular/core';
import { ScanStatus } from '../../core/api/api.models';

@Pipe({ name: 'scanStatusClass' })
export class ScanStatusClassPipe implements PipeTransform {
  transform(status: ScanStatus): string {
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
}
