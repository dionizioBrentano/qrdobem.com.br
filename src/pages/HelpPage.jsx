import { Link } from 'react-router-dom';

// Placeholder de navegação. O conteúdo real (pessoa, pet, objeto, veículo,
// celular e campanha de doação) entra na spec própria desta página.
export default function HelpPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Como cadastrar e gerenciar os dados do seu QR Code
      </h1>
      <p className="text-gray-600 mb-6">
        Estamos preparando este guia. Em breve você encontrará aqui o passo a passo
        de cada tipo de QR Code.
      </p>
      <Link to="/painel" className="text-brand-blue hover:underline font-medium">
        Voltar ao painel
      </Link>
    </div>
  );
}
