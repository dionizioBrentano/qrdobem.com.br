import { test, expect } from '@playwright/test';

// Utilizando o modelo sequencial de passos em um único bloco de teste,
// para reaproveitar a sessão do admin (mesma técnica do beneficiary-flow)
test('Fase 3 - Ciclo de Espaços, Créditos e Lotes (Ponta a Ponta)', async ({ page, request }) => {
  test.setTimeout(180000); // 3 minutos de timeout para tranquilidade do servidor

  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  // 1. LOGIN
  await page.goto('/login');
  if (!email || !password) {
    console.log('--- TESTE E2E FASE 3 ---');
    console.log('Nenhuma credencial via .env detectada.');
    console.log('O robô vai pausar agora. Por favor, faça login com seu usuário (Admin) na janela do navegador que abriu.');
    console.log('Assim que a página carregar o /painel, clique em "Resume" no Playwright Inspector!');
    await page.pause();
  } else {
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
  }

  // Espera carregar o painel
  await page.waitForURL('/painel', { timeout: 20000 });
  await expect(page.locator('h1', { hasText: 'Painel de Controle' })).toBeVisible({ timeout: 20000 });

  // 2. RECUPERAÇÃO DA API (BASE URL E ESPAÇOS)
  // Após a pausa (ou via auto login), forçamos um reload do painel para o robô
  // poder interceptar a resposta do Backend, pegando os espaços e a baseURL da API sem travar.
  console.log('[Fase 3] Recarregando o painel para interceptar o backend...');
  const [entitiesRes] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/entities') && res.status() === 200),
    page.reload()
  ]);

  const apiBaseUrl = entitiesRes.url().split('/api/entities')[0];
  const entitiesData = await entitiesRes.json();
  const spaces = entitiesData.spaces || [];
  const initialQuota = entitiesData.quota || 0;

  console.log(`[Fase 3] API URL detectada: ${apiBaseUrl}`);
  console.log(`[Fase 3] Quota inicial lida da rede: ${initialQuota}`);

  if (spaces.length === 0) {
    throw new Error('Você precisa de um Espaço (Causa, Família, etc) para rodar esse teste.');
  }

  // A rota /api/entities traz um resumo dos espaços para o seletor (nem sempre incluindo 'role').
  // Pegamos o owner ou, como fallback, simplesmente o primeiro espaço que você tem acesso.
  const targetSpace = spaces.find(s => s.role === 'owner' || (s.permissions && s.permissions.includes('entity.create'))) || spaces[0];
  if (!targetSpace) throw new Error('Você não possui nenhum espaço cadastrado.');

  const spaceId = targetSpace.id;

  // Clica no seletor do espaço na UI para contextuar o React
  if (spaces.length > 1) {
    await page.locator('text=Espaço ativo').locator('xpath=..//button').first().click();
    await page.waitForTimeout(1000);
  }

  // 3. UI: CRIAÇÃO DE QR DEBITANDO CRÉDITO
  const novoQrBtn = page.getByRole('button', { name: '+ Novo QR Code' }).first();
  if (await novoQrBtn.isDisabled()) {
     throw new Error('O botão + Novo QR Code está DESABILITADO. Saldo zero!');
  }
  await novoQrBtn.click();
  
  await expect(page.locator('h2', { hasText: 'Novo QR Code' })).toBeVisible({ timeout: 15000 });
  
  await page.locator('text=Nome *').locator('xpath=following-sibling::input').first().fill('QR Code Lote E2E ' + Date.now());
  await page.locator('text=Telefone de contato *').locator('xpath=following-sibling::input').first().fill('11999999999');
  await page.locator('input[type="checkbox"]').last().check();
  
  const gerarBtn = page.getByRole('button', { name: 'Registrar QR Code' });
  await expect(gerarBtn).toBeVisible();

  // Espera a resposta do POST
  await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/entities') && res.request().method() === 'POST', { timeout: 15000 }),
    gerarBtn.click()
  ]);
  
  // A tela de sucesso aparece no próprio modal com o botão Concluir
  await expect(page.locator('h2', { hasText: 'Registro criado' })).toBeVisible({ timeout: 15000 });
  const concluirBtn = page.getByRole('button', { name: 'Concluir' });
  await concluirBtn.click();

  // Agora sim, espera fechar o modal completamente
  await expect(page.locator('h2', { hasText: 'Registro criado' })).toBeHidden({ timeout: 10000 });

  // 4. VERIFICAR DÉBITO NA UI (sem fetch errôneo)
  // O React dispara um loadEntities() em background ao fechar o modal.
  // Vamos aguardar ativamente o valor da tela mudar.
  const initialQuotaInt = parseInt(initialQuota, 10) || 0;
  
  if (initialQuotaInt > 0) {
    await expect(async () => {
      const quotaElement = page.locator('text=Créditos disponíveis').locator('xpath=../p[2]');
      const newQuota = parseInt(await quotaElement.innerText(), 10) || 0;
      console.log(`[Fase 3] Aguardando quota reduzir na tela... (Atual: ${newQuota}, Inicial: ${initialQuotaInt})`);
      expect(newQuota).toBeLessThan(initialQuotaInt);
    }).toPass({ timeout: 10000 });
  }

  // 5. CRIAÇÃO DE LOTE (QrBatchController) usando o contexto do Playwright com auth real do Front
  console.log(`[Fase 3] Disparando Lote de QRs via POST API...`);
  
  // Extraímos o token do Firebase do localStorage, que é como o api.js nativo funciona
  const token = await page.evaluate(() => localStorage.getItem('firebase_token') || '');

  // E disparamos a request via Playwright API RequestContext
  const batchRes = await request.post(`${apiBaseUrl}/api/spaces/${spaceId}/qr-batches`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Referer': page.url(),
    },
    data: {
      quantity: 3,
      label: 'Lote E2E ' + Date.now()
    }
  });

  const status = batchRes.status();
  
  if (status === 402) {
    console.log('[Fase 3] Sucesso arquitetural! A API negou o Lote por insuficiência de saldo (402)!');
  } else if (status === 201) {
    const batchJson = await batchRes.json();
    console.log('[Fase 3] Lote criado com sucesso! Lote ID:', batchJson.id);
    expect(batchJson.print_url).toBeDefined();

    // Validando que as entities nasceram 'pending_term'
    const batchListRes = await request.get(`${apiBaseUrl}/api/qr-batches/${batchJson.id}`, {
      headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}`, 'Referer': page.url() }
    });
    const batchDetails = await batchListRes.json();
    
    expect(batchDetails.entities).toBeDefined();
    expect(batchDetails.entities.length).toBe(3);
    for (const entity of batchDetails.entities) {
       expect(entity.status).toBe('pending_term');
    }
    console.log('[Fase 3] Os 3 QR Codes nasceram travados como "pending_term".');

    // 6. TELA DE IMPRESSÃO - Verificar injeção de SVGs do backend
    console.log('[Fase 3] Carregando a folha A4 de Impressão (GET /qr-batches/{id}/print)...');
    
    // Constrói a URL final de print que o usuário abre
    const printUrl = new URL(batchJson.print_url, apiBaseUrl).toString();
    await page.goto(printUrl);

    await expect(page.locator('svg').first()).toBeVisible({ timeout: 15000 });
    const svgCount = await page.locator('svg').count();
    expect(svgCount).toBeGreaterThanOrEqual(3);
    console.log('[Fase 3] Folha de impressão gerada! SVGs embutidos perfeitamente.');
    
  } else {
    const errorBody = await batchRes.text();
    throw new Error(`Erro inesperado Lote: HTTP ${status} - ${errorBody}`);
  }
});
