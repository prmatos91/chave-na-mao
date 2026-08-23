import { expect, test } from '@playwright/test';

test.describe('Oportunidades - fluxo completo e regra de negócio', () => {
  test('criar oportunidade como Vendido marca o veículo associado como Vendido automaticamente', async ({
    page,
  }) => {
    const sufixo = Date.now();
    const marcaVeiculo = `E2EOp${sufixo}`;
    const nomeCliente = `Cliente Op E2E ${sufixo}`;
    const emailCliente = `e2e-op-${sufixo}@example.com`;

    // 1. Cria um veiculo dedicado para nao afetar o status dos veiculos do seed.
    await page.goto('/veiculos/novo');
    await page.getByLabel('Marca').fill(marcaVeiculo);
    await page.getByLabel('Modelo').fill('Modelo Op E2E');
    await page.getByLabel('Ano').fill('2025');
    await page.getByLabel('Preço (R$)').fill('120000');
    await page.getByLabel('Cor').fill('Preto');
    await page.getByLabel('Quilometragem').fill('10');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Veículo cadastrado com sucesso.')).toBeVisible();

    // 2. Cria um cliente dedicado.
    await page.goto('/clientes/novo');
    await page.getByLabel('Nome').fill(nomeCliente);
    await page.getByLabel('E-mail').fill(emailCliente);
    await page.getByLabel('Telefone').fill('11911112222');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Cliente cadastrado com sucesso.')).toBeVisible();

    // 3. Cria a oportunidade ja como Vendido.
    await page.goto('/oportunidades/novo');
    await page.getByLabel('Cliente').click();
    await page.getByRole('option', { name: nomeCliente }).click();
    await page.getByLabel('Veículo').click();
    await page.getByRole('option', { name: new RegExp(marcaVeiculo) }).click();
    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Vendido', exact: true }).click();
    await page.getByLabel('Valor proposto (R$)').fill('118000');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Oportunidade cadastrada com sucesso.')).toBeVisible();

    // 4. Abre a oportunidade recem-criada e confirma status + timeline.
    // Filtra por cliente antes de procurar a linha: com a massa de dados do
    // seed (18+ oportunidades), o registro recem-criado pode nao estar na
    // primeira pagina da listagem sem paginacao/filtro.
    await page.goto('/oportunidades');
    await page.getByLabel('Cliente').click();
    await page.getByRole('option', { name: nomeCliente }).click();
    await page.getByRole('row').filter({ hasText: nomeCliente }).getByLabel('Visualizar').click();
    await expect(page).toHaveURL(/\/oportunidades\/\d+$/);
    await expect(page.getByText('Vendido', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Oportunidade criada como.*Vendido/)).toBeVisible();

    // 5. Confirma que o veiculo associado foi marcado como Vendido automaticamente.
    await page.goto('/veiculos');
    await page.getByLabel('Buscar por marca, modelo ou cor').fill(marcaVeiculo);
    await expect(page.getByRole('row').filter({ hasText: marcaVeiculo }).getByText('Vendido')).toBeVisible();

    // Limpeza: remove a oportunidade, o veiculo e o cliente criados neste teste.
    await page.goto('/oportunidades');
    await page.getByLabel('Cliente').click();
    await page.getByRole('option', { name: nomeCliente }).click();
    await page.getByRole('row').filter({ hasText: nomeCliente }).getByLabel('Excluir').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByText('Oportunidade excluída com sucesso.')).toBeVisible();

    await page.goto('/veiculos');
    await page.getByLabel('Buscar por marca, modelo ou cor').fill(marcaVeiculo);
    await expect(page.getByRole('row').filter({ hasText: marcaVeiculo })).toBeVisible();
    await page.getByRole('row').filter({ hasText: marcaVeiculo }).getByLabel('Excluir').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByText('Veículo excluído com sucesso.')).toBeVisible();

    await page.goto('/clientes');
    await page.getByLabel('Buscar por nome ou e-mail').fill(emailCliente);
    await expect(page.getByRole('row').filter({ hasText: emailCliente })).toBeVisible();
    await page.getByRole('row').filter({ hasText: emailCliente }).getByLabel('Excluir').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByText('Cliente excluído com sucesso.')).toBeVisible();
  });
});
