import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConnectRepositoryRequest, Project, Repository } from './api.models';

@Injectable({ providedIn: 'root' })
export class ProjectsApi {
  private readonly http = inject(HttpClient);

  list(): Observable<Project[]> {
    return this.http.get<Project[]>('/api/projects');
  }

  get(id: string): Observable<Project> {
    return this.http.get<Project>(`/api/projects/${id}`);
  }

  create(name: string, description?: string): Observable<Project> {
    return this.http.post<Project>('/api/projects', { name, description });
  }

  repositories(projectId: string): Observable<Repository[]> {
    return this.http.get<Repository[]>(`/api/projects/${projectId}/repositories`);
  }

  connectRepository(projectId: string, body: ConnectRepositoryRequest): Observable<Repository> {
    // authorizationConfirmed lo exige el backend con @AssertTrue: es la
    // constancia de que el usuario declara tener derecho a escanear.
    return this.http.post<Repository>(`/api/projects/${projectId}/repositories`, {
      ...body,
      authorizationConfirmed: true,
    });
  }
}
