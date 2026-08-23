import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DashboardResponse } from '../../core/models/dashboard.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  const mockResponse: DashboardResponse = {
    totalVeiculos: 8,
    totalClientes: 6,
    totalOportunidades: 6,
    veiculosPorStatus: { DISPONIVEL: 5, RESERVADO: 2, VENDIDO: 1 },
    oportunidadesPorStatus: {
      NOVO_LEAD: 2,
      EM_NEGOCIACAO: 1,
      PROPOSTA_ENVIADA: 1,
      VENDIDO: 1,
      PERDIDO: 1,
    },
  };

  it('deve carregar os dados do dashboard ao iniciar e expor via signal', async () => {
    const dashboardServiceStub = { buscar: () => of(mockResponse) };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), { provide: DashboardService, useValue: dashboardServiceStub }],
    }).compileComponents();

    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component['loading']()).toBe(false);
    expect(component['data']()?.totalVeiculos).toBe(8);
    expect(component['data']()?.totalClientes).toBe(6);
  });

  it('deve exibir o total de veiculos renderizado no template', async () => {
    const dashboardServiceStub = { buscar: () => of(mockResponse) };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), { provide: DashboardService, useValue: dashboardServiceStub }],
    }).compileComponents();

    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('8');
  });
});
