import { test, expect } from '@playwright/test';

/**
 * Smoke das rotas públicas — só verifica que respondem 200, sem login.
 * Serve de canário: se a Home ou a Ajuda caírem, o pipeline avisa antes de
 * qualquer teste mais específico.
 */
test.describe('Smoke público', () => {
  test('/ responde 200', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
  });

  test('/ajuda responde 200', async ({ page }) => {
    const res = await page.goto('/ajuda');
    expect(res?.status()).toBe(200);
  });
});
