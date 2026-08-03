import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Loader2, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { waitlistApi, contactApi } from '../../services/api';

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
    intro: "Enviar um objeto de valor ou despachar uma bagagem sempre gera insegurança. Com o qrdobem, você aplica um QR Code no seu objeto que funciona como um canal de comunicação anônimo, protegendo seus bens sem expor seus dados pessoais na etiqueta.",
    highlight: "Ao gerar um QR Code para o seu objeto, você cria um registro no nosso sistema. Caso a bagagem seja extraviada ou a encomenda se perca, quem a encontrar escaneia o código e se comunica diretamente com você por um chat seguro, sem ter acesso ao seu nome, endereço ou telefone.",
    paragraphs: [
      {
        subtitle: "🚗 Seu veículo conectado a você. Segurança no trânsito sem expor sua identidade.",
        text: "O seu veículo está sujeito a imprevistos o tempo todo: um alarme disparado na rua, uma janela que ficou aberta, a necessidade de ser manobrado ou, no pior dos cenários, um furto. Deixar o número de telefone no painel é um risco grave à sua segurança. O qrdobem resolve isso de forma definitiva.\n\nO QR Code do qrdobem pode ser gravado diretamente nos vidros ou em peças principais do carro e da moto. Ele funciona como um canal de comunicação direto, anônimo e imediato. Se houver qualquer problema com o seu veículo estacionado, qualquer pessoa ou autoridade pode escanear o código no vidro. Você recebe o aviso no celular na mesma hora para tomar as providências necessárias."
      }
    ],
    features: [
      {
        title: "Descrição e Identificação",
        text: "Preencha as informações básicas do seu pacote ou mala atreladas ao QR Code."
      },
      {
        title: "Contato Anônimo",
        text: "Um chat seguro e direto entre quem encontrou o objeto e você, sem exibir seus números pessoais."
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
    label: "Para a sua família",
    title: "Proteção da família.",
    intro: "A proteção da família garante que você tenha vários QR Codes (para pessoas e pets) na mesma conta. Uma gestão familiar avançada e unificada estará em breve no nosso roadmap.",
    highlight: "",
    paragraphs: [],
    features: [],
    conclusion: "",
    cta: "Começar proteção da família",
    disabled: false,
    trailType: 'family'
  },
  grupo: {
    label: "Grupos e Causas",
    title: "Em desenvolvimento...",
    intro: "Sabemos que manter um abrigo, uma equipe de resgate ou um projeto social exige dedicação. A nossa funcionalidade dedicada para gestão de causas e grupos está atualmente em desenvolvimento.",
    highlight: "Inscreva-se na nossa lista de espera para ser avisado sobre o lançamento.",
    paragraphs: [],
    features: [],
    conclusion: "",
    cta: "Avise-me por e-mail",
    disabled: false,
    action: 'waitlist',
    interest: 'grupo'
  },
  empresa: {
    label: "Empresas e Profissionais",
    title: "Parceria comercial em breve",
    intro: "Empresas podem utilizar as nossas trilhas atuais de pessoas, pets e objetos livremente. Em breve, lançaremos parcerias comerciais mais aprofundadas e funcionalidades dedicadas.",
    highlight: "Quer saber mais sobre como utilizar o QR do Bem na sua empresa ou ser avisado sobre o lançamento para empresas?",
    paragraphs: [],
    features: [],
    conclusion: "",
    cta: "Avise-me por e-mail",
    disabled: false,
    action: 'waitlist',
    interest: 'empresa'
  },
  doacoes: {
    label: "Doações",
    title: "Apoie causas reais em breve",
    intro: "A funcionalidade de doações diretas na plataforma está em desenvolvimento. Nosso objetivo é conectar a sua solidariedade a quem mais precisa com transparência e segurança.",
    highlight: "Se você quer ser avisado assim que o painel de doações estiver disponível, inscreva-se abaixo.",
    paragraphs: [],
    features: [],
    conclusion: "",
    cta: "Avise-me por e-mail",
    disabled: false,
    action: 'waitlist',
    interest: 'doacoes'
  },
  doacoes_en: {
    label: "Donations",
    title: "Donate to real causes soon",
    intro: "Direct donations feature is under development. We want to connect your solidarity with transparency.",
    highlight: "Subscribe to our waitlist below.",
    paragraphs: [],
    features: [],
    conclusion: "",
    cta: "Notify me",
    disabled: false,
    action: 'waitlist',
    interest: 'doacoes'
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

export default function ContentArea({ activeCategory }) {
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

  const handleCtaClick = (e, trailType, disabled, action) => {
    e.preventDefault();
    if (disabled) return;
    
    if (action === 'waitlist') {
      setShowWaitlist(true);
      setShowContact(false);
      return;
    }
    if (action === 'contact') {
      setShowContact(true);
      setShowWaitlist(false);
      return;
    }

    if (trailType) {
      sessionStorage.setItem('qrdobem_trail', trailType);
      if (user) {
        navigate(`/painel?trail=${trailType}`);
      } else {
        navigate(`/login?trail=${trailType}`);
      }
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
        {content.cta && !showWaitlist && !showContact && (
          <div className="flex justify-center mt-6">
            <button 
              onClick={(e) => handleCtaClick(e, content.trailType, content.disabled, content.action)}
              className={`px-8 py-4 rounded-full font-bold text-xl shadow-lg transition-all ${content.disabled ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none' : 'bg-brand-olive text-white hover:bg-brand-blue hover:-translate-y-1 shadow-brand-olive/30'}`}
            >
              {content.cta}
            </button>
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
