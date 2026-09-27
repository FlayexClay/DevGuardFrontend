import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

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
    loadComponent: () => import('./features/projects/projects.page').then((m) => m.ProjectsPage),
  },
  {
    path: 'projects/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/project-detail/project-detail.page').then((m) => m.ProjectDetailPage),
  },
  {
    path: '**',
    redirectTo: 'projects',
  },
];
