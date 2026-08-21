import { expect, test } from '@playwright/test';

test.describe('Veículos - fluxo completo', () => {
  test('cria, visualiza, edita e exclui um veículo', async ({ page }) => {
    const marca = `E2E${Date.now()}`;

    await page.goto('/veiculos');
    await page.getByRole('button', { name: 'Novo veículo' }).click();
    await expect(page).toHaveURL(/\/veiculos\/novo$/);

    await page.getByLabel('Marca').fill(marca);
    await page.getByLabel('Modelo').fill('Modelo Teste E2E');
    await page.getByLabel('Ano').fill('2025');
    await page.getByLabel('Preço (R$)').fill('99999');
    await page.getByLabel('Cor').fill('Azul');
    await page.getByLabel('Quilometragem').fill('100');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page).toHaveURL(/\/veiculos$/);
    await expect(page.getByText('Veículo cadastrado com sucesso.')).toBeVisible();

    await page.getByLabel('Buscar por marca, modelo ou cor').fill(marca);
    const linha = page.getByRole('row').filter({ hasText: marca });
    await expect(linha).toBeVisible();

    await linha.getByLabel('Visualizar').click();
    await expect(page).toHaveURL(/\/veiculos\/\d+$/);
    await expect(page.getByRole('heading', { name: `${marca} Modelo Teste E2E` })).toBeVisible();
    await expect(page.getByText('Disponível')).toBeVisible();

    await page.getByRole('button', { name: 'Editar' }).click();
    await expect(page).toHaveURL(/\/veiculos\/\d+\/editar$/);
    await page.getByLabel('Cor').fill('Verde');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Veículo atualizado com sucesso.')).toBeVisible();

    await page.getByLabel('Buscar por marca, modelo ou cor').fill(marca);
    await page.getByRole('row').filter({ hasText: marca }).getByLabel('Excluir').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByText('Veículo excluído com sucesso.')).toBeVisible();

    await page.getByLabel('Buscar por marca, modelo ou cor').fill(marca);
    await expect(page.getByText('Nenhum veículo encontrado')).toBeVisible();
  });

  test('exibe erro de validação ao tentar salvar formulário vazio', async ({ page }) => {
    await page.goto('/veiculos/novo');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByText('Marca é obrigatória')).toBeVisible();
    await expect(page.getByText('Modelo é obrigatório')).toBeVisible();
    await expect(page).toHaveURL(/\/veiculos\/novo$/);
  });
});
