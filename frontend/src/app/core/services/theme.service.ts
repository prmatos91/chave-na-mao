import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'crm-carros-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly dark = signal<boolean>(this.temaInicialEscuro());

  constructor() {
    this.aplicar(this.dark());
  }

  toggle(): void {
    const novoValor = !this.dark();
    this.dark.set(novoValor);
    this.aplicar(novoValor);
    this.armazenar(novoValor);
  }

  private temaInicialEscuro(): boolean {
    const salvo = this.lerArmazenado();
    if (salvo) {
      return salvo === 'dark';
    }
    return typeof window !== 'undefined' && !!window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  }

  private aplicar(escuro: boolean): void {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark-theme', escuro);
    }
  }

  private lerArmazenado(): string | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    } catch {
      return null;
    }
  }

  private armazenar(escuro: boolean): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, escuro ? 'dark' : 'light');
      }
    } catch {
      // Armazenamento indisponivel (ex.: modo privado) - preferencia so vale para a sessao atual.
    }
  }
}
