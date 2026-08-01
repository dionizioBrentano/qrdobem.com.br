import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { creditsApi } from '../services/api';

export default function PurchaseCreditsModal({ onClose }) {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    creditsApi.pricing()
      .then(data => {
        setPricing(data);
        setQuantity(data.min_quantity || 1);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Erro ao carregar preços.');
        setLoading(false);
      });
  }, []);

  const handlePurchase = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await creditsApi.checkout(quantity);
      // Checkout API returns init_point and sandbox_init_point
      // Se mode for test e tiver sandbox, o Mercado Pago envia, mas o init_point já respeita.
      const url = res.init_point || res.sandbox_init_point;
      if (url) {
        window.location.href = url;
      } else {
        setError('Erro ao gerar link de pagamento.');
        setIsSubmitting(false);
      }
    } catch (err) {
      if (err.status === 403 && String(err.data?.code).startsWith('PROFILE_')) {
        setError(
          <span>
            Seu perfil está incompleto ou inativo. <Link to="/profile" className="underline font-bold">Clique aqui para completar.</Link>
          </span>
        );
      } else {
        setError(err.message || 'Erro ao processar compra.');
      }
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
        </div>
      </div>
    );
  }

  const total = (pricing?.unit_price * quantity).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Comprar Créditos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
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
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo: {pricing?.min_quantity} | Máximo: {pricing?.max_quantity}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
            <span className="text-gray-600 font-medium">Total:</span>
            <span className="text-xl font-bold text-gray-900">{total}</span>
          </div>

          <button
            onClick={handlePurchase}
            disabled={isSubmitting}
            className="w-full bg-[#009ee3] hover:bg-[#008dcb] text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
          >
            {isSubmitting ? 'Processando...' : 'Comprar com Mercado Pago'}
          </button>
        </div>
      </div>
    </div>
  );
}
