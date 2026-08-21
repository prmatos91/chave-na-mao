import { expect, test } from '@playwright/test';

test.describe('Clientes - fluxo completo', () => {
  test('cria e exclui um cliente', async ({ page }) => {
    const email = `e2e${Date.now()}@example.com`;

    await page.goto('/clientes');
    await page.getByRole('button', { name: 'Novo cliente' }).click();
    await expect(page).toHaveURL(/\/clientes\/novo$/);

    await page.getByLabel('Nome').fill('Cliente Teste E2E');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Telefone').fill('11912345678');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page).toHaveURL(/\/clientes$/);
    await expect(page.getByText('Cliente cadastrado com sucesso.')).toBeVisible();

    await page.getByLabel('Buscar por nome ou e-mail').fill(email);
    const linha = page.getByRole('row').filter({ hasText: email });
    await expect(linha).toBeVisible();

    await linha.getByLabel('Excluir').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByText('Cliente excluído com sucesso.')).toBeVisible();
  });

  test('bloqueia cadastro com e-mail ja utilizado por outro cliente', async ({ page }) => {
    // ana.souza@example.com vem do seed (V2__seed.sql) e sempre existe no ambiente.
    await page.goto('/clientes/novo');

    await page.getByLabel('Nome').fill('Duplicado E2E');
    await page.getByLabel('E-mail').fill('ana.souza@example.com');
    await page.getByLabel('Telefone').fill('11999998888');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByText(/Ja existe um cliente cadastrado|Já existe um cliente cadastrado/)).toBeVisible();
    await expect(page).toHaveURL(/\/clientes\/novo$/);
  });
});
