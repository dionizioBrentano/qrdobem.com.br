import { test, expect } from '@playwright/test';

test.describe('Fase 2 - Ciclo de Repasses e Beneficiários (Ponta a Ponta)', () => {
  const beneficiaryName = `Beneficiário Teste ${Date.now()}`;

  test('Deve criar beneficiário, realizar o repasse, e fazer a contraprova pelo link público', async ({ page, context }) => {
    // 2 minutos para dar tempo de você logar e clicar no botão "Resume"
    test.setTimeout(120000); 
    
    // 1. Login Manual
    await page.goto('https://qrdobem.com.br/login');
    
    // O robô vai pausar AQUI. 
    // Digite suas credenciais no navegador, clique em "Entrar" e quando 
    // vir o Painel de Controle, vá na barra do Playwright e clique no "Resume" ▶️
    await page.pause();
    
    // Aguarda painel carregar
    await expect(page.locator('text=Painel de Controle').first()).toBeVisible({ timeout: 20000 });

    // Permissão silenciosa para o Playwright conseguir copiar o link gerado da área de transferência
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // 2. Acessar Módulo de Repasses
    await page.goto('https://qrdobem.com.br/repasses');
    await expect(page.locator('h2', { hasText: 'Beneficiários' })).toBeVisible();

    // 3. Criar beneficiário no space da causa
    await page.getByRole('button', { name: 'Novo' }).first().click();
    await page.fill('input[placeholder*="Nome"]', beneficiaryName);
    await page.click('button:has-text("Cadastrar beneficiário")');
    
    // Espera o nome pipocar na lista após criação (a API pode demorar mais que 5s)
    await expect(page.locator('text=' + beneficiaryName).first()).toBeVisible({ timeout: 20000 });

    // 4. Copiar link único gerado 
    // O robô clica no botão "Link" da linha exata deste novo beneficiário e raspa o clipboard
    const rowLocator = page.locator(`text=${beneficiaryName}`).locator('xpath=./ancestor::li');
    await rowLocator.locator('button:has-text("Link")').click();
    const uniqueCodeUrl = await page.evaluate(() => navigator.clipboard.readText());
    if (!uniqueCodeUrl.includes('/b/')) throw new Error('Não copiou a URL correta!');

    // 5. Definir Senha
    // Intercepta a popup "window.prompt" de senha que abriria e preenche com "senha123" sozinho.
    page.once('dialog', async dialog => {
      await dialog.accept('senha123');
    });
    await rowLocator.locator('button:has-text("Definir senha")').click();
    await page.waitForTimeout(2000); // Aguarda o frontend salvar a senha na API (2 segundos de margem extra)

    // 6. Criar repasse (ex.: Cesta Básica)
    await page.getByRole('button', { name: 'Novo' }).nth(1).click();
    await page.selectOption('select', { label: beneficiaryName });
    await page.fill('input[placeholder*="Descrição"]', 'Cesta Básica (Teste E2E)');
    await page.click('button:has-text("Registrar repasse")');
    await expect(page.locator('text=Cesta Básica (Teste E2E)').first()).toBeVisible({ timeout: 20000 });

    // 7. Transição: requested → approved → sent
    const repasseLocator = page.locator(`text=Cesta Básica (Teste E2E)`).locator('xpath=./ancestor::li');
    await repasseLocator.locator('button:has-text("Aprovar")').click();
    await expect(repasseLocator.locator('text=Aprovado')).toBeVisible({ timeout: 15000 });
    await repasseLocator.locator('button:has-text("Marcar como enviado")').click();
    await expect(repasseLocator.locator('text=Enviado')).toBeVisible({ timeout: 15000 });

    // 8. Página pública do beneficiário abre em aba anônima/separada
    const publicPage = await context.newPage();
    await publicPage.goto(uniqueCodeUrl);
    await expect(publicPage.locator('text=Você recebeu?')).toBeVisible({ timeout: 15000 });

    // 9. Confirmar recebimento com a mesma "senha123" que cadastramos
    await publicPage.click('button:has-text("JÁ RECEBI")');
    await publicPage.fill('input[type="password"]', 'senha123');
    await publicPage.click('button:has-text("CONFIRMAR")');
    await expect(publicPage.locator('text=Recebimento confirmado')).toBeVisible({ timeout: 15000 });

    // (O upload de prova social "enviar foto" pula essa validação E2E para não travar o Windows esperando um arquivo)

    // 10. Novo pedido ("Fraldas") aparece para a causa
    await publicPage.click('button:has-text("Pedir")');
    await publicPage.fill('input[placeholder*="O que você precisa?"]', 'Fraldas (Teste)');
    await publicPage.click('button:has-text("Enviar pedido")');
    await expect(publicPage.locator('text=Fraldas (Teste)')).toBeVisible({ timeout: 15000 });

    // 11. Status do repasse vira confirmed no admin
    await page.bringToFront();
    await page.reload();
    const finalRepasseLocator = page.locator(`text=Cesta Básica (Teste E2E)`).locator('xpath=./ancestor::li');
    await expect(finalRepasseLocator.locator('text=Confirmado').first()).toBeVisible();
  });
});
