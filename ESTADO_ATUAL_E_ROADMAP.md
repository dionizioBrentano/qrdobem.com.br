# QR do Bem — Frontend React: Estado Atual e Roadmap

**Atualizado em:** 01/07/2026  
**Stack:** React 18 + Vite, Tailwind CSS, Firebase REST API (sem SDK)  
**Deploy:** Build no Windows (`npm run build`), upload da pasta `dist/` para `~/qrdobem.com.br/` via CPanel  
**API:** https://api.qrdobem.com.br/api  
**REGRA:** Alterações uma por vez, testar, confirmar, próxima.

---

## 1. ESTRUTURA DE ARQUIVOS ATUAL

```
frontend-react/
├── .env                           ← Firebase config + API URL
├── src/
│   ├── main.jsx                   ← Entry point
│   ├── App.jsx                    ← Rotas (BrowserRouter)
│   ├── context/
│   │   └── AuthContext.jsx        ← Estado global de autenticação
│   ├── services/
│   │   ├── firebase.js            ← Firebase REST API (login, register, refresh, logout)
│   │   └── api.js                 ← Cliente HTTP para backend (auth, entities, admin, messages)
│   ├── components/
│   │   ├── ProtectedRoute.jsx     ← Redirect para /login se não autenticado
│   │   ├── Layout.jsx             ← Navbar + Outlet (Dashboard, Messages, Admin)
│   │   └── EntityFormModal.jsx    ← Modal de criação de QR Code
│   └── pages/
│       ├── LoginPage.jsx          ← Login/registro com email+senha
│       ├── OtpVerifyPage.jsx      ← Verificação de email via código OTP
│       ├── DashboardPage.jsx      ← Lista de entidades + métricas + org selector
│       ├── MessagesPage.jsx       ← Inbox de mensagens recebidas
│       ├── AdminPage.jsx          ← Painel superadmin (tenants + criar lotes)
│       └── PublicEntityPage.jsx   ← Página pública do QR Code (para quem lê)
```

---

## 2. CONFIGURAÇÃO (.env)

```env
VITE_API_URL=https://api.qrdobem.com.br/api
VITE_FIREBASE_API_KEY=AIzaSyBpvh_RBN1oujAiPqUmXpHWEKwxgkICJSo
VITE_FIREBASE_AUTH_DOMAIN=qr-do-bem.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=qr-do-bem
VITE_FIREBASE_STORAGE_BUCKET=qr-do-bem.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=431626927511
VITE_FIREBASE_APP_ID=1:431626927511:web:067b0cdf27bdd0e6c358d2
```

---

## 3. O QUE ESTÁ COMPLETO E FUNCIONANDO

### 3.1 Autenticação Firebase via REST API
- `firebase.js` usa `identitytoolkit.googleapis.com` diretamente (sem Firebase JS SDK — ~800KB a menos no bundle)
- Login com email/senha: `signInWithPassword`
- Registro com email/senha: `signUp`
- Refresh token: `securetoken.googleapis.com/v1/token`
- Armazena em `localStorage`: `firebase_token`, `firebase_refresh`, `firebase_uid`, `firebase_email`
- **NÃO existe login com Google ainda** — só email+senha

### 3.2 AuthContext
- Restaura sessão ao carregar (verifica token → chama `/auth/me` → se 401, tenta refresh)
- Provê: `user`, `tenant`, `loading`, `login()`, `register()`, `logout()`
- `tenant` vem do backend (não do Firebase)

### 3.3 Rotas
| Rota | Componente | Autenticada | Descrição |
|---|---|---|---|
| `/login` | LoginPage | Não | Login/registro email+senha |
| `/verify` | OtpVerifyPage | Não | Verificação OTP do email |
| `/q/:uniqueCode` | PublicEntityPage | Não | Página pública do QR Code |
| `/dashboard` | DashboardPage | Sim | Entidades + métricas |
| `/messages` | MessagesPage | Sim | Inbox de mensagens |
| `/admin` | AdminPage | Sim (superadmin) | Painel administrativo |
| `*` | → `/dashboard` | — | Redirect padrão |

### 3.4 Funcionalidades
- **Dashboard:** Seletor de organização, lista de entidades (tabela), métricas (créditos, QRs ativos, total), botão "Novo QR Code", aviso de perfil incompleto
- **EntityFormModal:** Formulário de criação com tipo (pessoa/pet/objeto), nome, telefone, email, info médica, info adicional → envia para POST /entities
- **MessagesPage:** Lista de mensagens (novas vs lidas), botão marcar como lida, link para Google Maps (se geolocalização)
- **AdminPage:** Métricas globais, formulário para criar lote de créditos, tabela de tenants. Só acessível se `tenant.role === 'superadmin'`
- **PublicEntityPage:** Mostra dados públicos da entidade (nome, tipo, organização, info médica, info adicional, custom_attributes) + formulário de mensagem com captura opcional de geolocalização
- **OtpVerifyPage:** Envio de código OTP para email → verificação do código de 6 dígitos

### 3.5 api.js — Endpoints utilizados

```javascript
// Auth
authApi.sendOtp(email, firebase_uid)    // POST /auth/send-otp
authApi.verifyOtp(firebase_uid, code)    // POST /auth/verify-otp
authApi.me()                             // GET /auth/me

// Entities
entitiesApi.list(organizationId?)        // GET /entities?organization_id=X
entitiesApi.create(data)                 // POST /entities
entitiesApi.show(uniqueCode)             // GET /entities/:uniqueCode

// Admin
adminApi.getTenants()                    // GET /admin/tenants
adminApi.addQuota(tenantId, amount)      // POST /admin/tenants/:id/add-quota
adminApi.createBatch(data)               // POST /admin/batches
adminApi.toggleBatch(batchId)            // POST /admin/batches/:id/toggle

// Messages
messagesApi.list()                       // GET /messages
messagesApi.markAsRead(id)               // POST /messages/:id/read
messagesApi.sendPublic(uniqueCode, data) // POST /entities/:uniqueCode/messages
```

---

## 4. O QUE PRECISA MUDAR / IMPLEMENTAR

### 4.1 PRIORIDADE: Login com Google

O `LoginPage.jsx` atualmente só tem email+senha. Precisa de botão "Entrar com Google".

**Como funcionar via REST API (sem SDK):**

O Firebase REST API para login com Google usa o endpoint `signInWithIdp`. O fluxo:
1. Abrir popup/redirect para `accounts.google.com/o/oauth2/v2/auth` com client_id do projeto Firebase
2. Receber o `id_token` do Google na callback
3. Enviar para `identitytoolkit.googleapis.com/v1/accounts:signInWithIdp` com o token

**Adicionar em `firebase.js`:**
```javascript
export async function firebaseGoogleLogin() {
  // 1. Abre popup para Google OAuth
  const clientId = '431626927511-XXXXXXXXXX.apps.googleusercontent.com'; // pegar no Firebase Console
  const redirectUri = window.location.origin + '/login'; // ou callback page
  const scope = 'email profile';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&prompt=select_account`;
  
  // Opção A: popup
  const popup = window.open(authUrl, 'google-login', 'width=500,height=600');
  // ... escutar postMessage do popup com o token
  
  // Opção B: redirect (mais simples)
  window.location.href = authUrl;
  // ... no retorno, pegar token do hash fragment
  
  // 2. Com o access_token do Google, trocar por token Firebase:
  const data = await firebaseRequest('signInWithIdp', {
    postBody: `access_token=${googleAccessToken}&providerId=google.com`,
    requestUri: window.location.origin,
    returnSecureToken: true,
    returnIdpCredential: true,
  });
  
  // 3. Salvar no localStorage (mesmo que email+senha)
  localStorage.setItem('firebase_token', data.idToken);
  localStorage.setItem('firebase_refresh', data.refreshToken);
  localStorage.setItem('firebase_uid', data.localId);
  localStorage.setItem('firebase_email', data.email);
  
  return { uid: data.localId, email: data.email, token: data.idToken };
}
```

**NOTA:** Para pegar o Web Client ID do Google, ir em Firebase Console → Authentication → Sign-in providers → Google → Web SDK configuration → Web client ID. O formato é `431626927511-XXXXX.apps.googleusercontent.com`.

**Adicionar no LoginPage.jsx:** Um botão "Entrar com Google" que chama `firebaseGoogleLogin()` do AuthContext.

### 4.2 PRIORIDADE: ProfilePage (NOVA)

Página de perfil com coleta progressiva de dados. O backend terá um `ProfileController` com endpoint `GET /profile` que retorna os dados atuais do tenant e o que falta.

**Criar `src/pages/ProfilePage.jsx`:**
- Mostra dados atuais do perfil (nome, email, telefone, CPF, endereço)
- Indica visualmente o que falta para cada gate:
  - Gate 1 (comprar): email verificado (OTP) + CPF + telefone
  - Gate 2 (usar QR): endereço completo + termo
- Formulário para preencher cada campo
- Validação de CPF no frontend (cosmética, backend valida de verdade)
- Validação de CEP com API ViaCEP (preenchimento automático de endereço)
- Botão "Verificar email" que redireciona para /verify

**Adicionar endpoints em `api.js`:**
```javascript
export const profileApi = {
  get: () => request('/profile'),
  update: (data) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  addDocument: (data) => request('/profile/documents', { method: 'POST', body: JSON.stringify(data) }),
};
```

**Adicionar rota em `App.jsx`:**
```jsx
<Route path="/profile" element={<ProfilePage />} />
```

**Adicionar link no `Layout.jsx`:**
```jsx
<Link to="/profile" className="hover:text-emerald-200 transition">Perfil</Link>
```

### 4.3 Atualizar DashboardPage — Gates

Atualmente o DashboardPage mostra um aviso genérico quando `profile_status === 'incomplete'`. Precisa:

1. **Substituir o aviso genérico** por um aviso específico dizendo o que falta:
   - "Complete seu perfil para comprar QR Codes: falta verificar email, CPF e telefone."
   - "Complete seu endereço para ativar QR Codes."
2. **Bloquear o botão "Novo QR Code"** se o tenant não tiver os requisitos do Gate 2 (endereço + profile_status === 'active')
3. **Mostrar por que está bloqueado** — tooltip ou texto explicativo

O endpoint `GET /profile` do backend retornará `can_purchase`, `can_create_entity`, `missing_for_purchase[]`, `missing_for_entity[]`.

### 4.4 Atualizar EntityFormModal — Termo de Responsabilidade

Antes de criar a entidade, o modal precisa:

1. **Mostrar o termo de responsabilidade** correspondente ao tipo selecionado (pessoa/pet/objeto)
2. **Checkbox obrigatório** de aceite do termo
3. **Enviar `term_accepted: true` e `term_type`** no payload para o backend
4. O backend registra o aceite com IP, timestamp e versão do termo

**Textos dos termos (drafts a definir):**
- **Objeto:** "Declaro que sou responsável pelo objeto cadastrado..."
- **Pet:** "Declaro que sou responsável pelo animal cadastrado..."
- **Pessoa:** "Declaro que sou legalmente responsável pela pessoa cadastrada (tutela, curatela, filiação)..."

### 4.5 OtpVerifyPage — Ajustes

Atualmente pede o email separadamente. Ajustar:
1. **Pré-preencher** com o email do usuário logado (salvo no localStorage como `firebase_email`)
2. **Após verificação**, atualizar o `tenant` no AuthContext (chamar `/auth/me` novamente)
3. **Redirecionar para /profile** em vez de /dashboard, para o usuário continuar preenchendo dados

### 4.6 AdminPage — Correção

O backend tem um bug no `AdminController.getTenants()` que usa `Tenant::withCount('entities')`, mas a relação `entities()` foi removida do model Tenant. Isso **vai quebrar** a tabela de tenants no admin.

**Quando o backend for corrigido** (a query vai passar a contar entities via organizations), a resposta pode mudar de formato. Verificar se os campos `t.quota` e `t.used` na tabela do AdminPage ainda correspondem à resposta.

### 4.7 Layout.jsx — Link do Perfil

Adicionar link "Perfil" na navbar, entre "Mensagens" e o nome do usuário:
```jsx
<Link to="/profile" className="hover:text-emerald-200 transition">Perfil</Link>
```

### 4.8 PublicEntityPage — Filtro por Status

Quando o backend adicionar `entities.status`, o endpoint público `show()` vai retornar 404 para entities com `status !== 'active'`. O frontend já trata 404, então funciona sem mudança. Mas considerar mostrar mensagem diferente para `pending_term` vs `suspended` se o backend decidir retornar status no erro.

---

## 5. DECISÕES DE ARQUITETURA (CONTEXTO COMPLETO)

### 5.1 Firebase é APENAS autenticação

O Firebase serve para UMA coisa: validar que o usuário é quem diz ser (email+senha ou Google). Ele devolve um token JWT. Acabou.

**O `email_verified` do Firebase é IGNORADO.** A validação de email é feita pelo OTP do sistema (Brevo SMTP). Razão: o dono do projeto não confia no Firebase para validação de dados.

### 5.2 Sem fricção

O login não exige NADA além de email e senha (ou Google). O usuário entra no dashboard imediatamente com `profile_status = 'incomplete'`. Pode navegar, ver mensagens, explorar. NÃO pode comprar créditos nem criar entidades até preencher os dados necessários.

### 5.3 Duas Gates

**Gate 1 — Pode comprar QR Codes (`profile_status = 'active'`):**
- Email verificado via OTP do sistema (email_verified_at preenchido)
- CPF cadastrado e válido
- Telefone cadastrado

**Gate 2 — Pode usar QR Codes (criar entidade):**
- Tudo do Gate 1
- Endereço completo
- Termo de responsabilidade aceito (por tipo de entidade)

### 5.4 Coleta progressiva

Os dados são coletados conforme necessidade, não como barreira:
1. Login → email (vem do Firebase)
2. Perfil (voluntário) → nome, telefone
3. Verificação de email → OTP via Brevo
4. Compra via PIX → CPF
5. Compra via Cartão → CPF + endereço
6. Uso do QR Code → endereço + termo

### 5.5 Rastreabilidade

Todo QR Code registrado tem:
- Quem cadastrou (CPF do tenant)
- Quando (timestamp)
- De onde (IP no audit log e no aceite do termo)
- Termo aceito (tipo, versão, timestamp, IP)

Isso protege o QR do Bem juridicamente.

### 5.6 Validação dupla

- **Frontend:** Validação cosmética (UX) — mostra erros instantâneos
- **Backend:** Validação de segurança (autoritativa) — rejeita dados inválidos

O frontend NUNCA confia nos seus próprios dados. Sempre envia para o backend validar.

---

## 6. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1 — Login com Google
- [ ] Obter Web Client ID no Firebase Console
- [ ] Implementar `firebaseGoogleLogin()` em `firebase.js`
- [ ] Adicionar botão "Entrar com Google" no `LoginPage.jsx`
- [ ] Adicionar `loginWithGoogle()` no `AuthContext.jsx`
- [ ] Testar login com Google no site

### Fase 2 — ProfilePage
- [ ] Criar `src/pages/ProfilePage.jsx`
- [ ] Adicionar `profileApi` em `api.js`
- [ ] Adicionar rota `/profile` em `App.jsx`
- [ ] Adicionar link "Perfil" no `Layout.jsx`
- [ ] Implementar formulário de CPF com validação
- [ ] Implementar busca de CEP via ViaCEP
- [ ] Implementar indicadores visuais de Gate 1 e Gate 2

### Fase 3 — Gates no Dashboard
- [ ] Buscar dados de profile ao carregar dashboard
- [ ] Bloquear botão "Novo QR Code" se Gate 2 não atingido
- [ ] Mostrar mensagens específicas do que falta

### Fase 4 — Termos de Responsabilidade
- [ ] Criar componente `TermAcceptance.jsx`
- [ ] Integrar no `EntityFormModal.jsx`
- [ ] Mostrar termo correto por tipo de entidade
- [ ] Enviar `term_accepted` e `term_type` no payload

### Fase 5 — Ajustes
- [ ] Atualizar `OtpVerifyPage.jsx` (pré-preencher email, redirect para /profile)
- [ ] Verificar AdminPage quando backend for corrigido
- [ ] Build final e deploy

---

## 7. MERCADO PAGO (FUTURO)

A integração com Mercado Pago vai exigir uma página de checkout. Os dados do pagador que o MP precisa já são coletados pelas nossas gates:

- **PIX:** email + nome + CPF → já temos no Gate 1
- **Cartão:** email + nome + CPF + endereço → já temos no Gate 2
- **Dados do cartão:** coletados pelo formulário do Mercado Pago (PCI compliance deles). Nós NUNCA armazenamos número de cartão.

**Fricção adicional:** ZERO. Os dados que o MP exige são exatamente os que já coletamos.

Criar:
- [ ] `src/pages/CheckoutPage.jsx` — seleção de créditos, escolha de pagamento (PIX/cartão)
- [ ] Integração com Mercado Pago JS SDK (frontend) para tokenizar cartão
- [ ] Endpoint backend `POST /checkout` para processar pagamento

---

## 8. REFERÊNCIA RÁPIDA

### Build & Deploy
```bash
# No Windows, na pasta frontend-react:
npm run build

# Upload da pasta dist/ para ~/qrdobem.com.br/ via CPanel File Manager
# IMPORTANTE: o .htaccess na raiz deve redirecionar tudo para index.html (SPA)
```

### Firebase Console
- Projeto: qr-do-bem
- URL: https://console.firebase.google.com/project/qr-do-bem
- Authentication → Sign-in providers → Email/Password (habilitado), Google (habilitar se não estiver)

### Cores do tema
- Primária: emerald-600 (#059669)
- Hover: emerald-700 (#047857)
- Background: emerald-50 (#ecfdf5) → teal-100 (#ccfbf1)
- Erro: red-50/red-700
- Aviso: amber-50/amber-700
- Sucesso: emerald-50/emerald-700
