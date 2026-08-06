import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LifeBuoy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
 */

const SECTIONS = [
  {
    id: 'primeiros-passos',
    title: 'Como criar meu primeiro QR Code',
    body: [
      'Crie sua conta com e-mail e senha. Você entra no painel na hora, sem precisar preencher nada antes.',
      'Para criar um QR Code, o sistema pede três coisas: e-mail verificado por código, CPF e telefone. É o que garante que cada QR Code tenha um responsável identificável — sem isso, qualquer pessoa poderia criar páginas públicas anônimas.',
      'Depois, informe o endereço e aceite o termo de responsabilidade do tipo escolhido (pessoa, pet ou objeto). Aí é só preencher os dados e o QR Code é gerado.',
      'Você começa com créditos gratuitos. Cada QR Code criado consome um crédito.',
    ],
  },
  {
    id: 'o-que-aparece',
    title: 'O que aparece para quem lê o meu QR Code',
    body: [
      'Nunca o seu telefone, e-mail ou endereço. Quem escaneia vê apenas o que você marcou como público e um formulário para falar com você.',
      'A conversa passa pelo nosso sistema: a pessoa que encontrou consegue avisar onde está, e você responde — sem que nenhum dos dois veja o contato do outro.',
      'Em cada campo de saúde você escolhe se é público ou não. Alguns nunca aparecem na leitura comum: medicações de uso contínuo e o contato do cuidador.',
    ],
  },
  {
    id: 'emergencia',
    title: 'Declaração de emergência',
    body: [
      'Quem encontra a pessoa pode declarar uma emergência informando o próprio CPF. Nesse momento, e só nesse, a página passa a mostrar todos os dados de saúde — inclusive os restritos.',
      'O CPF de quem declarou fica registrado e só pode ser revelado pela administração do sistema, com registro de quem consultou. É o que separa o socorro legítimo da curiosidade.',
    ],
  },
  {
    id: 'panico',
    title: 'Botão de Pânico',
    body: [
      'Instale o QR do Bem como aplicativo: abra o site no navegador do celular e escolha "Adicionar à tela inicial".',
      'Com o app instalado, o Botão de Pânico do painel dispara um alarme no próprio aparelho — sirene e vibração — e avisa todos os membros da sua família, com a sua localização.',
      'O alarme toca mesmo sem internet. O aviso à família depende de conexão; o alarme local, não.',
      'São necessários dois toques para acionar. Alarme disparado por engano tira a credibilidade do alerta de verdade.',
    ],
  },
  {
    id: 'familia',
    title: 'Família: vários perfis, uma conta',
    body: [
      'Não há limite de perfis. Você cadastra pessoas e pets na mesma conta e monta a árvore da família: pais, filhos, cônjuges, netos, noras e genros.',
      'Quem cria o grupo é o administrador e pode delegar. Você escolhe quem pode cadastrar, quem pode editar e quem só visualiza — e toda delegação fica registrada.',
      'A verificação em duas etapas é opcional e funciona com Google Authenticator, Authy ou Microsoft Authenticator.',
    ],
  },
  {
    id: 'contas',
    title: 'Tenho mais de uma conta com o mesmo CPF',
    body: [
      'Isso é permitido. Contas diferentes, com e-mails diferentes, podem pertencer à mesma pessoa.',
      'Quando você cadastra o CPF, o sistema agrupa automaticamente as suas contas. Em "Minhas contas" você vê todas e troca entre elas.',
      'Você nunca precisa digitar um CPF para ver esses vínculos — e ninguém consegue consultar os vínculos de outra pessoa informando o CPF dela.',
    ],
  },
  {
    id: 'causas',
    title: 'Quero cadastrar minha causa',
    body: [
      'Não é preciso CNPJ. Se você lidera uma iniciativa com o seu CPF, pode cadastrar a causa e receber apoio.',
      'A sua página pública mostra a história, a meta, o quanto já foi arrecadado e a prestação de contas — com fotos dos resultados.',
      'Toda imagem passa por revisão antes de aparecer, o que protege quem está na foto e a credibilidade da causa.',
      'Se precisar que os doadores tenham recibo dedutível, é possível se vincular a uma OSCIP parceira. O recibo sai em nome dela.',
    ],
  },
  {
    id: 'doacoes',
    title: 'Como funcionam as doações',
    body: [
      'Você escolhe a causa e doa por Pix, cartão de crédito ou Cartão Cidadão. Pode doar uma vez ou todo mês.',
      'A doação vai para a OSCIP gestora do QR do Bem, que faz a distribuição e responde pela prestação de contas.',
      'Quem recebe confirma o recebimento no sistema, com senha própria. Enquanto não confirmar, o repasse continua aparecendo como pendente — não existe forma de marcar como entregue sem essa confirmação.',
      'Você pode doar anonimamente: nesse caso seu nome não aparece na página da causa.',
    ],
  },
  {
    id: 'creditos',
    title: 'Créditos e pagamento',
    body: [
      'Cada QR Code criado consome um crédito. Ao completar o cadastro, você recebe créditos gratuitos para começar.',
      'Créditos adicionais são comprados pelo painel, com Pix ou cartão, através do Mercado Pago.',
      'Lotes de crédito podem ter validade. O sistema consome sempre o lote que vence primeiro.',
    ],
  },
];

export default function HelpPage() {
  const { user } = useAuth();
  const [openId, setOpenId] = useState('primeiros-passos');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <LifeBuoy className="w-6 h-6" />
          Central de Ajuda
        </h1>
        <p className="text-gray-600 mt-1">
          As dúvidas mais comuns sobre o QR do Bem.
        </p>
      </header>

      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const isOpen = openId === section.id;

          return (
            <div key={section.id} className="border border-gray-200 rounded-xl bg-white overflow-hidden">
              <button
                onClick={() => setOpenId(isOpen ? null : section.id)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left font-bold text-gray-900 hover:bg-gray-50 transition"
                aria-expanded={isOpen}
              >
                {section.title}
                <ChevronDown
                  className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-3 text-gray-700 leading-relaxed">
                  {section.body.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-brand-cream/40 border border-brand-blue/20 rounded-xl p-5">
        <h2 className="font-bold text-gray-900 mb-1">Não encontrou o que procurava?</h2>
        <p className="text-sm text-gray-700 mb-3">
          Escreva para a nossa equipe. Respondemos por e-mail.
        </p>
        <Link
          to="/?contato=1"
          className="inline-block bg-brand-blue text-white font-bold px-5 py-2 rounded-lg text-sm"
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
  );
}
