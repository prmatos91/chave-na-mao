import { describe, expect, it } from 'vitest';
import { paginatorIntlPtBrFactory } from './paginator-intl-pt-br';

describe('paginatorIntlPtBrFactory', () => {
  it('define os textos padrao do paginador em portugues', () => {
    const intl = paginatorIntlPtBrFactory();

    expect(intl.itemsPerPageLabel).toBe('Itens por página:');
    expect(intl.nextPageLabel).toBe('Próxima página');
    expect(intl.previousPageLabel).toBe('Página anterior');
    expect(intl.firstPageLabel).toBe('Primeira página');
    expect(intl.lastPageLabel).toBe('Última página');
  });

  it('formata o intervalo de itens exibidos corretamente', () => {
    const intl = paginatorIntlPtBrFactory();

    expect(intl.getRangeLabel(0, 10, 8)).toBe('1 – 8 de 8');
    expect(intl.getRangeLabel(1, 10, 25)).toBe('11 – 20 de 25');
    expect(intl.getRangeLabel(2, 10, 25)).toBe('21 – 25 de 25');
  });

  it('trata lista vazia sem gerar intervalo invalido', () => {
    const intl = paginatorIntlPtBrFactory();

    expect(intl.getRangeLabel(0, 10, 0)).toBe('0 de 0');
  });
});
