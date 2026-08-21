import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente, ClienteRequest, InteressePrincipal } from '../models/cliente.model';
import { Page } from '../models/page.model';
import { RuntimeConfigService } from './runtime-config.service';

export interface ClienteFiltro {
  interesse?: InteressePrincipal | '';
  q?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigService);

  private get baseUrl(): string {
    return `${this.config.apiUrl}/api/clientes`;
  }

  listar(filtro: ClienteFiltro): Observable<Page<Cliente>> {
    let params = new HttpParams()
      .set('page', filtro.page ?? 0)
      .set('size', filtro.size ?? 10);
    if (filtro.interesse) params = params.set('interesse', filtro.interesse);
    if (filtro.q) params = params.set('q', filtro.q);
    return this.http.get<Page<Cliente>>(this.baseUrl, { params });
  }

  buscarPorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/${id}`);
  }

  criar(request: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.baseUrl, request);
  }

  atualizar(id: number, request: ClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.baseUrl}/${id}`, request);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
