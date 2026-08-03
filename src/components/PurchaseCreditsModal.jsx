import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { creditsApi } from '../services/api';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

export default function PurchaseCreditsModal({ onClose }) {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [pixData, setPixData] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [method, setMethod] = useState('pix'); // 'pix' | 'card'

  useEffect(() => {
    Promise.all([creditsApi.pricing(), creditsApi.mpPublicConfig()])
      .then(([pricingData, configData]) => {
        setPricing(pricingData);
        setQuantity(pricingData.min_quantity || 1);
        
        if (configData.public_key) {
          initMercadoPago(configData.public_key, { locale: configData.locale || 'pt-BR' });
        }
        
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Erro ao carregar configurações.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let intervalId;
    let attempts = 0;
    const MAX_ATTEMPTS = 24;

    if (orderId) {
      intervalId = setInterval(async () => {
        try {
          attempts++;
          const statusRes = await creditsApi.orderStatus(orderId);
          if (statusRes.status === 'approved') {
            clearInterval(intervalId);
            onClose();
            window.location.reload();
          } else if (attempts >= MAX_ATTEMPTS) {
            clearInterval(intervalId);
          }
        } catch (e) {
          console.error('Erro no polling:', e);
        }
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, onClose]);

  const handlePurchasePix = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await creditsApi.checkout(quantity);
      if (res.pix && res.order_id) {
        setPixData(res.pix);
        setOrderId(res.order_id);
      } else {
        setError('Erro ao gerar link de pagamento.');
        setIsSubmitting(false);
      }
    } catch (err) {
      handleError(err);
      setIsSubmitting(false);
    }
  };

  const onSubmitCard = async ({ formData }) => {
    setIsSubmitting(true);
    setError('');
    try {
      // A doc oficial do Payment Brick manda enviar o formData INTEIRO para o
      // backend. Só acrescentamos a quantidade — o valor a cobrar continua sendo
      // calculado no servidor, nunca a partir do que o cliente manda.
      const payload = {
        ...formData,
        quantity,
        // Campos achatados: mantidos por compatibilidade com a validação da API.
        payer_email: formData.payer?.email,
        identification_type: formData.payer?.identification?.type,
        identification_number: formData.payer?.identification?.number,
      };
      const res = await creditsApi.checkoutCard(payload);
      
      if (res.status === 'approved' || res.status === 'pending') {
        setOrderId(res.order_id);
      } else {
        setError('Pagamento recusado: ' + (res.message || res.status));
        setIsSubmitting(false);
      }
    } catch (err) {
      handleError(err);
      setIsSubmitting(false);
    }
  };

  const handleError = (err) => {
    if (err.status === 403 && String(err.data?.code).startsWith('PROFILE_')) {
      setError(
        <span>
          Seu perfil está incompleto ou inativo. <Link to="/profile" className="underline font-bold">Clique aqui para completar.</Link>
        </span>
      );
    } else if (err.status === 422) {
      setError(err.data?.error || 'Verifique os dados informados.');
    } else {
      setError(err.message || 'Erro ao processar compra.');
    }
  };

  const handleCheckStatus = async () => {
    if (!orderId) return;
    try {
      const statusRes = await creditsApi.orderStatus(orderId);
      if (statusRes.status === 'approved') {
         onClose();
         window.location.reload();
      } else {
         alert('Pagamento ainda não confirmado. Aguarde mais alguns instantes.');
      }
    } catch (e) {
      alert('Erro ao verificar status.');
    }
  };

  const copyToClipboard = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      alert('Código PIX copiado!');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#009ee3] mx-auto" />
        </div>
      </div>
    );
  }

  if (orderId && !pixData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden p-6 text-center">
           <h2 className="text-xl font-semibold text-gray-900 mb-4">Processando Pagamento</h2>
           <p className="text-gray-600 mb-6">Aguardando confirmação do cartão...</p>
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#009ee3] mx-auto" />
           <p className="text-xs text-gray-400 mt-4">Isso pode levar alguns instantes.</p>
        </div>
      </div>
    );
  }

  if (pixData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Pagamento PIX</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <p className="text-gray-600 text-sm mb-2">
              Pague com PIX no app do seu banco. Os créditos entram automaticamente após a confirmação.
            </p>
            {pixData.qr_code_base64 && (
              <img 
                src={`data:image/png;base64,${pixData.qr_code_base64}`} 
                alt="QR Code PIX" 
                className="w-48 h-48 border rounded-lg p-2"
              />
            )}
            <div className="w-full mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">PIX Copia e Cola</label>
              <div className="flex">
                <input 
                  type="text" 
                  readOnly 
                  value={pixData.qr_code} 
                  className="w-full px-3 py-2 border rounded-l-lg bg-gray-50 text-xs focus:outline-none"
                />
                <button 
                  onClick={copyToClipboard}
                  className="bg-[#009ee3] hover:bg-[#008dcb] text-white px-4 py-2 rounded-r-lg text-sm font-medium transition"
                >
                  Copiar
                </button>
              </div>
            </div>
            <button 
              onClick={handleCheckStatus}
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition"
            >
              Já paguei — atualizar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const total = (pricing?.unit_price * quantity).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const amount = Number((pricing?.unit_price * quantity).toFixed(2));

  // useMemo evita recriar estes objetos a cada render. Sem isso o SDK do
  // Mercado Pago reinicializa o Brick repetidamente (dava para ver várias
  // chamadas "initialization?public_key=..." no Network), criando instâncias
  // concorrentes — e o token gerado por uma instância órfã não é reconhecido
  // pela API, resultando em "Cannot infer Payment Method".
  const initialization = useMemo(() => ({ amount }), [amount]);

  const customization = useMemo(() => ({
    paymentMethods: {
      creditCard: 'all',
      debitCard: 'all',
    },
  }), []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">Comprar Créditos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex border-b mb-4">
            <button 
              onClick={() => { setMethod('pix'); setError(''); }}
              className={`flex-1 py-2 font-medium text-sm transition-colors ${method === 'pix' ? 'border-b-2 border-[#009ee3] text-[#009ee3]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              PIX
            </button>
            <button 
              onClick={() => { setMethod('card'); setError(''); }}
              className={`flex-1 py-2 font-medium text-sm transition-colors ${method === 'card' ? 'border-b-2 border-[#009ee3] text-[#009ee3]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Cartão
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade de QR Codes
            </label>
            <input
              type="number"
              min={pricing?.min_quantity}
              max={pricing?.max_quantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#009ee3] focus:border-[#009ee3] disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo: {pricing?.min_quantity} | Máximo: {pricing?.max_quantity}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total a pagar:</span>
            <span className="text-xl font-bold text-gray-900">{total}</span>
          </div>

          {method === 'pix' ? (
            <button
              onClick={handlePurchasePix}
              disabled={isSubmitting}
              className="w-full bg-[#009ee3] hover:bg-[#008dcb] text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
            >
              {isSubmitting ? 'Processando...' : 'Gerar PIX'}
            </button>
          ) : (
            <div className="mt-4">
              {/* key={amount} força o React a destruir e recriar o Brick quando
                  o valor muda, em vez de deixar instâncias antigas vivas.
                  A doc do Mercado Pago exige que cada instância seja destruída
                  antes de gerar uma nova. */}
              <Payment
                key={amount}
                initialization={initialization}
                customization={customization}
                onSubmit={onSubmitCard}
                onError={(err) => console.error('Brick Error:', err)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
