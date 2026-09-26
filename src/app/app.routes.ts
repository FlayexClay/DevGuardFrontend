import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'projects',
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    // Carga diferida: el dashboard de un proyecto no hace falta hasta que se
    // entra en uno.
    loadComponent: () =>
      import('./pages/projects/projects').then((m) => m.ProjectsPage),
  },
  {
    path: 'projects/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/project-detail/project-detail').then((m) => m.ProjectDetailPage),
  },
  {
    path: '**',
    redirectTo: 'projects',
  },
];
