# Testes E2E (Playwright)

Testes de ponta a ponta das rotas **públicas** do QR do Bem. Esta fase não faz
login, pagamento nem criação de causa autenticada — só verifica que as páginas
públicas respondem e que a Central de Ajuda mostra o conteúdo real de causa e
família (TR-1b).

## Como rodar

Na pasta `front/`:

```bash
npm install
npx playwright install
npm run test:e2e
```

- `npx playwright install` baixa os navegadores que o Playwright usa (passo
  único por máquina).
- `npm run test:e2e` roda `playwright test` sobre a pasta `e2e/`.

## Escolher o ambiente

O alvo é a variável `E2E_BASE_URL`. Sem ela, os testes rodam contra produção
(`https://qrdobem.com.br`) — ver `playwright.config.ts`.

Para apontar para outro ambiente, exporte a variável antes de rodar:

```bash
E2E_BASE_URL=http://localhost:5173 npm run test:e2e
```

O arquivo `.env.e2e.example` (na raiz de `front/`) documenta a variável. Copie
para `.env.e2e` se quiser guardar sua configuração local — o Playwright **não**
carrega esse arquivo sozinho; use-o como referência e exporte a variável no
shell (ou pelo seu runner de CI).

## O que cada spec cobre

- `smoke-public.spec.ts` — `/` e `/ajuda` respondem 200.
- `help.spec.ts` — `/ajuda` responde 200; a seção **Causas** abre e mostra
  "Criar minha causa" e a menção a CNPJ; a seção **Família** abre e mostra
  "Árvore da família".
