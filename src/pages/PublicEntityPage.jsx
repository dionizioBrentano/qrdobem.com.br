import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { entitiesApi, messagesApi } from '../services/api';

export default function PublicEntityPage() {
  const { uniqueCode } = useParams();
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msgForm, setMsgForm] = useState({ sender_name: '', sender_contact: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    loadEntity();
  }, [uniqueCode]);

  const loadEntity = async () => {
    try {
      const data = await entitiesApi.show(uniqueCode);
      setEntity(data);
    } catch (err) {
      setError(err.status === 404 ? 'Registro não encontrado ou inativo.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      // Tenta capturar localização
      let latitude = null;
      let longitude = null;
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        // Localização é opcional
      }

      await messagesApi.sendPublic(uniqueCode, { ...msgForm, latitude, longitude });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-blue/10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (error && !entity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-5xl mb-4">😔</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Registro não encontrado</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const typeLabels = { person: 'Pessoa', pet: 'Pet', object: 'Objeto' };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4 pt-8">
        {/* Cabeçalho */}
        <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
          <div className="inline-block bg-brand-blue/20 text-brand-blue text-xs font-medium px-3 py-1 rounded-full mb-3">
            {typeLabels[entity.type] || entity.type}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{entity.name}</h1>
          <p className="text-gray-500 text-sm">{entity.organization}</p>
        </div>

        {/* Informações */}
        {(entity.medical_info || entity.additional_info) && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            {entity.medical_info && (
              <div>
                <h3 className="text-sm font-medium text-red-600 mb-1">Informações Médicas</h3>
                <p className="text-gray-700 text-sm">{entity.medical_info}</p>
              </div>
            )}
            {entity.additional_info && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Informações Adicionais</h3>
                <p className="text-gray-700 text-sm">{entity.additional_info}</p>
              </div>
            )}
          </div>
        )}

        {/* Atributos customizados */}
        {entity.custom_attributes && Object.keys(entity.custom_attributes).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Detalhes</h3>
            <dl className="space-y-1 text-sm">
              {Object.entries(entity.custom_attributes).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-gray-500 capitalize">{key}</dt>
                  <dd className="text-gray-900 font-medium">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Formulário de contato */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Enviar mensagem ao responsável</h3>

          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">💚</div>
              <p className="font-medium text-brand-blue">Mensagem enviada com sucesso!</p>
              <p className="text-gray-500 text-sm mt-1">O responsável será notificado.</p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-3">
              <input
                type="text"
                placeholder="Seu nome *"
                value={msgForm.sender_name}
                onChange={(e) => setMsgForm({ ...msgForm, sender_name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
              />
              <input
                type="text"
                placeholder="Seu contato (telefone ou e-mail)"
                value={msgForm.sender_contact}
                onChange={(e) => setMsgForm({ ...msgForm, sender_contact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
              />
              <textarea
                placeholder="Sua mensagem *"
                value={msgForm.message}
                onChange={(e) => setMsgForm({ ...msgForm, message: e.target.value })}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-brand-blue hover:brightness-90 text-white py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {sending ? 'Enviando...' : 'Enviar Mensagem'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          Protegido pelo QR do Bem &bull; qrdobem.com.br
        </p>
      </div>
    </div>
  );
}
