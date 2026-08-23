import { expect, test } from '@playwright/test';

test.describe('Marca e identidade visual', () => {
  test('exibe o nome "Chave na Mão" na barra lateral e no título da página', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('.app-brand')).toContainText('Chave na Mão');
    await expect(page).toHaveTitle(/Chave na Mão/);
  });
});

test.describe('Paginação em português', () => {
  test('mostra os textos do paginador traduzidos, não em inglês', async ({ page }) => {
    await page.goto('/veiculos');

    await expect(page.getByText('Itens por página:')).toBeVisible();
    // O Material renderiza o rótulo com espaço nas bordas (" 1 – 8 de 8 ");
    // o Playwright colapsa espaços internos mas preserva a borda, entao o
    // regex precisa tolerar isso em vez de ancorar direto em \d.
    await expect(page.getByText(/^\s*\d+\s*–\s*\d+ de \d+\s*$/)).toBeVisible();
    await expect(page.getByText('Items per page')).toHaveCount(0);
  });
});

test.describe('Tema claro/escuro', () => {
  test('o botão de alternar tema troca a classe dark-theme no <html> e persiste após navegar', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    const html = page.locator('html');
    const estadoInicialEscuro = (await html.getAttribute('class'))?.includes('dark-theme') ?? false;

    const botaoTema = page.getByRole('button', { name: /Mudar para modo/ });
    await botaoTema.click();

    if (estadoInicialEscuro) {
      await expect(html).not.toHaveClass(/dark-theme/);
    } else {
      await expect(html).toHaveClass(/dark-theme/);
    }

    // Navega para outra tela e confirma que a escolha de tema nao volta ao padrao.
    // exact: true evita ambiguidade com o card clicavel "Veículos cadastrados" do dashboard.
    await page.getByRole('link', { name: 'Veículos', exact: true }).click();
    if (estadoInicialEscuro) {
      await expect(html).not.toHaveClass(/dark-theme/);
    } else {
      await expect(html).toHaveClass(/dark-theme/);
    }

    // Devolve o tema ao estado original para nao interferir em outros testes/sessoes.
    await botaoTema.click();
  });
});

test.describe('Ordenação de colunas', () => {
  test('clicar no cabeçalho Preço ordena a listagem de veículos', async ({ page }) => {
    await page.goto('/veiculos');

    await page.locator('th', { hasText: 'Preço' }).click();
    await expect(page.locator('td.cdk-column-preco').first()).toHaveText('R$ 54.900,00');

    await page.locator('th', { hasText: 'Preço' }).click();
    await expect(page.locator('td.cdk-column-preco').first()).toHaveText('R$ 289.900,00');
  });
});

test.describe('Oportunidades relacionadas nas páginas de detalhe', () => {
  test('detalhe do cliente mostra suas oportunidades, e detalhe do veículo mostra os interessados', async ({
    page,
  }) => {
    // Carlos Eduardo Lima / Toyota Corolla vem do seed (V2__seed.sql) e sempre existe no ambiente.
    await page.goto('/clientes');
    await page.getByLabel('Buscar por nome ou e-mail').fill('Carlos Eduardo Lima');
    await page.getByRole('row').filter({ hasText: 'Carlos Eduardo Lima' }).getByLabel('Visualizar').click();
    await expect(page).toHaveURL(/\/clientes\/\d+$/);

    await expect(page.getByText('Oportunidades deste cliente')).toBeVisible();
    const linkOportunidade = page.getByRole('link', { name: /Toyota Corolla/ });
    await expect(linkOportunidade).toBeVisible();

    await linkOportunidade.click();
    await expect(page).toHaveURL(/\/oportunidades\/\d+$/);

    await page.goto('/veiculos');
    await page.getByLabel('Buscar por marca, modelo ou cor').fill('Corolla');
    await page.getByRole('row').filter({ hasText: 'Corolla' }).getByLabel('Visualizar').click();
    await expect(page).toHaveURL(/\/veiculos\/\d+$/);

    await expect(page.getByText('Clientes interessados')).toBeVisible();
    await expect(page.getByRole('link', { name: /Carlos Eduardo Lima/ })).toBeVisible();
  });
});
