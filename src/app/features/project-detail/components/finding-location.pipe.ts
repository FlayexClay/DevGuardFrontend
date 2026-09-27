import { Pipe, PipeTransform } from '@angular/core';
import { Finding } from '../../../core/api/api.models';

/** "ruta:linea · CVE · CWE", omitiendo lo que el hallazgo no trae. */
@Pipe({ name: 'findingLocation' })
export class FindingLocationPipe implements PipeTransform {
  transform(finding: Finding): string {
    const path = finding.lineStart
      ? `${finding.filePath ?? ''}:${finding.lineStart}`
      : finding.filePath;
    return [path, finding.cve, finding.cwe].filter(Boolean).join(' · ');
  }
}
