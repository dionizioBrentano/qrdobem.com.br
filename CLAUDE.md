# Regras — Front QR do Bem
0. CODIFIQUE. Nada de diagnóstico, auditoria ou exploração. Não rode git status, git log, git diff, npm ls, which. Abra só os arquivos que o passo mandar alterar. Não peça confirmação no meio.
1. Todo request passa por src/services/api.js. Não invente endpoint.
2. Nada de style inline. Use as classes Tailwind já usadas no projeto.
3. Não altere arquivo fora do escopo do passo. Não refatore por estética.
4. Não deixe console.log de debug nem código comentado morto.
5. Modal: max-h-[90vh] overflow-y-auto. Não declare componente dentro do render.
6. Não instale dependência. Não rode npm run dev nem teste.
7. NÃO MEXER: PublicEntityPage e /q/{code}, PanicButton, PublicPanicButton, MessagesPage, qr_caption.
8. Fecho: npm run build, git add ., git commit, git push. Sem deploy.
