import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { donationsApi } from '../services/api';
import PublicShell from '../components/layout/PublicShell';

export default function DonationStatusPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    donationsApi
      .status(token)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Doação não encontrada.');
        setLoading(false);
      });
  }, [token]);

  const money = (val) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading) {
    return (
      <PublicShell>
        <div className="bg-gray-50 flex-1 flex items-center justify-center p-4 w-full">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue" />
        </div>
      </PublicShell>
    );
  }

  if (error) {
    return (
      <PublicShell>
        <div className="bg-gray-50 flex-1 flex items-center justify-center p-4 w-full">
          <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Ops!</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/" className="text-brand-blue font-medium hover:underline">
              Voltar para o Início
            </Link>
          </div>
        </div>
      </PublicShell>
    );
  }

  const isPaid = data.status === 'paid';

  return (
    <PublicShell>
      <div className="bg-gray-50 flex-1 flex py-12 px-4 sm:px-6 lg:px-8 justify-center w-full">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-brand-blue py-6 px-4 text-center">
          <h1 className="text-2xl font-bold text-white">Status da Doação</h1>
          {data.cause && (
            <p className="text-blue-100 mt-1">Para: {data.cause.name}</p>
          )}
        </div>

        <div className="p-6">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isPaid ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
              {isPaid ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {isPaid ? 'Pagamento Confirmado' : 'Aguardando Pagamento'}
            </h2>
            {isPaid && data.paid_at && (
              <p className="text-sm text-gray-500 mt-1">Pago em: {new Date(data.paid_at).toLocaleString('pt-BR')}</p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Resumo</h3>
            
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Valor bruto</dt>
                <dd className="font-medium text-gray-900">{money(data.amount_gross)}</dd>
              </div>
              
              <div className="flex justify-between text-gray-500">
                <dt>Taxa QR do Bem ({parseFloat(data.platform_fee_percent)}%)</dt>
                <dd>{money(data.platform_fee_amount)}</dd>
              </div>
              
              <div className="flex justify-between text-gray-500">
                <dt>Custo do meio de pagamento</dt>
                <dd>{parseFloat(data.payment_fee_amount) > 0 ? money(data.payment_fee_amount) : 'Variável'}</dd>
              </div>

              <div className="pt-3 flex justify-between border-t border-gray-100 font-medium">
                <dt className="text-brand-blue">Líquido para a causa</dt>
                <dd className="text-brand-blue">{money(data.amount_to_cause)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      </div>
    </PublicShell>
  );
}
