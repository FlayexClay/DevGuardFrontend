import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Finding,
  FindingFilters,
  FindingPage,
  FindingStatus,
  RemediationGroup,
} from './api.models';

@Injectable({ providedIn: 'root' })
export class FindingsApi {
  private readonly http = inject(HttpClient);

  /** Cola de trabajo: acciones ordenadas por impacto. */
  remediations(projectId: string, limit = 20): Observable<RemediationGroup[]> {
    return this.http.get<RemediationGroup[]>(`/api/projects/${projectId}/remediations`, {
      params: new HttpParams().set('limit', limit),
    });
  }

  remediationFindings(projectId: string, remediationKey: string): Observable<Finding[]> {
    return this.http.get<Finding[]>(
      `/api/projects/${projectId}/remediation-findings`,
      { params: new HttpParams().set('key', remediationKey) },
    );
  }

  list(
    projectId: string,
    filters: FindingFilters = {},
    page = 0,
    size = 50,
  ): Observable<FindingPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filters.severity) params = params.set('severity', filters.severity);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.status) params = params.set('status', filters.status);

    return this.http.get<FindingPage>(`/api/projects/${projectId}/findings`, { params });
  }

  /**
   * Cambia el estado de un hallazgo.
   *
   * La nota es obligatoria para FALSE_POSITIVE y ACCEPTED_RISK, y el backend
   * lo rechaza con 400 si falta.
   */
  updateStatus(id: string, status: FindingStatus, note?: string): Observable<Finding> {
    return this.http.patch<Finding>(`/api/findings/${id}`, { status, note });
  }
}
