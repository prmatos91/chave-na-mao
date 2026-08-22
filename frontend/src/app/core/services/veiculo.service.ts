import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../models/page.model';
import { StatusVeiculo, Veiculo, VeiculoRequest } from '../models/veiculo.model';
import { RuntimeConfigService } from './runtime-config.service';

export interface VeiculoFiltro {
  status?: StatusVeiculo | '';
  q?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class VeiculoService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigService);

  private get baseUrl(): string {
    return `${this.config.apiUrl}/api/veiculos`;
  }

  listar(filtro: VeiculoFiltro): Observable<Page<Veiculo>> {
    let params = new HttpParams()
      .set('page', filtro.page ?? 0)
      .set('size', filtro.size ?? 10);
    if (filtro.status) params = params.set('status', filtro.status);
    if (filtro.q) params = params.set('q', filtro.q);
    return this.http.get<Page<Veiculo>>(this.baseUrl, { params });
  }

  buscarPorId(id: number): Observable<Veiculo> {
    return this.http.get<Veiculo>(`${this.baseUrl}/${id}`);
  }

  criar(request: VeiculoRequest): Observable<Veiculo> {
    return this.http.post<Veiculo>(this.baseUrl, request);
  }

  atualizar(id: number, request: VeiculoRequest): Observable<Veiculo> {
    return this.http.put<Veiculo>(`${this.baseUrl}/${id}`, request);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  listarMarcas(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/marcas`);
  }

  listarModelosPorMarca(marca: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/modelos`, { params: { marca } });
  }

  listarCores(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/cores`);
  }
}
