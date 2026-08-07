import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Loader2, Send, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { waitlistApi, contactApi } from '../../services/api';

/**
 * ContentArea — seções de conteúdo da home, uma por trilha.
 *
 * REESCRITA DE 06/08/2026 — o motivo importa
 * As seções de Família, Grupos e Causas, Empresas e Doações diziam "em
 * desenvolvimento" e ofereciam lista de espera. Isso deixou de ser verdade
 * quando as Fases 1 a 6 foram implementadas: pedir e-mail para avisar do
 * lançamento de algo que já existe é perder o visitante no momento em que
 * ele estava mais disposto a agir.
 *
 * ESTRUTURA DE CONVERSÃO DE CADA SEÇÃO
 *   1. situação concreta que a pessoa reconhece
 *   2. como funciona, em uma frase
 *   3. prova — o que o sistema faz de fato, não promessa
 *   4. CTA principal, com verbo de ação
 *   5. CTA secundário para quem ainda não quer se cadastrar
 *
 * O passo 5 existe porque nem todo visitante está pronto para criar conta.
 * Sem uma saída intermediária (ver causas, ver o mapa), ele simplesmente
 * fecha a página.
 */

const categoryContent = {
  pets: {
    label: "Tutores de Pets",
    title: "Seu pet se perdeu? O caminho de volta não precisa expor a sua privacidade.",
    intro: "O sumiço de um pet é um dos momentos mais desesperadores para qualquer família. A primeira reação costuma ser colocar uma plaquinha na coleira com nome, telefone e endereço, ou contar com os sistemas públicos de microchipagem. Mas você já parou para pensar nos riscos de deixar seus dados pessoais expostos para qualquer pessoa que encontrar o seu animal?",
    highlight: "Com o qrdobem, você garante a segurança do seu melhor amigo e blinda a sua privacidade.",
    paragraphs: [
      {
        subtitle: "Como funciona a tecnologia a favor da vida:",
        text: "Nós geramos um QR Code vinculado a uma URL única, que pode ser aplicado na coleira do seu pet ou armazenado diretamente no microchip/transponder dele."
      },
      {
        subtitle: "",
        text: "Se o seu pet se perder, a pessoa que o encontrar só precisa escanear o código. Ela será direcionada para uma página exclusiva onde poderá se comunicar com você imediatamente, informando a localização do animal."
      },
      {
        subtitle: "O grande diferencial?",
        text: "A ponte é feita pelo nosso sistema. O benfeitor consegue falar com você na mesma hora, sem que o seu número de telefone, nome ou endereço sejam revelados. Diferente de registros governamentais ou plaquinhas comuns que mostram seus contatos, o qrdobem protege a sua identidade enquanto foca no que realmente importa: trazer o seu pet de volta para casa."
      }
    ],
    features: [
      { title: "Rápido e Direto", text: "Comunicação em tempo real entre você e quem achou seu pet." },
      { title: "Versátil", text: "Pode ser usado em tags de coleira ou chips subcutâneos." },
      { title: "Privacidade Blindada", text: "Você fala com o benfeitor sem expor nenhum dado pessoal." },
      { title: "Carteira de vacinas", text: "Histórico de vacinação sempre à mão, e visível a quem encontrar — se você quiser." },
      { title: "Ficha do animal", text: "Espécie, porte, cor e cuidados clínicos, com você escolhendo o que é público." }
    ],
    conclusion: "Tranquilidade de verdade é saber que, em uma emergência, seu pet tem voz e a sua família continua segura.",
    trailType: 'pet',
    cta: 'Criar meu QR de Pet',
    ctaSubtext: 'Leva menos de 5 minutos. Você começa com créditos gratuitos.'
  },

  pessoas: {
    label: "Pessoas",
    title: "Proteção e Privacidade para quem você ama",
    intro: "A tecnologia do qrdobem foi desenhada para oferecer socorro rápido em situações de emergência, sem expor os dados pessoais dos seus familiares. Ao invés de usar crachás com nomes, endereços ou telefones visíveis para qualquer desconhecido, você utiliza nosso sistema de QR Code aplicado discretamente em roupas, acessórios ou dispositivos de auxílio.",
    highlight: "Quando alguém encontrar seu familiar em uma situação de vulnerabilidade, o escaneamento do QR Code abre um canal de comunicação seguro. O benfeitor envia a localização e o estado da pessoa, mas nunca tem acesso aos seus dados pessoais.",
    paragraphs: [
      {
        subtitle: "🧒 Para Crianças",
        text: "Em parques, shoppings ou eventos, o risco de uma criança se perder é uma preocupação constante. Com o qrdobem aplicado em uma pulseira, etiqueta na roupa ou no tênis, você garante que, caso ela se perca, quem a encontrar possa avisar você instantaneamente. Você recebe o alerta e o local, sem que estranhos saibam o nome da criança ou o seu número de telefone."
      },
      {
        subtitle: "👴 Para Idosos",
        text: "O envelhecimento pode trazer episódios de desorientação. Se o seu familiar idoso costuma fazer caminhadas ou sair sozinho, ter um QR Code aplicado em um relógio, chaveiro ou colado na bengala é um protocolo de segurança essencial. É a forma mais digna e segura de garantir que, ao primeiro sinal de confusão, ele seja ajudado e a família seja notificada em tempo real."
      },
      {
        subtitle: "♿ Para PCDs e Pessoas com Déficit Intelectual",
        text: "A autonomia é um pilar fundamental, mas a segurança não pode ser deixada de lado. O qrdobem atua como uma \"identidade de emergência\" que pode ser fixada em cadeiras de rodas, andadores ou acessórios. Isso permite que, em qualquer necessidade de auxílio, terceiros saibam imediatamente como acionar a família ou cuidadores responsáveis, mantendo a privacidade total dos dados do usuário."
      }
    ],
    features: [
      { title: "Página de emergência", text: "Alergias a alimentos, remédios, produtos e animais visíveis a quem socorre." },
      { title: "Contato sem exposição", text: "Quem encontra fala com você pelo sistema, sem ver seu telefone." },
      { title: "Sempre com a pessoa", text: "Pulseira, etiqueta na roupa, chaveiro, bengala ou cadeira de rodas." }
    ],
    conclusion: "",
    trailType: 'person',
    cta: 'Criar meu QR de Pessoa',
    ctaSubtext: 'Leva menos de 5 minutos. Você começa com créditos gratuitos.'
  },

  aventura: {
    label: "Aventura",
    title: "Proteção Ativa: Resgate e Segurança para quem vive em movimento",
    intro: "Em breve: alertas de trajeto e queda. Hoje você já pode criar um QR de identidade de emergência para levar na trilha, na estrada ou no mar.",
    highlight: "",
    paragraphs: [],
    features: [],
    conclusion: "",
    trailType: 'person',
    cta: 'Criar identidade de emergência'
  },

  logistica: {
    label: "Logística e Patrimônio",
    title: "Suas encomendas e bagagens documentadas, rastreadas e protegidas.",
    intro: "Enviar um objeto de valor ou despachar uma bagagem sempre gera insegurança. Com o qrdobem, você aplica um QR Code no seu objeto que funciona como um canal de comunicação anônimo, protegendo seus bens sem expor seus dados pessoais na etiqueta.",
    highlight: "Ao gerar um QR Code para o seu objeto, você cria um registro no nosso sistema. Caso a bagagem seja extraviada ou a encomenda se perca, quem a encontrar escaneia o código e se comunica diretamente com você por um chat seguro, sem ter acesso ao seu nome, endereço ou telefone.",
    paragraphs: [
      {
        subtitle: "🚗 Seu veículo conectado a você. Segurança no trânsito sem expor sua identidade.",
        text: "O seu veículo está sujeito a imprevistos o tempo todo: um alarme disparado na rua, uma janela que ficou aberta, a necessidade de ser manobrado ou, no pior dos cenários, um furto. Deixar o número de telefone no painel é um risco grave à sua segurança. O qrdobem resolve isso de forma definitiva.\n\nO QR Code do qrdobem pode ser gravado diretamente nos vidros ou em peças principais do carro e da moto. Ele funciona como um canal de comunicação direto, anônimo e imediato. Se houver qualquer problema com o seu veículo estacionado, qualquer pessoa ou autoridade pode escanear o código no vidro. Você recebe o aviso no celular na mesma hora para tomar as providências necessárias."
      }
    ],
    features: [
      { title: "Descrição e Identificação", text: "Preencha as informações básicas do seu pacote ou mala atreladas ao QR Code." },
      { title: "Contato Anônimo", text: "Um chat seguro e direto entre quem encontrou o objeto e você, sem exibir seus números pessoais." },
      { title: "Avisos de Urgência (Veículos)", text: "Alguém pode avisar que você esqueceu a luz acesa, o vidro aberto ou que o carro precisa ser realocado." },
      { title: "Recuperação Segura", text: "Em caso de roubo, quem encontrar o veículo notifica o sistema para você acionar a seguradora anonimamente." },
      { title: "Cuidados no manuseio", text: "Frágil, não inverter, manter refrigerado, valor sentimental — quem manuseia vê o aviso." },
      { title: "Gravação Permanente", text: "A aplicação do QR Code em vidros e peças inibe o desmanche e garante que o código não seja removido." }
    ],
    conclusion: "",
    trailType: 'object',
    cta: 'Criar meu QR de Objeto'
  },

  // --- TRILHA 1 ---
  familia: {
    label: "Para a sua família",
    title: "Uma conta. A família inteira protegida.",
    intro: "Pai, mãe, filhos, avós, netos, noras e genros — e os pets. Sem limite de perfis. Você monta a sua família no sistema e decide quem pode cuidar de quem.",
    highlight: "O Botão de Pânico avisa a família inteira de uma vez. Instale o QR do Bem como aplicativo e ele vira alarme: sirene, vibração e alerta enviado a todos os membros, com a sua localização.",
    paragraphs: [
      {
        subtitle: "Você não gerencia sozinho",
        text: "Quem cria o grupo familiar é o administrador, e pode delegar. Sua irmã cuida dos pets, seu filho mais velho atualiza a ficha dos avós, e cada um só mexe no que você autorizou. Toda delegação fica registrada: quem concedeu o quê, e quando."
      },
      {
        subtitle: "Emergência é questão de segundos",
        text: "A leitura do QR abre uma página com o que socorre: alergias a alimentos, medicamentos, produtos e animais, condições de saúde e os contatos certos. Quem chegou primeiro sabe o que fazer — sem que o seu telefone apareça para um estranho."
      },
      {
        subtitle: "Medicação sem depender da memória",
        text: "Escaneie o código de barras da caixa do remédio. O sistema identifica o produto, sugere os horários e exporta tudo direto para a agenda do celular — Android ou iPhone. E mantém o diário de saúde de cada pessoa e de cada pet."
      }
    ],
    features: [
      { title: "Perfis ilimitados", text: "Pessoas e pets, sem teto. Você paga pelos QR Codes que usar, não por quem cadastrar." },
      { title: "Botão de Pânico", text: "Alarme no celular e alerta simultâneo para toda a família, com localização." },
      { title: "Árvore da família", text: "Pais, filhos, cônjuges, netos, noras e genros — inclusive segundos casamentos." },
      { title: "Verificação em duas etapas", text: "Opcional, com Google Authenticator, Authy ou Microsoft Authenticator." },
      { title: "Diário de saúde", text: "Consultas, exames, sintomas, pressão, glicemia, vacinas — de gente e de bicho." },
      { title: "Agenda de remédios", text: "Código de barras, horários sugeridos e exportação para a agenda nativa." }
    ],
    conclusion: "Proteger a família não deveria depender de lembrar de tudo, o tempo todo.",
    trailType: 'family',
    cta: 'Criar a proteção da minha família',
    ctaSubtext: 'Cadastro gratuito. Você começa com créditos para os primeiros QR Codes.'
  },

  // --- TRILHA 2 ---
  grupo: {
    label: "Grupos e Causas",
    title: "Sua causa não precisa de CNPJ para receber apoio.",
    intro: "Anjos do Asfalto, protetores independentes, grupos de resgate, mães que cuidam de crianças no bairro. Se você lidera uma iniciativa com o seu próprio CPF, o QR do Bem é para você.",
    highlight: "Arrecadar é metade. A outra metade é provar o que foi feito — e é isso que faz alguém doar de novo. Sua página pública mostra, lado a lado, quanto entrou e o que aconteceu com o dinheiro.",
    paragraphs: [
      {
        subtitle: "Sem CNPJ, sem burocracia",
        text: "Você cadastra a causa com o seu CPF e começa. Se precisar de recibo dedutível para os doadores, pode se vincular a uma OSCIP parceira como projeto guarda-chuva — o recibo sai em nome dela, com validade fiscal de verdade."
      },
      {
        subtitle: "QR Codes em lote, prontos para imprimir",
        text: "Precisa de 200 etiquetas para uma campanha? Gera o lote de uma vez e imprime uma folha A4 com 24 etiquetas por página, já com as guias de corte. Sem cadastrar uma por uma."
      },
      {
        subtitle: "Prestação de contas com foto",
        text: "Publique o que foi feito: a ração comprada, o resgate concluído, a reforma entregue. Toda imagem passa por revisão antes de aparecer — o que protege quem aparece na foto e a credibilidade da sua causa."
      }
    ],
    features: [
      { title: "Cadastro por CPF", text: "Pessoa física liderando iniciativa autônoma. Sem exigência de CNPJ." },
      { title: "Vitrine pública", text: "História, meta, arrecadação e prestação de contas numa página só." },
      { title: "QR em lote", text: "Até 500 códigos de uma vez, com folha de impressão pronta." },
      { title: "Projeto guarda-chuva", text: "Vincule-se a uma OSCIP e viabilize dedução fiscal para quem doa." },
      { title: "Prova social moderada", text: "Fotos e vídeos dos resultados, revisados antes de publicar." },
      { title: "Doação recorrente", text: "Quem apoia pode contribuir todo mês, automaticamente." }
    ],
    conclusion: "Quem doa uma vez precisa de motivo para doar de novo. O motivo é ver o resultado.",
    trailType: 'cause',
    cta: 'Cadastrar minha causa',
    ctaSubtext: 'Gratuito e sem CNPJ.',
    secondaryCta: { label: 'Ver causas já cadastradas', to: '/causas' }
  },

  // --- TRILHA 3 ---
  empresa: {
    label: "Empresas e Profissionais",
    title: "A prova de que foi entregue, com quem, quando e onde.",
    intro: "Entrega de EPI, liberação de material para terceirizado, encomenda na portaria do condomínio. Três problemas, uma solução: leitura do QR Code mais a senha de quem recebeu — e o comprovante fica registrado.",
    highlight: "O registro é imutável e traz quem confirmou, o que foi entregue, o horário, o local e se a senha foi conferida. É o documento que a sua empresa apresenta numa auditoria ou num processo trabalhista.",
    paragraphs: [
      {
        subtitle: "🦺 Certificação de entrega de EPI",
        text: "O funcionário escaneia o QR do equipamento e digita a senha dele. Fica registrado o item, o número do CA, a quantidade e o estado de entrega — com data, hora e IP. Nada de lista de papel que some na hora que a fiscalização chega."
      },
      {
        subtitle: "📦 Logística e terceirizados",
        text: "Liberação de material com identificação de quem retirou, para qual empresa e com que destino. O terceirizado não precisa de conta no sistema: a matrícula dele e a senha bastam."
      },
      {
        subtitle: "🏢 Condomínios e portaria",
        text: "Encomenda recebida, registrada e entregue ao morador com confirmação e foto. Acaba a discussão sobre o pacote que \"chegou avariado\" ou que \"nunca foi entregue\"."
      },
      {
        subtitle: "🔌 API aberta e a sua marca na tela",
        text: "Integre com o sistema que a sua empresa já usa: API REST versionada, com chave própria e limite por parceiro. E a página que o cliente final vê pode levar a sua logomarca e as suas cores — inclusive com a sua promoção no link, quando você patrocina os códigos."
      }
    ],
    features: [
      { title: "API REST documentada", text: "Chave por parceiro, escopos e limite de requisições próprio." },
      { title: "White-label", text: "Sua logomarca e suas cores na página que o cliente final abre." },
      { title: "Lote patrocinado", text: "Compre códigos, patrocine a página do cliente e leve a sua promoção junto." },
      { title: "Comprovante imutável", text: "Sem edição depois do registro. Comprovante alterável não comprova nada." },
      { title: "Exportação para a contabilidade", text: "CSV com o consumo, pronto para o seu contador." },
      { title: "Casos sob medida", text: "EPI, logística e portaria já vêm prontos; outros casos são configuração." }
    ],
    conclusion: "",
    cta: 'Falar sobre integração',
    action: 'contact',
    interest: 'empresa'
  },

  // --- TRILHA 4 ---
  doacoes: {
    label: "Doações",
    title: "Doe sabendo exatamente onde o seu dinheiro chegou.",
    intro: "Escolha a causa, doe por Pix ou cartão, e acompanhe. Quem recebe confirma o recebimento no sistema — com senha própria — e pode agradecer com foto. Você vê.",
    highlight: "Nenhum repasse é dado como concluído sem a confirmação de quem recebeu. Não é promessa de transparência: é uma trava no sistema. Sem a contraprova do beneficiário, o repasse fica pendente e aparece como pendente.",
    paragraphs: [
      {
        subtitle: "Como o dinheiro anda",
        text: "Você escolhe a causa. A doação vai para a OSCIP gestora do QR do Bem, que operacionaliza a distribuição e responde pela prestação de contas. Cada repasse tem origem, destino e comprovação registrados."
      },
      {
        subtitle: "Quem recebe tem voz",
        text: "O beneficiário tem uma página própria onde pede o que precisa — alimento, remédio, uma consulta, um conserto. E é por essa mesma página que ele confirma o recebimento e envia o agradecimento."
      },
      {
        subtitle: "Quem não tem intimidade com celular também participa",
        text: "Quem não navega sozinho acessa o sistema por um tutor identificado. A confirmação feita pelo tutor fica registrada como tal — nunca como se fosse a própria pessoa. É o que separa um registro auditável de uma assinatura em branco."
      },
      {
        subtitle: "Apadrinhamento",
        text: "Você pode apoiar uma causa em geral ou apadrinhar uma pessoa específica, com uma contribuição mensal. Nesse caso, você acompanha aquela história de perto."
      }
    ],
    features: [
      { title: "Pix, cartão e Cartão Cidadão", text: "Pagamento pelo Mercado Pago, com a segurança deles." },
      { title: "Doação recorrente", text: "Contribua todo mês, e cancele quando quiser, em um clique." },
      { title: "Confirmação obrigatória", text: "Quem recebe confirma com senha. Sem isso, o repasse não fecha." },
      { title: "Agradecimento com foto", text: "Prova social enviada por quem recebeu, revisada antes de publicar." },
      { title: "Doação anônima", text: "Se preferir, seu nome não aparece na vitrine da causa." },
      { title: "Apadrinhamento", text: "Apoie uma pessoa específica e acompanhe a história dela." }
    ],
    conclusion: "Desconfiança não se resolve com discurso. Resolve-se com comprovante.",
    cta: 'Doar agora',
    ctaRoute: '/doacoes',
    secondaryCta: { label: 'Conhecer as causas antes', to: '/causas' }
  },

  doacoes_en: {
    label: "Donations",
    title: "Donate and see exactly where your money landed.",
    intro: "Choose a cause, donate by Pix or card, and follow through. The person who receives it confirms the delivery in the system — with their own password — and can say thanks with a photo. You see it.",
    highlight: "No transfer is marked as completed without confirmation from the person who received it. It is not a transparency promise: it is a lock in the system.",
    paragraphs: [],
    features: [],
    conclusion: "",
    cta: 'Donate now',
    ctaRoute: '/doacoes',
    secondaryCta: { label: 'Browse the causes', to: '/causas' }
  },

  contato: {
    label: "Contato",
    title: "Fale com a nossa equipe",
    intro: "Ficaremos felizes em ouvir você. Envie sua mensagem, dúvida ou sugestão e retornaremos o mais breve possível.",
    highlight: "",
    paragraphs: [],
    features: [],
    conclusion: "",
    cta: "Enviar mensagem",
    disabled: false,
    action: 'contact'
  }
};

export default function ContentArea({ activeCategory, hasCauses = false }) {
  const [language, setLanguage] = useState('pt');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [formData, setFormData] = useState({ email: '', name: '', message: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    setLanguage('pt');
    setShowWaitlist(false);
    setShowContact(false);
    setStatus('');
    setFormData({ email: '', name: '', message: '' });
  }, [activeCategory]);

  const baseCategory = activeCategory || 'pessoas';
  let contentKey = baseCategory;
  if (baseCategory === 'doacoes' && language === 'en') {
    contentKey = 'doacoes_en';
  }

  const content = categoryContent[contentKey];

  /**
   * O CTA secundário que aponta para a listagem de causas só vale se
   * houver causa publicada. Sem isso, o visitante clicaria em "ver causas"
   * e cairia numa página vazia — que é o oposto de conversão.
   */
  const secondaryCta = content.secondaryCta?.to === '/causas' && !hasCauses
    ? null
    : content.secondaryCta;

  const handleCtaClick = (e) => {
    e.preventDefault();

    if (content.disabled) return;

    if (content.action === 'waitlist') {
      setShowWaitlist(true);
      setShowContact(false);
      return;
    }

    if (content.action === 'contact') {
      setShowContact(true);
      setShowWaitlist(false);
      return;
    }

    // Rota direta (ex.: doações). Visitante sem conta vai para o login e
    // volta ao destino depois de entrar — perder o destino no meio do
    // caminho é a forma mais comum de abandonar a conversão.
    if (content.ctaRoute) {
      navigate(user ? content.ctaRoute : `/login?next=${encodeURIComponent(content.ctaRoute)}`);
      return;
    }

    if (content.trailType) {
      sessionStorage.setItem('qrdobem_trail', content.trailType);
      navigate(user ? `/painel?trail=${content.trailType}` : `/login?trail=${content.trailType}`);
    }
  };

  const submitWaitlist = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await waitlistApi.join(formData.email, content.interest || 'geral');
      setStatus('success');
      setFormData({ ...formData, email: '' });
    } catch (err) {
      setStatus('error');
    }
  };

  const submitContact = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await contactApi.send({
        name: formData.name,
        email: formData.email,
        message: formData.message,
        source: content.interest || 'contato'
      });
      setStatus('success');
      setFormData({ email: '', name: '', message: '' });
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div id="content-area" className="w-full bg-white py-16 px-6 relative z-10 transition-all duration-500">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">

        {baseCategory === 'doacoes' && (
          <div className="flex justify-start md:justify-end">
             <div className="inline-flex rounded-full shadow-sm" role="group">
               <button
                  onClick={() => setLanguage('pt')}
                  className={`px-5 py-2 text-sm font-bold rounded-l-full border border-brand-blue transition-colors ${language === 'pt' ? 'bg-brand-blue text-white' : 'bg-transparent text-brand-blue hover:bg-brand-blue/10'}`}
                >
                 🇧🇷 Português
               </button>
               <button
                  onClick={() => setLanguage('en')}
                  className={`px-5 py-2 text-sm font-bold rounded-r-full border border-brand-blue border-l-0 transition-colors ${language === 'en' ? 'bg-brand-blue text-white' : 'bg-transparent text-brand-blue hover:bg-brand-blue/10'}`}
                >
                 🇺🇸 English
               </button>
             </div>
          </div>
        )}

        {/* Cabeçalho */}
        <div className="text-left md:text-center max-w-4xl mx-auto">
          <span className="text-brand-blue font-bold uppercase tracking-widest text-sm mb-4 block">
            {content.label}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-brand-dark mb-6 leading-tight">
            {content.title}
          </h2>
          {content.intro && (
            <p className="text-lg md:text-xl text-brand-dark/70 font-medium leading-relaxed">
              {content.intro}
            </p>
          )}
        </div>

        {/* CTA no topo, para quem já se convenceu pelo título e não vai
            rolar a página inteira até o botão do rodapé. */}
        {content.cta && !showWaitlist && !showContact && (
          <div className="flex flex-col items-center gap-2 -mt-4">
            <button
              onClick={handleCtaClick}
              className="px-8 py-4 rounded-full font-bold text-lg shadow-lg bg-brand-olive text-white hover:bg-brand-blue hover:-translate-y-1 shadow-brand-olive/30 transition-all flex items-center gap-2"
            >
              {content.cta}
              <ArrowRight className="w-5 h-5" />
            </button>
            {content.ctaSubtext && (
              <span className="text-sm text-brand-dark/50">{content.ctaSubtext}</span>
            )}
          </div>
        )}

        {/* Destaque */}
        {content.highlight && (
          <div className="bg-brand-bg p-8 rounded-3xl border-l-4 border-brand-blue shadow-sm my-4">
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-8 h-8 text-brand-blue shrink-0 mt-1" />
              <p className="text-xl font-bold text-brand-dark leading-relaxed">
                {content.highlight}
              </p>
            </div>
          </div>
        )}

        {/* Corpo */}
        {content.paragraphs && content.paragraphs.length > 0 && (
          <div className="flex flex-col gap-8 max-w-4xl mx-auto text-lg text-brand-dark/80 leading-relaxed">
            {content.paragraphs.map((p, idx) => (
              <div key={idx}>
                {p.subtitle && (
                  <h3 className="font-bold text-xl text-brand-dark mb-2">{p.subtitle}</h3>
                )}
                <p className="whitespace-pre-line">{p.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recursos */}
        {content.features && content.features.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
            {content.features.map((feature, idx) => (
              <div key={idx} className="bg-white border border-gray-100 shadow-sm p-6 rounded-2xl flex flex-col gap-3 hover:shadow-md transition-shadow">
                <CheckCircle2 className="w-8 h-8 text-brand-olive" />
                <h4 className="font-bold text-brand-dark text-lg">{feature.title}</h4>
                <p className="text-sm text-brand-dark/70 leading-relaxed">{feature.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Conclusão */}
        {content.conclusion && (
          <div className="text-center max-w-3xl mx-auto mt-4">
            <p className="text-2xl font-medium text-brand-blue italic leading-relaxed">
              "{content.conclusion}"
            </p>
          </div>
        )}

        {/* CTA final + saída intermediária para quem ainda não quer criar conta */}
        {content.cta && !showWaitlist && !showContact && (
          <div className="flex flex-col items-center gap-3 mt-2">
            <button
              onClick={handleCtaClick}
              className={`px-10 py-5 rounded-full font-bold text-xl shadow-lg transition-all flex items-center gap-2 ${
                content.disabled
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                  : 'bg-brand-olive text-white hover:bg-brand-blue hover:-translate-y-1 shadow-brand-olive/30'
              }`}
            >
              {content.cta}
              <ArrowRight className="w-5 h-5" />
            </button>

            {content.ctaSubtext && (
              <span className="text-sm text-brand-dark/50">{content.ctaSubtext}</span>
            )}

            {secondaryCta && (
              <Link
                to={secondaryCta.to}
                className="text-brand-blue font-bold underline underline-offset-4 hover:opacity-80 transition"
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        )}

        {showWaitlist && (
          <form onSubmit={submitWaitlist} className="mt-8 max-w-md mx-auto bg-gray-50 p-6 rounded-2xl shadow-sm border border-gray-100">
            <h4 className="text-xl font-bold text-brand-dark mb-4 text-center">Inscreva-se na lista de espera</h4>
            {status === 'success' ? (
              <div className="text-brand-olive font-medium text-center py-4 bg-green-50 rounded-xl">Inscrição realizada com sucesso! Avisaremos você.</div>
            ) : (
              <div className="flex flex-col gap-4">
                <input required type="email" placeholder="Seu e-mail" className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                <button disabled={status === 'loading'} type="submit" className="bg-brand-blue text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 disabled:opacity-50 transition-colors">
                  {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Avisem-me'}
                </button>
                {status === 'error' && <p className="text-red-500 text-sm text-center font-medium">Ocorreu um erro. Tente novamente.</p>}
              </div>
            )}
          </form>
        )}

        {showContact && (
          <form onSubmit={submitContact} className="mt-8 max-w-xl mx-auto bg-gray-50 p-6 rounded-2xl shadow-sm border border-gray-100">
            <h4 className="text-xl font-bold text-brand-dark mb-4 text-center">Envie uma mensagem</h4>
            {status === 'success' ? (
              <div className="text-brand-olive font-medium text-center py-4 bg-green-50 rounded-xl">Sua mensagem foi enviada com sucesso! Logo retornaremos.</div>
            ) : (
              <div className="flex flex-col gap-4">
                <input required type="text" placeholder="Seu nome" className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <input required type="email" placeholder="Seu e-mail" className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                <textarea required placeholder="Como podemos ajudar?" rows={4} className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue resize-none" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} />
                <button disabled={status === 'loading'} type="submit" className="bg-brand-blue text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 disabled:opacity-50 transition-colors">
                  {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4"/> Enviar Mensagem</>}
                </button>
                {status === 'error' && <p className="text-red-500 text-sm text-center font-medium">Ocorreu um erro. Tente novamente.</p>}
              </div>
            )}
          </form>
        )}

      </div>
    </div>
  );
}
