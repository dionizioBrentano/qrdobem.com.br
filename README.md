# QR do Bem — Frontend

SPA em React 19 + Vite + Tailwind 4. Consome a API em `https://api.qrdobem.com.br/api`.

Autenticação pelo Firebase via REST (`identitytoolkit.googleapis.com`), sem o SDK JS — economiza cerca de 800 KB no bundle.

---

## Rodando em outra máquina

```bash
git clone https://github.com/dionizioBrentano/qrdobem.com.br
cd qrdobem.com.br
npm install
npm run dev
```

O `.env` já está versionado: contém apenas a configuração pública do Firebase e a URL da API — os mesmos valores que saem compilados dentro do `dist/`. Não há segredo ali.

---

## Estrutura

```
src/
├── context/AuthContext.jsx    Sessão, refresh de token, tenant vindo do backend
├── services/
│   ├── firebase.js            Login, registro e refresh via REST
│   └── api.js                 Cliente HTTP do backend
├── components/                Layout, rota protegida, modal de criação
└── pages/                     Login, OTP, Dashboard, Mensagens, Admin, Página pública
```

Rotas: `/` `/login` `/verify` `/q/:uniqueCode` (públicas) e `/dashboard` `/messages` `/admin` (protegidas).

---

## Build e deploy

```bash
npm run build
git add dist && git commit -m "build" && git push
```

Depois: cPanel → Git Version Control → Deploy HEAD Commit.

O `dist/` é versionado de propósito — a hospedagem compartilhada não roda `npm run build`, então o repositório precisa carregar o resultado pronto.

O `.htaccess` redireciona tudo para `index.html`. Sem ele, recarregar uma rota como `/q/{codigo}` retorna 404.
