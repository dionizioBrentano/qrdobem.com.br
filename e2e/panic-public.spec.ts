import { test, expect } from '@playwright/test';

/**
 * E2E — Pânico público (transversal: person / pet / object)
 *
 * Pré-requisitos (variáveis de ambiente):
 *   E2E_PANIC_CODE_PERSON  — unique_code de pessoa ativa (opcional)
 *   E2E_PANIC_CODE_PET     — unique_code de pet ativo
 *   E2E_PANIC_CODE_OBJECT  — unique_code de objeto ativo
 *   E2E_PANIC_CODE_NO_SPACE — unique_code ativo SEM space_id (valida pânico sem destinatários)
 *   E2E_PANIC_CODE_WITH_CONTACTS — unique_code com space + membros (valida notificação)
 *
 * Sem as variáveis, os testes correspondentes são skipped (não falham o CI).
 *
 * Alvo: E2E_BASE_URL ou https://qrdobem.com.br
 */

const codes = {
  person: process.env.E2E_PANIC_CODE_PERSON,
  pet: process.env.E2E_PANIC_CODE_PET,
  object: process.env.E2E_PANIC_CODE_OBJECT,
  noSpace: process.env.E2E_PANIC_CODE_NO_SPACE,
  withContacts: process.env.E2E_PANIC_CODE_WITH_CONTACTS,
};

async function mockGeo(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    // @ts-expect-error override em browser
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

async function openPublicQr(page: import('@playwright/test').Page, uniqueCode: string) {
  await page.goto(`/q/${uniqueCode}`);
  await expect(page.locator('body')).not.toContainText('não encontrado', { timeout: 15000 });
}

async function armAndFirePanic(page: import('@playwright/test').Page) {
  const armBtn = page.getByRole('button', { name: /pânico|emergência|alerta/i }).first();
  await expect(armBtn).toBeVisible({ timeout: 10000 });
  await armBtn.click();

  const confirmBtn = page.getByRole('button', {
    name: /confirmar|enviar alerta|disparar|sim,.*alerta/i,
  }).first();
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  await confirmBtn.click();
}

test.describe('Pânico público — botão em todas as trilhas', () => {
  test('person: botão de pânico visível', async ({ page }) => {
    test.skip(!codes.person, 'Defina E2E_PANIC_CODE_PERSON');
    await openPublicQr(page, codes.person!);
    await expect(
      page.getByRole('button', { name: /pânico|emergência|alerta/i }).first()
    ).toBeVisible();
  });

  test('pet: botão de pânico visível', async ({ page }) => {
    test.skip(!codes.pet, 'Defina E2E_PANIC_CODE_PET');
    await openPublicQr(page, codes.pet!);
    await expect(
      page.getByRole('button', { name: /pânico|emergência|alerta/i }).first()
    ).toBeVisible();
  });

  test('object: botão de pânico visível', async ({ page }) => {
    test.skip(!codes.object, 'Defina E2E_PANIC_CODE_OBJECT');
    await openPublicQr(page, codes.object!);
    await expect(
      page.getByRole('button', { name: /pânico|emergência|alerta/i }).first()
    ).toBeVisible();
  });
});

test.describe('Pânico público — sem space / sem destinatários', () => {
  test('aciona, retorna sucesso e libera UI de socorro', async ({ page }) => {
    test.skip(!codes.noSpace, 'Defina E2E_PANIC_CODE_NO_SPACE (entity ativa sem space_id)');
    test.setTimeout(60000);

    await mockGeo(page);

    const panicResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/entities/${codes.noSpace}/panic`) &&
        res.request().method() === 'POST',
      { timeout: 30000 }
    );

    await openPublicQr(page, codes.noSpace!);
    await armAndFirePanic(page);

    const panicRes = await panicResponsePromise;
    expect(panicRes.status()).toBe(201);

    const body = await panicRes.json();
    expect(body.emergency_unlocked).toBeTruthy();
    expect(body.event_id).toBeTruthy();
    if (body.notified === false) {
      expect(String(body.message || '')).toMatch(/nenhum contato|socorro/i);
    }

    await expect(
      page.getByText(/alerta enviado|dados liberados|socorro|família/i).first()
    ).toBeVisible({ timeout: 15000 });

    await expect(
      page
        .getByText(/informações de saúde|sem informações de saúde cadastradas|socorro/i)
        .first()
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Pânico público — com contatos no space', () => {
  test('aciona e indica tentativa de aviso aos contatos', async ({ page }) => {
    test.skip(
      !codes.withContacts,
      'Defina E2E_PANIC_CODE_WITH_CONTACTS (entity com space + membros)'
    );
    test.setTimeout(60000);

    await mockGeo(page);

    const panicResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/entities/${codes.withContacts}/panic`) &&
        res.request().method() === 'POST',
      { timeout: 30000 }
    );

    await openPublicQr(page, codes.withContacts!);
    await armAndFirePanic(page);

    const panicRes = await panicResponsePromise;
    expect(panicRes.status()).toBe(201);

    const body = await panicRes.json();
    expect(body.emergency_unlocked).toBeTruthy();
    expect(body.event_id).toBeTruthy();

    await expect(
      page.getByText(/alerta enviado|contatos|dados liberados|socorro/i).first()
    ).toBeVisible({ timeout: 15000 });
  });
});
