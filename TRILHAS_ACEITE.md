# Roteiro de Teste Ponta a Ponta: Trilhas QR do Bem

Este documento consolida o roteiro de testes unificado para as três trilhas de entidades (Pet, Pessoa, Objeto), validando o fluxo principal desde o CTA até a caixa de mensagens.

## 📌 Premissas e Núcleo Compartilhado
- **Núcleo Único:** As funcionalidades de **mensagens, exibição do QR Code, modais de sucesso e perfil (onboarding)** formam o *núcleo comum* da aplicação. Elas não foram ramificadas. 
- A diferenciação por "trilha" afeta **apenas** o tipo de entidade salvo no backend (`type: 'pet' | 'person' | 'object'`), a indicação do nome da trilha em andamento no banner e as labels de exibição.

## 🛠️ Pré-requisitos
- **API no Ar:** O backend deve estar operante e respondendo.
- **Onboarding/Credits:** A organização do usuário de teste deve ter créditos disponíveis (`quota > 0`), e o perfil deve ter os dados obrigatórios de onboarding preenchidos (se não tiver, o roteiro cobrirá a etapa de checklist).

---

## 🧪 Fluxo de Teste Reutilizável (Ponta a Ponta)

O fluxo abaixo deve ser executado para **cada uma** das trilhas: `Pet`, `Person` e `Object`.

### 1. Home e CTA
- Acessar a home da aplicação.
- Clicar no CTA principal (Ex: "Criar meu QR de Pet" / "Pessoa" / "Objeto").
- **Validação:** A URL deve carregar o contexto da trilha (ex: `/login?trail=pet`) ou a trilha deve ser salva no `sessionStorage`.

### 2. Login / Cadastro
- Realizar login (ou criar nova conta).
- **Validação:** Ao entrar, o usuário deve ser redirecionado ao `/dashboard`, mantendo a trilha escolhida. Um banner verde "Trilha em andamento: QR de [Pet/Pessoa/Objeto]" deve aparecer no dashboard.

### 3. Checklist de Onboarding (Se Aplicável)
- Se o perfil estiver incompleto, tentar clicar em "Criar meu QR".
- **Validação:** O botão deve estar bloqueado. Deve aparecer um quadro em amarelo ("Para criar seu QR você precisa:") listando apenas os requisitos faltantes, com links de redirecionamento para o `/profile` ou `/verify`.

### 4. Criação do QR Code
- Com perfil completo e créditos disponíveis, clicar no CTA do banner "Criar meu QR de [Trilha]" ou no botão "+ Novo QR Code".
- **Validação:** O `EntityFormModal` deve abrir com a aba do tipo (`Tipo: Pet/Pessoa/Objeto`) **já selecionada corretamente** de acordo com a trilha.
- Preencher os dados de Nome, Telefone, Email, Informações e aceitar o termo.
- Clicar em "Registrar QR Code".

### 5. Sucesso e Página Pública
- **Validação:** O modal exibirá "Registro criado" e opções neutras de compartilhamento.
- Clicar no botão "Abrir página pública" (ou acessar a URL gerada).
- **Validação:** A página pública (whitelabel) abrirá exibindo o formulário de contato anônimo para quem "encontrou" o QR.

### 6. Envio de Mensagem Anônima
- Simular ser um "Benfeitor" que encontrou o QR.
- Preencher o formulário na página pública (Nome de quem achou, contato, mensagem e opcionalmente localização).
- Enviar.

### 7. Inbox Unificada
- Retornar ao Dashboard como o dono do QR e clicar no link/botão "Ver mensagens" do modal de sucesso, ou acessar o menu `/messages`.
- **Validação:** A nova mensagem deve constar na inbox, marcada como "Nova".
- O item da lista deve exibir o badge da entidade (`Pet`, `Pessoa` ou `Objeto`).
- A Inbox não tem ramificações; atende a qualquer tipo de entidade.

---

## 🚫 O que NÃO testar neste fluxo
As seguintes ferramentas estão em desenvolvimento e foram declaradas como indisponíveis/desabilitadas:
- **Doações (Grupos e Causas):** Sistema de captação financeira para projetos sociais e ONGs.
- **Gestão Familiar Avançada:** Configurações multicanal de administração de emergência (hoje a criação é feita de forma individual no painel principal).
- **Aventura Ativa (Alertas Automáticos):** Alertas de desvio de trajeto e queda de veículos.
- **Chat em Tempo Real / WebSockets:** O sistema usa recarregamento tradicional ou polling de inbox, não há socket em tempo real ativo no momento.
