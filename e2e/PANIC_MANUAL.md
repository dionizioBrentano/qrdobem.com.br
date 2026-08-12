# Roteiro manual — Pânico transversal

**Objetivo:** validar que o botão de pânico funciona para socorro no local **sem** exigir destinatários, e avisa contatos **quando existirem**.

**Ambiente:** produção `https://qrdobem.com.br` (ou staging).
**API:** migration `space_id` nullable em `panic_events` já aplicada.

## Preparação

| Código | Condição |
|--------|----------|
| A | Pet ativo, sem space_id (com saúde se possível) |
| B | Ativo, sem space e sem saúde cadastrada |
| C | Ativo, com space_id e ≥1 membro com e-mail |
| D | Object ativo |

```bash
export E2E_BASE_URL=https://qrdobem.com.br
export E2E_PANIC_CODE_PET=<code>
export E2E_PANIC_CODE_PERSON=<code>
export E2E_PANIC_CODE_OBJECT=<code>
export E2E_PANIC_CODE_NO_SPACE=<code A>
export E2E_PANIC_CODE_WITH_CONTACTS=<code C>
npx playwright test e2e/panic-public.spec.ts
```
