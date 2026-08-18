import { test, expect, type Page } from '@playwright/test';

/**
 * E2E — Núcleo do QR do Bem (Entity + Leitura + Pânico + Mensagens + A1.5)
 *
 * Cobre as funcionalidades estáveis listadas no PLANO_UNIFICADO_ROADMAP.md v2.0:
 * - Página pública da Entity (person / pet / object)
 * - Mensagens anônimas (conversa)
 * - PublicPanicButton (já parcialmente em panic-public.spec.ts)
 * - Declaração de emergência (person)
 * - Home + trilhas (pets, pessoas, aventura)
 * - Smoke de rotas públicas
 *
 * Pré-requisitos (opcionais — testes skipped se ausentes):
 *   E2E_CODE_PERSON   — unique_code de person ativa
 *   E2E_CODE_PET      — unique_code de pet ativa
 *   E2E_CODE_OBJECT   — unique_code de object ativa
 *
 * Alvo: E2E_BASE_URL || https://qrdobem.com.br
 *
 * Para testes autenticados (criação de Entity + QrCodeModal A1.5):
 *   use o modo headed + page.pause() ou configure storageState.
 */

const codes = {
  person: process.env.E2E_CODE_PERSON || process.env.E2E_PANIC_CODE_PERSON,
  pet: process.env.E2E_CODE_PET || process.env.E2E_PANIC_CODE_PET,
  object: process.env.E2E_CODE_OBJECT || process.env.E2E_PANIC_CODE_OBJECT,
};

async function mockGeo(page: Page) {
  await page.addInitScript(() => {
    // @ts-expect-error override
    navigator.geolocation.getCurrentPosition = (success: PositionCallback) => {
      success({
        coords: {
          latitude: -30.0346,
          longitude: -51.2177,
          accuracy: 25,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    };
  });
}

async function openPublicEntity(page: Page, uniqueCode: string) {
  const res = await page.goto(`/q/${uniqueCode}`);
  expect(res?.status()).toBeLessThan(400);
  await expect(page.locator('body')).not.toContainText(/não encontrado|Registro não encontrado/i, {
    timeout: 15000,
  });
}

// ─────────────────────────────────────────────────────────────
// 1. Smoke + Home + Trilhas (marketing / conversão)
// ─────────────────────────────────────────────────────────────
test.describe('Home e Trilhas (público)', () => {
  test('Home carrega e mostra trilhas principais', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);

    // Trilhas visíveis no menu / conteúdo
    await expect(page.getByText(/pets|tutores de pets/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/pessoas|proteção/i).first()).toBeVisible();
    await expect(page.getByText(/aventura/i).first()).toBeVisible();
  });

  test('Deep-link ?trilha=pets rola e mostra conteúdo de pet', async ({ page }) => {
    await page.goto('/?trilha=pets');
    await expect(page.getByText(/pet se perdeu|seu pet|coleira/i).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole('button', { name: /criar meu qr de pet|criar.*pet/i }).first()).toBeVisible();
  });

  test('Deep-link ?trilha=pessoas mostra conteúdo de pessoa', async ({ page }) => {
    await page.goto('/?trilha=pessoas');
    await expect(page.getByText(/proteção e privacidade|crianças|idosos|pcd/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Deep-link ?trilha=aventura mostra conteúdo de aventura', async ({ page }) => {
    await page.goto('/?trilha=aventura');
    await expect(
      page.getByText(/trilha|ciclismo|botão de pânico|identidade de emergência/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('/ajuda responde e tem seções reais', async ({ page }) => {
    const res = await page.goto('/ajuda');
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('button', { name: /causa|família|primeiros/i }).first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
// 2. Página pública da Entity (núcleo)
// ─────────────────────────────────────────────────────────────
test.describe('Página pública da Entity', () => {
  test('person: carrega nome, botão de pânico e declarar emergência', async ({ page }) => {
    test.skip(!codes.person, 'Defina E2E_CODE_PERSON (ou E2E_PANIC_CODE_PERSON)');
    await openPublicEntity(page, codes.person!);

    // Nome da entidade
    await expect(page.locator('h1').first()).toBeVisible();

    // Botão de pânico (PublicPanicButton)
    await expect(
      page.getByRole('button', { name: /avisar responsável|pânico|emergência|alerta/i }).first()
    ).toBeVisible({ timeout: 10000 });

    // Declarar Emergência só em person
    await expect(page.getByRole('button', { name: /declarar emergência/i }).first()).toBeVisible();
  });

  test('pet: carrega e mostra botão de pânico (sem declarar emergência)', async ({ page }) => {
    test.skip(!codes.pet, 'Defina E2E_CODE_PET');
    await openPublicEntity(page, codes.pet!);

    await expect(page.locator('h1').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /avisar responsável|pânico|emergência|alerta/i }).first()
    ).toBeVisible();

    // Pet não deve ter "Declarar Emergência" (é feature de person)
    await expect(page.getByRole('button', { name: /declarar emergência/i })).toHaveCount(0);
  });

  test('object: carrega e mostra botão de pânico', async ({ page }) => {
    test.skip(!codes.object, 'Defina E2E_CODE_OBJECT');
    await openPublicEntity(page, codes.object!);

    await expect(page.locator('h1').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /avisar responsável|pânico|emergência|alerta/i }).first()
    ).toBeVisible();
  });

  test('entity inexistente mostra "não encontrado"', async ({ page }) => {
    await page.goto('/q/codigo-inexistente-e2e-123456');
    await expect(page.getByText(/não encontrado|Registro não encontrado/i).first()).toBeVisible({
      timeout: 10000,
    });
  });
});

// ─────────────────────────────────────────────────────────────
// 3. Mensagens anônimas (conversa pública)
// ─────────────────────────────────────────────────────────────
test.describe('Mensagens anônimas (público)', () => {
  test('formulário de mensagem aparece e envia (person ou pet)', async ({ page }) => {
    const code = codes.person || codes.pet;
    test.skip(!code, 'Defina E2E_CODE_PERSON ou E2E_CODE_PET');
    test.setTimeout(45000);

    await openPublicEntity(page, code!);

    // Formulário de início de conversa
    const nick = page.getByPlaceholder(/apelido|seu nome|nickname/i).first();
    const msg = page.getByPlaceholder(/mensagem|escreva|conte/i).first();
    const sendBtn = page.getByRole('button', { name: /enviar mensagem|enviar/i }).first();

    // Pode já existir conversa em localStorage; se não, preenche
    if (await nick.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nick.fill(`E2E Benfeitor ${Date.now().toString().slice(-4)}`);
      await msg.fill('Mensagem de teste automatizado Playwright — favor ignorar.');
      await sendBtn.click();

      // Espera feedback de envio ou bubble
      await expect(
        page.getByText(/enviado|mensagem|aguarde|conversa|resposta/i).first()
      ).toBeVisible({ timeout: 15000 });
    } else {
      // Já tem conversa aberta — só confere que a área existe
      await expect(page.locator('body')).toContainText(/mensagem|conversa|benfeitor/i);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Declaração de emergência (person)
// ─────────────────────────────────────────────────────────────
test.describe('Declaração de emergência (público)', () => {
  test('person: abre modal e confirma declaração', async ({ page }) => {
    test.skip(!codes.person, 'Defina E2E_CODE_PERSON');
    test.setTimeout(60000);
    await mockGeo(page);

    const declarePromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/entities/${codes.person}/declare-emergency`) &&
        res.request().method() === 'POST',
      { timeout: 30000 }
    );

    await openPublicEntity(page, codes.person!);

    const declareBtn = page.getByRole('button', { name: /declarar emergência/i }).first();
    await expect(declareBtn).toBeVisible({ timeout: 10000 });
    await declareBtn.click();

    // Modal
    await expect(page.getByText(/declarar emergência|confirmar emergência/i).first()).toBeVisible({
      timeout: 5000,
    });

    const confirmBtn = page.getByRole('button', { name: /confirmar emergência|confirmar/i }).first();
    await confirmBtn.click();

    const res = await declarePromise;
    // 200/201 ou 422 se já declarado recentemente — ambos são respostas válidas da API
    expect([200, 201, 422]).toContain(res.status());

    await expect(
      page.getByText(/emergência declarada|dados liberados|saúde|socorro/i).first()
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─────────────────────────────────────────────────────────────
// 5. Pânico público (reforço — já existe panic-public.spec.ts)
// ─────────────────────────────────────────────────────────────
test.describe('Pânico público (núcleo)', () => {
  test('person: arma, dispara e recebe feedback de sucesso', async ({ page }) => {
    test.skip(!codes.person, 'Defina E2E_CODE_PERSON');
    test.setTimeout(60000);
    await mockGeo(page);

    const panicPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/entities/${codes.person}/panic`) &&
        res.request().method() === 'POST',
      { timeout: 30000 }
    );

    await openPublicEntity(page, codes.person!);

    // Armar
    const armBtn = page.getByRole('button', { name: /avisar responsável|pânico|emergência|alerta/i }).first();
    await expect(armBtn).toBeVisible({ timeout: 10000 });
    await armBtn.click();

    // Confirmar
    const confirmBtn = page.getByRole('button', {
      name: /sim,.*avisar|confirmar|enviar alerta|disparar/i,
    }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    const panicRes = await panicPromise;
    expect(panicRes.status()).toBe(201);

    const body = await panicRes.json();
    expect(body.event_id || body.emergency_unlocked).toBeTruthy();

    await expect(
      page.getByText(/alerta enviado|dados liberados|socorro|família|contatos/i).first()
    ).toBeVisible({ timeout: 15000 });
  });
});

// ─────────────────────────────────────────────────────────────
// 6. Rotas públicas diversas
// ─────────────────────────────────────────────────────────────
test.describe('Rotas públicas adicionais', () => {
  test('/causas responde 200', async ({ page }) => {
    const res = await page.goto('/causas');
    expect(res?.status()).toBe(200);
  });

  test('/doacoes responde 200', async ({ page }) => {
    const res = await page.goto('/doacoes');
    expect(res?.status()).toBe(200);
    await expect(page.getByText(/doar|doação/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('/login responde 200', async ({ page }) => {
    const res = await page.goto('/login');
    expect(res?.status()).toBe(200);
  });
});