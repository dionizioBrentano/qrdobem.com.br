/**
 * Termo de responsabilidade exibido antes de registrar um QR Code.
 *
 * A versão precisa bater com a que o backend grava em tenant_term_acceptances
 * (hoje '1.0', definida em EntityController::store). Se o texto mudar, suba a
 * versão nos dois lugares — o registro do aceite perde o sentido se a versão
 * gravada não corresponder ao texto que a pessoa realmente leu.
 *
 * Os textos abaixo são um ponto de partida e merecem revisão jurídica antes
 * de entrar em produção de verdade.
 */

export const TERM_VERSION = '1.0';

const TERMS = {
  person: {
    title: 'Termo de responsabilidade — Pessoa',
    body: [
      'Declaro que sou a própria pessoa cadastrada ou seu representante legal (por filiação, tutela ou curatela), e que tenho autorização para registrar estes dados.',
      'Declaro que as informações são verdadeiras e que me comprometo a mantê-las atualizadas.',
      'Estou ciente de que os dados marcados como públicos ficarão visíveis para qualquer pessoa que ler o QR Code, e que informações sensíveis de saúde só devem ser incluídas se eu julgar necessário para socorro.',
      'Autorizo o QR do Bem a armazenar e exibir esses dados exclusivamente para a finalidade de localização, identificação e contato em situações de emergência.',
    ],
  },
  pet: {
    title: 'Termo de responsabilidade — Pet',
    body: [
      'Declaro que sou o tutor responsável pelo animal cadastrado.',
      'Declaro que as informações são verdadeiras e que me comprometo a mantê-las atualizadas.',
      'Estou ciente de que o telefone e os dados de contato ficarão acessíveis a quem ler o QR Code, para viabilizar a devolução do animal.',
      'Autorizo o QR do Bem a armazenar e exibir esses dados exclusivamente para a finalidade de identificação e contato.',
    ],
  },
  object: {
    title: 'Termo de responsabilidade — Objeto',
    body: [
      'Declaro que sou o proprietário do objeto cadastrado ou que tenho autorização do proprietário para registrá-lo.',
      'Declaro que as informações são verdadeiras e que me comprometo a mantê-las atualizadas.',
      'Estou ciente de que os dados de contato ficarão acessíveis a quem ler o QR Code, para viabilizar a devolução do objeto.',
      'Autorizo o QR do Bem a armazenar e exibir esses dados exclusivamente para a finalidade de identificação e contato.',
    ],
  },
};

export default function TermAcceptance({ type, accepted, onChange }) {
  const term = TERMS[type] || TERMS.object;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b">
        <p className="text-sm font-medium text-gray-700">{term.title}</p>
        <p className="text-xs text-gray-400">Versão {TERM_VERSION}</p>
      </div>

      <div className="p-4 max-h-40 overflow-y-auto space-y-2 text-xs text-gray-600 leading-relaxed">
        {term.body.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <label className="flex items-start gap-2 px-4 py-3 border-t bg-white cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-emerald-600"
        />
        <span className="text-sm text-gray-700">
          Li e aceito o termo de responsabilidade para este tipo de registro.
        </span>
      </label>
    </div>
  );
}
