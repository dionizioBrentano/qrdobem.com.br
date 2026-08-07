import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LifeBuoy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/layout/TopBar';
import DiamondHero from '../components/layout/DiamondHero';
import MainMenu from '../components/layout/MainMenu';
import Footer from '../components/layout/Footer';
import { causesApi } from '../services/api';

/**
 * HelpPage — central de ajuda.
 *
 * REESCRITA DE 06/08/2026: era um placeholder ("estamos preparando este
 * guia") acessível só depois do login. Duas coisas erradas: o rodapé do
 * site público aponta para cá, e quem ainda não tem conta é justamente
 * quem mais precisa entender como funciona antes de se cadastrar.
 *
 * A página agora é PÚBLICA e responde às perguntas que aparecem de fato:
 * o que é preciso para criar um QR, por que o sistema pede CPF, como
 * funciona o Botão de Pânico, e o que acontece com quem lê o código.
 *
 * O conteúdo descreve só o que existe. Nada de "em breve" — promessa em
 * página de ajuda vira reclamação no suporte.
 *
 * REVISÃO DE 07/08/2026: o texto anterior descrevia um fluxo de cadastro
 * que não existe (nome/CPF/telefone na tela de registro). O fluxo real é
 * cadastro por link mágico (só e-mail), depois senha, depois CPF/telefone/
 * apelido/endereço no perfil — checado direto no código-fonte
 * (RegisterPage.jsx, RegisterController.php, EntityController.php) para
 * eliminar qualquer divergência entre o que a Ajuda promete e o que o
 * sistema faz.
 */

const SECTIONS = [
  {
    id: 'primeiros-passos',
    title: 'Como criar meu primeiro QR Code',
    steps: [
      'Na tela de cadastro, informe só o seu e-mail. Você recebe um link de confirmação por e-mail, válido por 24 horas.',
      'Abra o link recebido e defina sua senha. Ao confirmar, você já entra direto no painel — o e-mail é considerado verificado porque só você tinha acesso a ele.',
      'No painel, complete seu perfil com apelido, CPF e telefone. Enquanto esses três dados não estiverem preenchidos, o sistema ainda não libera a criação de QR Codes.',
      'Ainda no perfil, informe seu endereço completo. É o segundo requisito antes de criar qualquer QR Code.',
      'Com o perfil completo, você já tem 3 créditos gratuitos, válidos por 30 dias, suficientes para criar seus primeiros QR Codes.',
      'Escolha o tipo do QR Code — pessoa, pet ou objeto — preencha os dados pedidos e aceite o termo de responsabilidade correspondente. O QR Code é gerado na hora.',
    ],
  },
  {
    id: 'o-que-aparece',
    title: 'O que aparece para quem lê o meu QR Code',
    body: [
      'Seu telefone, seu e-mail e seu endereço nunca aparecem na página pública do QR Code — em nenhuma hipótese.',
      'Quem escaneia vê apenas: o nome, as informações que você marcou como públicas, e um formulário de mensagem.',
      'A conversa acontece dentro do próprio sistema. Quem encontrou escreve uma mensagem (pode informar um apelido, e recebe um código de 4 caracteres para retomar a conversa depois em outro aparelho), e você responde pelo painel — nenhum dos dois vê o contato direto do outro.',
      'Para pessoas: cada campo de saúde (tipo sanguíneo, alergias, condições crônicas, cirurgias relevantes, nome do cuidador, entre outros) tem um botão "Tornar público" individual, desligado por padrão. Dois campos nunca aparecem na leitura comum, mesmo que você tente: medicações de uso contínuo e uso de substâncias de risco — só ficam visíveis se alguém declarar emergência.',
      'Para pets: espécie sempre aparece; porte, cor, castração, características e vacinas só aparecem se marcados como públicos.',
      'Para objetos: o texto público (até 200 caracteres) e os avisos de manuseio marcados sempre aparecem; a descrição privada, só se você tornar pública. Não é permitido colocar telefone ou e-mail no texto público — o sistema bloqueia.',
    ],
  },
  {
    id: 'emergencia',
    title: 'Declaração de emergência',
    body: [
      'Disponível só para QR Codes de pessoas. Quem encontra alguém em situação de emergência pode clicar em "Declarar Emergência" e informar apenas o próprio CPF.',
      'Ao confirmar, a página passa a exibir todas as informações de saúde cadastradas — inclusive as que nunca aparecem na leitura comum, como medicações de uso contínuo e o contato do cuidador.',
      'Você, responsável pelo QR Code, é notificado por e-mail assim que a emergência é declarada.',
      'Essa liberação dura 24 horas a partir da declaração.',
      'O CPF de quem declarou fica registrado de forma criptografada. Só a administração do sistema pode revelá-lo, e essa consulta fica auditada — é o que separa o socorro legítimo da curiosidade.',
    ],
  },
  {
    id: 'panico',
    title: 'Botão de Pânico',
    body: [
      'Existem duas versões: uma no seu painel (para você acionar) e outra na página pública do QR Code de pessoa (para quem encontra alguém em risco).',
      'No painel: dois toques para confirmar. Ao acionar, o alarme sonoro e a vibração começam no seu próprio aparelho imediatamente — mesmo que a internet falhe no momento. Sua localização é capturada e todos os membros do seu espaço familiar são avisados por e-mail.',
      'Na página pública: também dois toques para confirmar ("Avisar a família"). Aqui não há sirene — o barulho atrapalharia o socorro — e o sistema não revela quantos ou quais familiares foram avisados, para não expor a rede familiar a um estranho. A tela também lembra: em risco de vida, ligue 192 (SAMU) ou 190 (Polícia).',
      'Para o alarme funcionar mesmo sem internet, instale o QR do Bem como aplicativo: abra o site no navegador do celular e escolha "Adicionar à tela inicial".',
    ],
  },
  {
    id: 'familia',
    title: 'Família: vários perfis, uma conta',
    body: [
      'Na Home, o card "Família" (botão "Criar a proteção da minha família") leva ao cadastro ou login já na trilha de família. Ao entrar, o painel abre com os botões "QR de Pessoa" e "QR de Pet" para cadastrar os primeiros perfis — cada QR consome 1 crédito, como qualquer outro.',
      'Se quiser reunir todo mundo num espaço só, o painel oferece "Criar espaço família": dê um nome e confirme. Não gasta crédito nem exige CNPJ — o espaço é o contêiner que organiza as pessoas e para onde vai o alerta do Botão de Pânico. Enquanto você não criar, os QR Codes de pessoa e pet funcionam normalmente.',
      'Com pelo menos 2 perfis cadastrados, aparece no painel o link "Árvore da família", que abre a página de vínculos. Lá você escolhe quem, o tipo de relação e de quem — com uma prévia da frase antes de salvar, para não inverter quem é responsável por quem.',
      'A árvore aceita mais de um responsável legal, segundos casamentos e guarda compartilhada. O que ela impede é vínculo duplicado, uma pessoa vinculada a si mesma, e ciclos (por exemplo, A ser "pai" de B e B ser "pai" de A ao mesmo tempo).',
    ],
  },
  {
    id: 'contas',
    title: 'Tenho mais de uma conta com o mesmo CPF',
    body: [
      'Isso é permitido. Contas diferentes, com e-mails diferentes, podem pertencer à mesma pessoa.',
      'Quando você cadastra o CPF no seu perfil, o sistema agrupa automaticamente as suas contas. Em "Minhas contas" você vê todas e troca entre elas.',
    ],
  },
  {
    id: 'causas',
    title: 'Quero cadastrar minha causa',
    body: [
      'Não é preciso CNPJ. Na Home, o card "Grupos e Causas" tem o botão "Cadastrar minha causa", que leva ao cadastro ou login já na trilha de causa.',
      'Ao entrar no painel, aparece o banner "Configurar minha causa" — clique nele para abrir o painel da causa. Se o seu perfil ainda estiver incompleto, complete o cadastro (apelido, CPF, telefone e endereço) antes: criar uma causa exige o perfil ativo, e a própria tela mostra o link para completá-lo.',
      'Se você ainda não tem nenhuma causa, o painel abre com o formulário "Criar minha causa": só o nome é obrigatório; chamada curta, cidade e UF são opcionais. Confirme em "Criar causa".',
      'Criada a causa, preencha a vitrine: chamada curta e história são obrigatórias para publicar; categoria, cidade, meta em reais e prestação de contas são complementos. Enquanto a chamada e a história não estiverem preenchidas, a página fica despublicada.',
      'Ao publicar, a causa passa a aparecer na lista pública em "Causas" (o mesmo lugar do botão "Ver causas já cadastradas" da Home). Fotos e vídeos enviados passam por moderação antes de aparecer na vitrine — proteção para quem aparece nas imagens e para a credibilidade da causa.',
      'Ainda no painel da causa, você pode gerar QR Codes em lote para a campanha (até 500 por vez) e vincular a causa a uma OSCIP parceira maior, para quem precisar de recibo dedutível — o vínculo só pode ser criado pela OSCIP, não pela causa sozinha.',
    ],
  },
  {
    id: 'doacoes',
    title: 'Como funcionam as doações',
    body: [
      'Doar não exige conta. Você se identifica na própria doação (nome, e-mail e CPF — dados que o meio de pagamento pede) e autoriza o uso desses dados para o pagamento, o recibo e a conciliação. Se já tiver conta e estiver logado, esses campos são preenchidos pelo seu perfil. O recibo chega no e-mail informado.',
      'Você escolhe o valor (mínimo R$ 1), a causa (ou deixa em aberto, "onde for mais necessário") e a forma de pagamento: Pix, cartão de crédito ou Cartão Cidadão. A doação avulsa dispensa login; a doação mensal recorrente (por cartão) exige conta.',
      'A causa escolhida é registrada como destino da doação, não como recebedora direta: o valor vai para a OSCIP gestora do QR do Bem, que faz a distribuição e responde pela prestação de contas e emissão do recibo.',
      'Sobre o valor bruto da doação incide uma taxa operacional de 12%, destinada à OSCIP gestora do QR do Bem. É essa taxa que mantém a plataforma, emite o recibo, analisa as causas, dá suporte e divulga o trabalho. O custo do meio de pagamento (Pix ou cartão) é separado e discriminado à parte, conforme a operadora.',
      'Antes de confirmar, você vê exatamente quanto é taxa e quanto chega à causa. Se preferir, marque "que o valor digitado vá 100% para a causa": nesse caso você assume a taxa operacional e o custo do pagamento por cima do valor doado. Também pode somar uma contribuição voluntária ao QR do Bem, separada dos 12%.',
      'Esta é uma doação solidária com recibo da OSCIP. Ela NÃO reduz o Imposto de Renda como os incentivos da Lei Rouanet, do Fundo da Criança e do Adolescente (FIA) ou de Incentivo ao Esporte — esses exigem um projeto de lei homologado, que não é o caso aqui. Quando um projeto assim for homologado, o selo e o número do projeto passam a aparecer na página da doação.',
      'Para empresa tributada pelo lucro real, a doação com recibo da OSCIP pode, em geral, ser lançada como despesa dedutível de até 2% do lucro operacional — o resultado da atividade-fim da empresa antes do Imposto de Renda. Nos demais regimes (Simples Nacional, lucro presumido) esse abatimento específico normalmente não se aplica. Confirme sempre com o contador do doador.',
      'A doação só é confirmada como paga depois da confirmação do pagamento; antes disso, aparece como pendente. Você pode doar anonimamente ou autorizar que seu nome / razão social apareça em "Quem apoia esta causa".',
    ],
  },
  {
    id: 'creditos',
    title: 'Créditos e pagamento',
    body: [
      'Cada QR Code criado consome um crédito de um lote ativo.',
      'Ao completar seu perfil (e-mail verificado, apelido, CPF, telefone), você recebe automaticamente 3 créditos gratuitos, válidos por 30 dias.',
      'Se você se cadastrou a partir de uma conversa com o dono de outro QR Code, ganha 1 QR Code grátis, válido por 3 meses. Quando a conversa original for marcada como resolvida pelo outro tutor, você ganha mais 1 QR Code, válido por 1 ano.',
      'Créditos adicionais são comprados pelo painel, com Pix ou cartão, através do Mercado Pago. Créditos comprados não expiram.',
      'Quando você tem mais de um lote de créditos ativo, o sistema sempre consome primeiro o lote que vence mais cedo.',
    ],
  },
];

export default function HelpPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState('primeiros-passos');
  const [hasCauses, setHasCauses] = useState(false);

  /**
   * Mesma consulta da HomePage: o MainMenu só mostra o link "Causas"
   * quando existe ao menos uma causa publicada.
   */
  useEffect(() => {
    let cancelled = false;

    causesApi.list()
      .then((res) => {
        if (!cancelled) setHasCauses((res.causes || []).length > 0);
      })
      .catch(() => {
        if (!cancelled) setHasCauses(false);
      });

    return () => { cancelled = true; };
  }, []);

  /**
   * O cabeçalho da Home (DiamondHero e MainMenu) troca a seção de conteúdo
   * por estado local — algo que só existe lá. Aqui, escolher uma trilha
   * significa voltar para a Home naquela seção, usando o parâmetro de URL
   * que a HomePage já lê.
   */
  const handleCategorySelect = (id) => {
    navigate(id === 'contato' ? '/?contato=1' : `/?trilha=${id}`);
  };

  return (
    <div className="w-full min-h-screen bg-brand-bg font-sans m-0 p-0 flex flex-col">
      {/* Cabeçalho idêntico ao da Home: os MESMOS componentes, na mesma
          ordem. A Ajuda é uma página do site, não um ambiente à parte. */}
      <TopBar onCategorySelect={handleCategorySelect} />
      <DiamondHero activeCategory={null} onCategorySelect={handleCategorySelect} />
      <MainMenu
        activeCategory={null}
        onCategorySelect={handleCategorySelect}
        hasCauses={hasCauses}
      />

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-brand-blue flex items-center gap-2">
            <LifeBuoy className="w-6 h-6" />
            Central de Ajuda
          </h1>
          <p className="text-gray-600 mt-1">
            As dúvidas mais comuns sobre o QR do Bem, respondidas direto.
          </p>
        </header>

        <div className="space-y-3">
          {SECTIONS.map((section) => {
            const isOpen = openId === section.id;

            return (
              <div
                key={section.id}
                className={`border rounded-xl overflow-hidden shadow-sm transition-colors ${
                  isOpen ? 'border-brand-blue/30 bg-white' : 'border-brand-blue/20 bg-brand-blue-soft'
                }`}
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : section.id)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left font-bold text-gray-900 bg-brand-blue-soft hover:brightness-95 transition"
                  aria-expanded={isOpen}
                >
                  {section.title}
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-brand-blue transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-gray-700 leading-relaxed">
                    {section.steps ? (
                      <ol className="space-y-3 list-decimal list-outside pl-5">
                        {section.steps.map((step, index) => (
                          <li key={index} className="pl-1">{step}</li>
                        ))}
                      </ol>
                    ) : (
                      <div className="space-y-3">
                        {section.body.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-brand-bg border border-brand-blue/20 rounded-xl p-5">
          <h2 className="font-bold text-gray-900 mb-1">Não encontrou o que procurava?</h2>
          <p className="text-sm text-gray-700 mb-3">
            Escreva para a nossa equipe. Respondemos por e-mail.
          </p>
          <Link
            to="/?contato=1"
            className="inline-block bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-5 py-2 rounded-lg text-sm transition"
          >
            Falar com a equipe
          </Link>
        </div>

        {/* O destino do "voltar" depende de onde a pessoa estava: quem não
            tem conta veio do rodapé do site, e mandar para o painel só
            resultaria em redirecionamento para o login. */}
        <div className="mt-6">
          <Link to={user ? '/painel' : '/'} className="text-brand-blue hover:underline font-medium">
            {user ? 'Voltar ao painel' : 'Voltar ao início'}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
