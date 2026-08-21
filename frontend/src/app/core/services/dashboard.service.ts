import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardResponse } from '../models/dashboard.model';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(RuntimeConfigService);

  buscar(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.config.apiUrl}/api/dashboard`);
  }
}
