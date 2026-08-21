import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'veiculos',
    loadComponent: () =>
      import('./features/veiculos/veiculo-list/veiculo-list').then((m) => m.VeiculoList),
  },
  {
    path: 'veiculos/novo',
    loadComponent: () =>
      import('./features/veiculos/veiculo-form/veiculo-form').then((m) => m.VeiculoForm),
  },
  {
    path: 'veiculos/:id/editar',
    loadComponent: () =>
      import('./features/veiculos/veiculo-form/veiculo-form').then((m) => m.VeiculoForm),
  },
  {
    path: 'veiculos/:id',
    loadComponent: () =>
      import('./features/veiculos/veiculo-detail/veiculo-detail').then((m) => m.VeiculoDetail),
  },
  {
    path: 'clientes',
    loadComponent: () =>
      import('./features/clientes/cliente-list/cliente-list').then((m) => m.ClienteList),
  },
  {
    path: 'clientes/novo',
    loadComponent: () =>
      import('./features/clientes/cliente-form/cliente-form').then((m) => m.ClienteForm),
  },
  {
    path: 'clientes/:id/editar',
    loadComponent: () =>
      import('./features/clientes/cliente-form/cliente-form').then((m) => m.ClienteForm),
  },
  {
    path: 'clientes/:id',
    loadComponent: () =>
      import('./features/clientes/cliente-detail/cliente-detail').then((m) => m.ClienteDetail),
  },
  {
    path: 'oportunidades',
    loadComponent: () =>
      import('./features/oportunidades/oportunidade-list/oportunidade-list').then(
        (m) => m.OportunidadeList
      ),
  },
  {
    path: 'oportunidades/novo',
    loadComponent: () =>
      import('./features/oportunidades/oportunidade-form/oportunidade-form').then(
        (m) => m.OportunidadeForm
      ),
  },
  {
    path: 'oportunidades/:id/editar',
    loadComponent: () =>
      import('./features/oportunidades/oportunidade-form/oportunidade-form').then(
        (m) => m.OportunidadeForm
      ),
  },
  {
    path: 'oportunidades/:id',
    loadComponent: () =>
      import('./features/oportunidades/oportunidade-detail/oportunidade-detail').then(
        (m) => m.OportunidadeDetail
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
];
