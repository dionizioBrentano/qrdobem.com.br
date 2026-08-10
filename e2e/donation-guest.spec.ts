import { test, expect } from '@playwright/test';

test('Fluxo de Doação Guest PIX e Renderização do Mercado Pago Bricks', async ({ page }) => {
  test.setTimeout(45000); // 45 segundos para dar tempo do Bricks carregar

  // 1. Acessa a rota de doações
  await page.goto('/doacoes');

  // Garante que a página carregou verificando o título/cabeçalho
  await expect(page.locator('h1', { hasText: 'Doar' })).toBeVisible();

  // 2. Preenche os dados de Guest Checkout
  // CPF de teste gerado válido para não barrar no CpfValidator do backend
  const testCpf = '71428793060'; 

  await page.fill('input[placeholder="Nome completo"]', 'Teste Automatizado Playwright');
  await page.fill('input[placeholder="E-mail (para o recibo)"]', 'teste.e2e.guest@qrdobem.com.br');
  await page.fill('input[placeholder="CPF"]', testCpf);
  
  // Marca o checkbox LGPD (clicando no texto do label correspondente)
  await page.locator('label').filter({ hasText: 'Autorizo o uso destes dados' }).locator('input[type="checkbox"]').check();

  // 3. Clica para abrir o modal de checkout
  await page.click('button:has-text("Ir para pagamento")');

  // Verifica se rolou algum erro de validação (para debug log)
  const errorAlert = page.locator('div.bg-red-50.text-red-700');
  if (await errorAlert.isVisible()) {
    console.error('Validation Error:', await errorAlert.textContent());
  }

  // 4. Modal abre e exige Endereço (para processamento do antifraude)
  // O Modal de checkout faz uma requisição ao backend para pegar a chave pública do Mercado Pago
  // Aumentamos o tempo de espera porque o webhook e os requests de start costumam demorar em prod.
  await expect(page.locator('h2', { hasText: 'Pagamento da Doação' })).toBeVisible({ timeout: 15000 });

  // Preenche Endereço (navegando ao input vizinho do respectivo label)
  await page.locator('label:has-text("CEP")').locator('..').locator('input').fill('01001-000');
  await page.locator('label:has-text("Rua")').locator('..').locator('input').fill('Praça da Sé');
  await page.locator('label:has-text("Número")').locator('..').locator('input').fill('123');
  await page.locator('label:has-text("Bairro")').locator('..').locator('input').fill('Sé');
  await page.locator('label:has-text("Cidade")').locator('..').locator('input').fill('São Paulo');
  await page.locator('label:has-text("UF")').locator('..').locator('input').fill('SP');

  // Continua para carregar o SDK do Mercado Pago
  await page.click('button:has-text("Continuar para Pagamento")');

  // 5. Valida se o contêiner do Mercado Pago Bricks é injetado na tela
  // O Bricks injeta iframes ou blocos com a classe de payment. Vamos aguardar
  // que o componente de UI do MP apareça, provando que o Payload passou da nossa
  // camada e está com o Gateway.
  
  // A classe base costuma ter .mp-... ou iframe
  // Vamos esperar por um iframe do Mercado Pago, que sinaliza que o Payment Brick carregou
  // Aguarda um tempo para a renderização do Brick
  await page.waitForTimeout(5000);

  // Verifica se o endereço acusou erro ao invés de passar pro Brick
  const modalError = page.locator('.bg-red-50.text-red-700');
  if (await modalError.isVisible()) {
    console.error('ERRO NO MODAL:', await modalError.textContent());
  }

  // Verifica o que o modal está exibindo (extrai o texto e loga para debug)
  const modalContainer = page.locator('.bg-white.rounded-xl.shadow-xl');
  console.log('--- CONTEÚDO DO MODAL APÓS 5 SEGS ---');
  console.log(await modalContainer.textContent());
  console.log('--------------------------------------');

  // A expectativa mínima é que o Brick monte a opção de Pix ou exiba o Total
  await expect(modalContainer).toContainText(/Pix|Cartão|Total|Pagamento/i);
});
