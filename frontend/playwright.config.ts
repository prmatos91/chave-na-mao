import { defineConfig, devices } from '@playwright/test';

/**
 * Roda contra a stack real (frontend + backend + Postgres) via Docker Compose.
 * Suba o ambiente antes com `docker compose up --build -d` na raiz do projeto.
 * Ver docs/QA_GUIDE.md para o comando completo de execucao.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
