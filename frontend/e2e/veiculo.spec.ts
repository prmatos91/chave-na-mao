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

  test('digitar no campo Preço substitui o zero padrão em vez de concatenar', async ({ page }) => {
    await page.goto('/veiculos/novo');

    const campoPreco = page.getByLabel('Preço (R$)');
    await expect(campoPreco).toHaveValue('0');

    // pressSequentially simula digitação real (tecla por tecla), diferente de
    // fill() - é o unico jeito de exercitar de verdade o comportamento de
    // selecionar-tudo-ao-focar (selectOnFocus) que corrige o bug relatado.
    await campoPreco.click();
    await campoPreco.pressSequentially('150000');

    await expect(campoPreco).toHaveValue('150000');
  });

  test('autocomplete de marca sugere valores existentes e filtra modelo em cascata', async ({ page }) => {
    // "Toyota" / "Corolla" vem do seed (V2__seed.sql) e sempre existe no ambiente.
    await page.goto('/veiculos/novo');

    // getByLabel('Marca') resolve tanto o input quanto o painel de opções do
    // autocomplete (ambos ficam associados ao mesmo label); getByRole com
    // 'combobox' aponta direto para o input, sem ambiguidade.
    const campoMarca = page.getByRole('combobox', { name: 'Marca' });
    await campoMarca.click();
    await campoMarca.pressSequentially('Toy');
    await page.getByRole('option', { name: 'Toyota', exact: true }).click();
    await expect(campoMarca).toHaveValue('Toyota');

    const campoModelo = page.getByRole('combobox', { name: 'Modelo' });
    await campoModelo.click();
    await expect(page.getByRole('option', { name: 'Corolla', exact: true })).toBeVisible();
    // Nao deve sugerir modelo de outra marca (ex.: HR-V, da Honda).
    await expect(page.getByRole('option', { name: 'HR-V', exact: true })).toHaveCount(0);
  });
});
