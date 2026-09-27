import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Scan, ScoreTrendPoint, SecurityScore } from './api.models';

@Injectable({ providedIn: 'root' })
export class ScansApi {
  private readonly http = inject(HttpClient);

  list(projectId: string): Observable<Scan[]> {
    return this.http.get<Scan[]>(`/api/projects/${projectId}/scans`);
  }

  get(id: string): Observable<Scan> {
    return this.http.get<Scan>(`/api/scans/${id}`);
  }

  request(projectId: string, repositoryId: string, branch?: string): Observable<Scan> {
    return this.http.post<Scan>(`/api/projects/${projectId}/scans`, { repositoryId, branch });
  }

  score(projectId: string): Observable<SecurityScore> {
    return this.http.get<SecurityScore>(`/api/projects/${projectId}/security-score`);
  }

  scoreHistory(projectId: string, limit = 30): Observable<ScoreTrendPoint[]> {
    return this.http.get<ScoreTrendPoint[]>(`/api/projects/${projectId}/security-score/history`, {
      params: new HttpParams().set('limit', limit),
    });
  }
}
