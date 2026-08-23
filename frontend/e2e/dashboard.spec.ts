import { expect, test } from '@playwright/test';

test.describe('Dashboard', () => {
  test('carrega e mostra os indicadores principais', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
    await expect(page.getByText('Veículos cadastrados')).toBeVisible();
    await expect(page.getByText('Clientes cadastrados')).toBeVisible();
    await expect(page.getByText('Oportunidades abertas')).toBeVisible();
    await expect(page.getByText('Veículos por status')).toBeVisible();
    await expect(page.getByText('Oportunidades por status')).toBeVisible();
  });

  test('navega para as demais telas pelo menu lateral', async ({ page }) => {
    await page.goto('/dashboard');

    // exact: true evita ambiguidade com os cards clicaveis do dashboard
    // (ex. "Veículos cadastrados"), que tambem tem "Veículos" no nome acessivel.
    await page.getByRole('link', { name: 'Veículos', exact: true }).click();
    await expect(page).toHaveURL(/\/veiculos$/);
    await expect(page.getByRole('heading', { name: 'Veículos', exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Clientes', exact: true }).click();
    await expect(page).toHaveURL(/\/clientes$/);

    await page.getByRole('link', { name: 'Oportunidades', exact: true }).click();
    await expect(page).toHaveURL(/\/oportunidades$/);
  });

  test('cards de indicadores e linhas de status levam para a listagem filtrada', async ({ page }) => {
    await page.goto('/dashboard');

    await page.getByRole('link', { name: 'Veículos cadastrados' }).click();
    await expect(page).toHaveURL(/\/veiculos$/);

    await page.goto('/dashboard');
    await page.getByRole('link', { name: /Reservado/ }).first().click();
    await expect(page).toHaveURL(/\/veiculos\?status=RESERVADO$/);
    await expect(page.getByLabel('Status')).toHaveText('Reservado');
  });
});
