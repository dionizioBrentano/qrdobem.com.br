import { test, expect } from '@playwright/test';

/**
 * Ajuda pública — sem login.
 *
 * A Central de Ajuda é um accordion: só a seção "primeiros-passos" abre por
 * padrão. Os títulos de todas as seções ficam sempre no DOM; o corpo de cada
 * uma só é renderizado depois de expandir. Por isso os testes clicam no título
 * antes de conferir o texto interno.
 *
 * As strings conferidas existem em src/pages/HelpPage.jsx após o TR-1b
 * (fluxo real de causa e família). Nada aqui inventa texto que a Ajuda não
 * tenha.
 */
test.describe('Ajuda (público, sem login)', () => {
  test('/ajuda responde 200', async ({ page }) => {
    const res = await page.goto('/ajuda');
    expect(res?.status()).toBe(200);
  });

  test('seção Causas descreve o fluxo real', async ({ page }) => {
    await page.goto('/ajuda');

    // Título sempre visível.
    const causas = page.getByRole('button', { name: /Quero cadastrar minha causa/i });
    await expect(causas).toBeVisible();

    // Abre a seção e confere o corpo (formulário e ausência de CNPJ).
    await causas.click();
    await expect(page.getByText(/Criar minha causa/i)).toBeVisible();
    await expect(page.getByText(/CNPJ/i).first()).toBeVisible();
  });

  test('seção Família menciona a árvore', async ({ page }) => {
    await page.goto('/ajuda');

    const familia = page.getByRole('button', { name: /Família: vários perfis, uma conta/i });
    await expect(familia).toBeVisible();

    await familia.click();
    await expect(page.getByText(/Árvore da família/i)).toBeVisible();
  });
});
