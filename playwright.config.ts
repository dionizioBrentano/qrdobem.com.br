import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração base do E2E do QR do Bem.
 *
 * O alvo dos testes é definido por E2E_BASE_URL. Sem essa variável, cai no
 * ambiente de produção — os specs desta fase são só de leitura pública
 * (/ e /ajuda), sem login, pagamento ou criação de causa, então rodar contra
 * produção é seguro. Para apontar para outro ambiente, exporte a variável
 * (ver .env.e2e.example) antes de rodar.
 */
const baseURL = process.env.E2E_BASE_URL || 'https://qrdobem.com.br';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
