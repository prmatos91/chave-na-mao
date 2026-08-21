import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Page } from '../models/page.model';
import { Veiculo } from '../models/veiculo.model';
import { VeiculoService } from './veiculo.service';

describe('VeiculoService', () => {
  let service: VeiculoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(VeiculoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve montar a URL e os query params corretos ao listar com filtro de status e busca', () => {
    const pageMock: Page<Veiculo> = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
      first: true,
      last: true,
    };

    service.listar({ status: 'DISPONIVEL', q: 'corolla', page: 0, size: 10 }).subscribe((page) => {
      expect(page).toEqual(pageMock);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === 'http://localhost:8080/api/veiculos' &&
        r.params.get('status') === 'DISPONIVEL' &&
        r.params.get('q') === 'corolla'
    );
    expect(req.request.method).toBe('GET');
    req.flush(pageMock);
  });

  it('deve enviar POST para /api/veiculos ao criar um veiculo', () => {
    const novoVeiculo = {
      marca: 'Honda',
      modelo: 'HR-V',
      ano: 2024,
      preco: 168500,
      cor: 'Branco',
      quilometragem: 5000,
      status: 'DISPONIVEL' as const,
    };

    service.criar(novoVeiculo).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/veiculos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(novoVeiculo);
    req.flush({ id: 1, ...novoVeiculo, createdAt: '', updatedAt: '' });
  });

  it('deve enviar DELETE para /api/veiculos/:id ao excluir', () => {
    service.excluir(42).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/veiculos/42');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
