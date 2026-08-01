import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
      { title: "Privacidade Blindada", text: "Você fala com o benfeitor sem expor nenhum dado pessoal." }
    ],
    conclusion: "Tranquilidade de verdade é saber que, em uma emergência, seu pet tem voz e a sua família continua segura.",
    trailType: 'pet',
    cta: 'Criar meu QR de Pet'
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
    features: [],
    conclusion: "",
    trailType: 'person',
    cta: 'Criar meu QR de Pessoa'
  },
  aventura: {
    label: "Aventura",
    title: "Proteção Ativa: Resgate e Segurança para quem vive em movimento",
    intro: "Em breve: alertas de trajeto e queda. Hoje você pode criar um QR de identidade de emergência.",
    highlight: "",
    paragraphs: [],
    features: [],
    conclusion: "",
    trailType: 'person',
    cta: 'Identidade de emergência (QR)'
  },
  logistica: {
    label: "Logística e Patrimônio",
    title: "Suas encomendas e bagagens documentadas, rastreadas e protegidas.",
    intro: "Enviar um objeto de valor ou despachar uma bagagem sempre gera insegurança. Com o qrdobem, você transforma uma simples etiqueta em um dossiê digital completo do seu envio, protegendo seus bens sem expor seus dados pessoais no pacote.",
    highlight: "Ao gerar um QR Code para o seu objeto, você cria um registro no nosso sistema. Caso a bagagem seja extraviada ou a encomenda se perca, quem a encontrar escaneia o código e se comunica diretamente com você por um chat seguro, sem ter acesso ao seu nome, endereço ou telefone.",
    paragraphs: [
      {
        subtitle: "🚗 Seu veículo conectado a você. Segurança no trânsito sem expor sua identidade.",
        text: "O seu veículo está sujeito a imprevistos o tempo todo: um alarme disparado na rua, uma janela que ficou aberta, a necessidade de ser manobrado ou, no pior dos cenários, um furto. Deixar o número de telefone no painel é um risco grave à sua segurança. O qrdobem resolve isso de forma definitiva.\n\nO QR Code do qrdobem pode ser gravado diretamente nos vidros ou em peças principais do carro e da moto. Ele funciona como um canal de comunicação direto, anônimo e imediato. Se houver qualquer problema com o seu veículo estacionado, qualquer pessoa ou autoridade pode escanear o código no vidro. Você recebe o aviso no celular na mesma hora para tomar as providências necessárias."
      }
    ],
    features: [
      {
        title: "Descrição Detalhada",
        text: "Registre o conteúdo exato do pacote ou mala atrelado ao QR Code antes do envio."
      },
      {
        title: "Anexo de Documentos",
        text: "Suba notas fiscais, fotos do objeto ou documentos de transporte diretamente no sistema."
      },
      {
        title: "Declaração de Valor",
        text: "Forte indício de que o valor foi devidamente embalado e despachado, auxiliando em possíveis contestações."
      },
      {
        title: "Avisos de Urgência (Veículos)",
        text: "Alguém pode avisar que você esqueceu a luz acesa, o vidro aberto ou que o carro precisa ser realocado."
      },
      {
        title: "Recuperação Segura",
        text: "Em caso de roubo, quem encontrar o veículo notifica o sistema para você acionar a seguradora anonimamente."
      },
      {
        title: "Gravação Permanente",
        text: "A aplicação do QR Code em vidros e peças inibe o desmanche e garante que o código não seja removido."
      }
    ],
    conclusion: "",
    trailType: 'object',
    cta: 'Criar meu QR de Objeto'
  },
  familia: {
    label: "Para a sua família: Proteção Centralizada e Integrada",
    title: "Toda a sua família sob o mesmo guarda-chuva de cuidado.",
    intro: "A segurança de quem você ama não precisa ser complicada ou fragmentada em vários aplicativos diferentes. Com o qrdobem, qualquer pessoa pode criar e administrar um Grupo Familiar, assumindo a gestão da segurança de toda a casa em um único lugar.",
    highlight: "Ao centralizar o cuidado, o administrador do grupo tem o controle total sobre as configurações de emergência de cada membro, adaptando a plataforma para a realidade de cada um.",
    paragraphs: [
      {
        subtitle: "Tudo em um só aplicativo:",
        text: ""
      }
    ],
    features: [
      {
        title: "Gestão Unificada",
        text: "Concentre a proteção do seu pet, das crianças, dos idosos e dos jovens aventureiros em um único painel de controle."
      },
      {
        title: "Gerenciamento de Contatos",
        text: "Defina de forma rápida e fácil quem será acionado em cada situação. O vizinho pode ser o contato de emergência se o cachorro fugir, enquanto você e seu cônjuge recebem os alertas de trajeto dos filhos."
      },
      {
        title: "Proteção Multicaminhos",
        text: "Combine o monitoramento passivo (QR Codes nas roupas das crianças ou coleiras dos pets) com o monitoramento ativo (alertas de queda de moto ou desvio de trajeto noturno) dentro do mesmo grupo."
      }
    ],
    conclusion: "Não importa a idade ou o destino: a paz de espírito da sua família inteira fica literalmente na palma da sua mão, com a privacidade e o respeito que vocês merecem.",
    cta: "Em breve",
    disabled: true
  },
  grupo: {
    label: "Grupos e Causas",
    title: "Conectando o seu projeto a quem deseja ajudar.",
    intro: "Sabemos que manter um abrigo, uma equipe de resgate voluntário, um centro de convivência ou qualquer projeto social exige dedicação integral e, na maioria das vezes, os recursos são escassos. A sua missão é cuidar da sociedade e salvar vidas; a nossa missão é garantir que você não faça isso sozinho.\n\nSe você gerencia uma iniciativa em prol do próximo, o qrdobem é a plataforma ideal para conectar o seu trabalho a milhares de pessoas dispostas a apoiar.",
    highlight: "Não importa se o seu projeto ainda é informal. Basta o CPF de um responsável para cadastrar a sua causa. Nós oferecemos a tecnologia para criar um espaço onde os doadores podem ver a seriedade do seu trabalho e contribuir financeiramente com total segurança.",
    paragraphs: [],
    features: [
      {
        title: "Visibilidade para sua Causa",
        text: "Cadastre-se e passe a integrar nossa rede de doações. Quem busca apoiar a sua frente de atuação poderá encontrar e apadrinhar o seu projeto facilmente."
      },
      {
        title: "Captação Contínua",
        text: "Crie campanhas para necessidades específicas (medicamentos, reformas, consertos ou compra de uniformes e equipamentos) e receba apoio direto."
      },
      {
        title: "Credibilidade e Confiança",
        text: "Utilize nosso painel de transparência para mostrar aos doadores exatamente como os recursos arrecadados geram impacto real na ponta."
      }
    ],
    conclusion: "Você cuida deles. Deixe que a nossa tecnologia ajude a cuidar do seu projeto.",
    cta: "Em breve",
    disabled: true
  },
  empresa: {
    label: "Empresas e Profissionais",
    title: "Sua marca conectada, infinitas possibilidades.",
    intro: "Além de utilizar todas as nossas ferramentas de proteção e rastreamento, empresas e profissionais independentes podem ir muito além. Com o qrdobem, a nossa tecnologia de QR Codes inteligentes pode ser totalmente customizada e moldada para resolver os desafios específicos do seu nicho de mercado.",
    highlight: "O limite é a sua imaginação: nossos QR Codes podem se transformar em qualquer solução que o seu público precise, sempre com a sua marca em destaque (White-label).",
    paragraphs: [
      {
        subtitle: "Casos de Uso Inovadores",
        text: "Imagine uma farmácia que distribui nossos QR Codes aos seus clientes. O cliente escaneia a caixa do remédio, que é associada à sua conta. O nosso sistema cria automaticamente um calendário de dosagem no celular do paciente para alertá-lo nos horários corretos. Tudo isso rodando com a robustez do qrdobem, mas com a interface e a marca exclusiva da farmácia."
      },
      {
        subtitle: "Para Profissionais Independentes",
        text: "Nossa plataforma também é o motor ideal para corretores de seguros, corretores de imóveis, agentes de planos de saúde e consultores que desejam criar produtos tecnológicos para suas carteiras de clientes. Você desenha o produto, e nós entregamos a tecnologia de ponta para viabilizá-lo."
      }
    ],
    features: [
      {
        title: "Soluções Prontas",
        text: "Utilize nossa infraestrutura de resgate de pessoas, pets e rastreamento logístico imediatamente para os seus colaboradores ou clientes."
      },
      {
        title: "Customização White-label",
        text: "Desenvolvemos lógicas específicas para o seu negócio. O cliente enxerga e interage com a sua marca, enquanto nós garantimos a tecnologia de fundo."
      },
      {
        title: "Integração Inteligente",
        text: "Associe nossos códigos a sistemas de notificações, calendários, alarmes e automações nativas do dispositivo do seu usuário."
      }
    ],
    conclusion: "Transforme uma simples etiqueta em uma experiência tecnológica inesquecível para o seu cliente.",
    cta: "Em breve",
    disabled: true
  },
  doacoes: {
    label: "Doações",
    title: "Doe e ajude uma causa",
    intro: "Sua solidariedade encontra quem mais precisa. Escolha uma causa e transforme vidas com transparência e segurança.\n\nO qrdobem abriga dezenas de grupos, centros de assistência e projetos focados em cuidar de quem precisa. Se você quer fazer a diferença, mas não tem um projeto específico em mente, nós facilitamos o caminho.\n\nAbaixo, você pode escolher a causa que mais toca o seu coração. O valor doado será destinado aos grupos cadastrados em nossa plataforma que atuam diretamente nessa frente. E o mais importante: através do nosso painel de transparência, você acompanha exatamente o impacto da sua doação.",
    highlight: "",
    paragraphs: [],
    features: [
      {
        title: "🐾 Causa Animal",
        text: "Apoie abrigos independentes, protetores e iniciativas que resgatam, tratam e buscam lares seguros para animais em situação de abandono e risco."
      },
      {
        title: "👴 Idosos",
        text: "Direcione sua doação para lares de repouso, grupos de convivência e projetos que garantem dignidade, cuidado e qualidade de vida para a terceira idade."
      },
      {
        title: "🧒 Crianças PCD",
        text: "Ajude centros de cuidado e grupos de apoio que fornecem terapias, equipamentos e assistência especializada para crianças atípicas e com deficiência."
      },
      {
        title: "🧑‍🦽 Adultos PCD",
        text: "Contribua com iniciativas focadas na autonomia, reabilitação, inclusão social e fornecimento de equipamentos de mobilidade para adultos com deficiência."
      },
      {
        title: "🏥 Centros de Cuidados",
        text: "Fortaleça redes de apoio informal e centros assistenciais que atuam na linha de frente do cuidado diário de pessoas em situação de vulnerabilidade em suas comunidades."
      },
      {
        title: "🤝 Iniciativas Independentes",
        text: "Grupos e pessoas que com seu trabalho voluntário ajudam a sociedade e precisam de seu apoio."
      }
    ],
    conclusion: ""
  },
  doacoes_en: {
    label: "Donations",
    title: "Donate and support a cause",
    intro: "Your solidarity reaches those who need it most. Choose a cause and transform lives with transparency and security.\n\nThe qrdobem platform hosts dozens of groups, assistance centers, and projects focused on caring for those in need. If you want to make a difference but don't have a specific project in mind, we pave the way for you.\n\nBelow, you can choose the cause that touches your heart the most. The donated amount will be directed to registered groups on our platform that act directly on that front. Most importantly: through our transparency dashboard, you can track exactly the impact of your donation.",
    highlight: "",
    paragraphs: [],
    features: [
      {
        title: "🐾 Animal Cause",
        text: "Support independent shelters, protectors, and initiatives that rescue, treat, and find safe homes for abandoned and at-risk animals."
      },
      {
        title: "👴 Elderly Care",
        text: "Direct your donation to nursing homes, social groups, and projects that guarantee dignity, care, and quality of life for the elderly."
      },
      {
        title: "🧒 Children with Disabilities",
        text: "Help care centers and support groups that provide therapies, equipment, and specialized assistance for atypical children and those with disabilities."
      },
      {
        title: "🧑‍🦽 Adults with Disabilities",
        text: "Contribute to initiatives focused on autonomy, rehabilitation, social inclusion, and the provision of mobility equipment for adults with disabilities."
      },
      {
        title: "🏥 Care Centers",
        text: "Strengthen informal support networks and assistance centers working on the frontlines of daily care for vulnerable people in their communities."
      },
      {
        title: "🤝 Independent Initiatives",
        text: "Groups and individuals who, through volunteer work, help society and need your support."
      }
    ],
    conclusion: ""
  },
  contato: { label: "Contato", title: "Conteúdo em desenvolvimento...", intro: "", highlight: "", paragraphs: [], features: [], conclusion: "" }
};

export default function ContentArea({ activeCategory }) {
  const [language, setLanguage] = useState('pt');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Reseta o idioma sempre que o usuário muda de aba
  useEffect(() => {
    setLanguage('pt');
  }, [activeCategory]);

  const baseCategory = activeCategory || 'pessoas';
  let contentKey = baseCategory;
  if (baseCategory === 'doacoes' && language === 'en') {
    contentKey = 'doacoes_en';
  }
  
  const content = categoryContent[contentKey];

  const handleCtaClick = (e, trailType, disabled) => {
    e.preventDefault();
    if (disabled) return;
    if (trailType) {
      sessionStorage.setItem('qrdobem_trail', trailType);
      if (user) {
        navigate(`/dashboard?trail=${trailType}`);
      } else {
        navigate(`/login?trail=${trailType}`);
      }
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

        {/* Header Section */}
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

        {/* Highlight Section */}
        {content.highlight && (
          <div className="bg-brand-cream/40 p-8 rounded-3xl border-l-4 border-brand-blue shadow-sm my-4">
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-8 h-8 text-brand-blue shrink-0 mt-1" />
              <p className="text-xl font-bold text-brand-dark leading-relaxed">
                {content.highlight}
              </p>
            </div>
          </div>
        )}

        {/* Body Paragraphs */}
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

        {/* Feature List (Checkmarks) */}
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

        {/* Conclusion */}
        {content.conclusion && (
          <div className="text-center max-w-3xl mx-auto mt-4">
            <p className="text-2xl font-medium text-brand-blue italic leading-relaxed">
              "{content.conclusion}"
            </p>
          </div>
        )}

        {/* Call to Action */}
        {content.cta && (
          <div className="flex justify-center mt-6">
            <button 
              onClick={(e) => handleCtaClick(e, content.trailType, content.disabled)}
              className={`px-8 py-4 rounded-full font-bold text-xl shadow-lg transition-all ${content.disabled ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none' : 'bg-brand-olive text-white hover:bg-brand-blue hover:-translate-y-1 shadow-brand-olive/30'}`}
            >
              {content.cta}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
