import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Finding,
  FindingPage,
  Project,
  RemediationGroup,
  Repository,
  Scan,
  ScoreTrendPoint,
  SecurityScore,
} from './api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // ------------------------------------------------------------- proyectos
  projects(): Observable<Project[]> {
    return this.http.get<Project[]>('/api/projects');
  }

  project(id: string): Observable<Project> {
    return this.http.get<Project>(`/api/projects/${id}`);
  }

  createProject(name: string, description?: string): Observable<Project> {
    return this.http.post<Project>('/api/projects', { name, description });
  }

  // ---------------------------------------------------------- repositorios
  repositories(projectId: string): Observable<Repository[]> {
    return this.http.get<Repository[]>(`/api/projects/${projectId}/repositories`);
  }

  connectRepository(
    projectId: string,
    body: {
      provider: string;
      fullName: string;
      cloneUrl: string;
      defaultBranch?: string;
      visibility?: string;
    },
  ): Observable<Repository> {
    // authorizationConfirmed lo exige el backend con @AssertTrue: es la
    // constancia de que el usuario declara tener derecho a escanear.
    return this.http.post<Repository>(`/api/projects/${projectId}/repositories`, {
      ...body,
      authorizationConfirmed: true,
    });
  }

  // ----------------------------------------------------------------- scans
  scans(projectId: string): Observable<Scan[]> {
    return this.http.get<Scan[]>(`/api/projects/${projectId}/scans`);
  }

  scan(id: string): Observable<Scan> {
    return this.http.get<Scan>(`/api/scans/${id}`);
  }

  requestScan(projectId: string, repositoryId: string, branch?: string): Observable<Scan> {
    return this.http.post<Scan>(`/api/projects/${projectId}/scans`, {
      repositoryId,
      branch,
    });
  }

  // ----------------------------------------------------------------- score
  score(projectId: string): Observable<SecurityScore> {
    return this.http.get<SecurityScore>(`/api/projects/${projectId}/security-score`);
  }

  scoreHistory(projectId: string, limit = 30): Observable<ScoreTrendPoint[]> {
    return this.http.get<ScoreTrendPoint[]>(
      `/api/projects/${projectId}/security-score/history`,
      { params: new HttpParams().set('limit', limit) },
    );
  }

  // ------------------------------------------------------------- hallazgos
  /** Cola de trabajo: acciones ordenadas por impacto. */
  remediations(projectId: string, limit = 20): Observable<RemediationGroup[]> {
    return this.http.get<RemediationGroup[]>(`/api/projects/${projectId}/remediations`, {
      params: new HttpParams().set('limit', limit),
    });
  }

  remediationFindings(projectId: string, remediationKey: string): Observable<Finding[]> {
    return this.http.get<Finding[]>(
      `/api/projects/${projectId}/remediations/${encodeURIComponent(remediationKey)}/findings`,
    );
  }

  findings(
    projectId: string,
    filters: { severity?: string; category?: string; status?: string } = {},
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
   * lo rechaza con 400 si falta. No es burocracia: un descarte sin
   * justificacion es indistinguible de alguien silenciando un problema.
   */
  updateFinding(id: string, status: string, note?: string): Observable<Finding> {
    return this.http.patch<Finding>(`/api/findings/${id}`, { status, note });
  }
}
