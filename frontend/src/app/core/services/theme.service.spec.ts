import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
    });
    document.documentElement.classList.remove('dark-theme');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.classList.remove('dark-theme');
  });

  it('respeita a preferencia salva no localStorage na inicializacao (escuro)', () => {
    mockStorage['crm-carros-theme'] = 'dark';

    const service = TestBed.inject(ThemeService);

    expect(service.dark()).toBe(true);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
  });

  it('respeita a preferencia salva no localStorage na inicializacao (claro)', () => {
    mockStorage['crm-carros-theme'] = 'light';

    const service = TestBed.inject(ThemeService);

    expect(service.dark()).toBe(false);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });

  it('toggle() alterna o signal e a classe dark-theme no <html>, e persiste a escolha', () => {
    mockStorage['crm-carros-theme'] = 'light';
    const service = TestBed.inject(ThemeService);
    expect(service.dark()).toBe(false);

    service.toggle();

    expect(service.dark()).toBe(true);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
    expect(mockStorage['crm-carros-theme']).toBe('dark');

    service.toggle();

    expect(service.dark()).toBe(false);
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
    expect(mockStorage['crm-carros-theme']).toBe('light');
  });
});
