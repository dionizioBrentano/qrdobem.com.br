import { test, expect } from '@playwright/test';

/**
 * E2E autenticado — Núcleo (Entity + QrCodeModal A1.5)
 *
 * Rode com:
 *   npx playwright test e2e/authenticated-core.spec.ts --headed --project=chromium
 *
 * 1. O teste abre o login e PAUSA.
 * 2. Você faz login manualmente.
 * 3. Clica em Resume.
 * 4. O teste só verifica que chegou no painel e para de novo (segunda pause),
 *    para você abrir o QrCodeModal manualmente se quiser validar A1.5.
 */

test.describe('Núcleo autenticado — Entity + QR A1.5', () => {
  test('Login manual → chega no Painel', async ({ page }) => {
    test.setTimeout(300000); // 5 min

    // 1. Tela de login
    await page.goto('/login');
    await expect(page.getByText(/entrar|login|e-mail|senha/i).first()).toBeVisible({
      timeout: 15000,
    });

    console.log('\n=== PAUSE 1: Faça login e clique em Resume ===\n');
    await page.pause();

    // 2. Confirma que saiu do login e chegou em área autenticada
    await page.waitForURL(/painel|profile|messages|familia|saude|causas|\/$/, {
      timeout: 30000,
    });

    // Vai explicitamente para o painel
    await page.goto('/painel');
    await page.waitForLoadState('networkidle');

    // Verifica que o painel carregou (textos comuns do dashboard)
    await expect(
      page.getByText(/painel|meus qr|entidades|créditos|novo qr|criar/i).first()
    ).toBeVisible({ timeout: 20000 });

    console.log('\n=== PAUSE 2: Você está no Painel. Abra um QR existente ou crie um novo manualmente. ===');
    console.log('=== Depois clique em Resume para finalizar o teste. ===\n');
    await page.pause();

    // Só garante que ainda está logado
    await expect(page).not.toHaveURL(/login/);
  });
});