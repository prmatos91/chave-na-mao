import { Injectable } from '@angular/core';

declare global {
  interface Window {
    __env?: {
      apiUrl?: string;
    };
  }
}

/**
 * Le a URL da API a partir de window.__env, injetada em tempo de execucao
 * pelo entrypoint do container Nginx (ver frontend/docker/env.template.js).
 * Em desenvolvimento local (ng serve), window.__env nao existe e cai no fallback.
 */
@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  get apiUrl(): string {
    return window.__env?.apiUrl || 'http://localhost:8080';
  }
}
