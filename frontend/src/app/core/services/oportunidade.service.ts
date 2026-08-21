import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Oportunidade, OportunidadeRequest, StatusOportunidade } from '../models/oportunidade.model';
import { Page } from '../models/page.model';
import { RuntimeConfigService } from './runtime-config.service';

export interface OportunidadeFiltro {
  status?: StatusOportunidade | '';
  clienteId?: number | null;
  veiculoId?: number | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class OportunidadeService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigService);

  private get baseUrl(): string {
    return `${this.config.apiUrl}/api/oportunidades`;
  }

  listar(filtro: OportunidadeFiltro): Observable<Page<Oportunidade>> {
    let params = new HttpParams()
      .set('page', filtro.page ?? 0)
      .set('size', filtro.size ?? 10);
    if (filtro.status) params = params.set('status', filtro.status);
    if (filtro.clienteId) params = params.set('clienteId', filtro.clienteId);
    if (filtro.veiculoId) params = params.set('veiculoId', filtro.veiculoId);
    return this.http.get<Page<Oportunidade>>(this.baseUrl, { params });
  }

  buscarPorId(id: number): Observable<Oportunidade> {
    return this.http.get<Oportunidade>(`${this.baseUrl}/${id}`);
  }

  criar(request: OportunidadeRequest): Observable<Oportunidade> {
    return this.http.post<Oportunidade>(this.baseUrl, request);
  }

  atualizar(id: number, request: OportunidadeRequest): Observable<Oportunidade> {
    return this.http.put<Oportunidade>(`${this.baseUrl}/${id}`, request);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
