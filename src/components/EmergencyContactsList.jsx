import React, { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, Send, Plus, Loader2, Copy, Check } from 'lucide-react';
import { emergencyContactsApi } from '../services/api';

export default function EmergencyContactsList({ spaceId, entityId }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [spaceId, entityId]);

  const fetchContacts = async () => {
    try {
      const data = await emergencyContactsApi.list({ space_id: spaceId, entity_id: entityId });
      setContacts(data.data || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar contatos de pânico.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await emergencyContactsApi.create({
        space_id: spaceId,
        entity_id: entityId,
        ...formData
      });
      setFormData({ name: '', phone: '', email: '' });
      setIsAdding(false);
      await fetchContacts();
    } catch (err) {
      alert(err.message || 'Erro ao adicionar contato.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Deseja realmente remover este contato? Ele não receberá mais alertas de pânico.')) return;
    try {
      await emergencyContactsApi.remove(id);
      await fetchContacts();
    } catch (err) {
      alert(err.message || 'Erro ao remover contato.');
    }
  };

  const handleResend = async (id) => {
    try {
      const data = await emergencyContactsApi.resend(id);
      const link = `${window.location.origin}/convite-panico/${data.token}`;
      handleCopy(link, id);
    } catch (err) {
      alert(err.message || 'Erro ao reenviar convite.');
    }
  };

  const handleCopy = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-red-100 bg-red-50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            Contatos de Pânico
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Pessoas que serão alertadas no celular quando houver uma emergência. 
            Não precisam criar conta, apenas aceitar o convite e o alerta Push.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="hidden sm:flex items-center justify-center py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </button>
        )}
      </div>

      <div className="p-4 sm:p-6">
        {isAdding && (
          <form onSubmit={handleAdd} className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-3">Novo Contato de Pânico</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (Opcional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
                  placeholder="Ex: 11999999999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (Opcional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm"
                  placeholder="Ex: joao@email.com"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="py-2 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                Adicionar e Gerar Convite
              </button>
            </div>
          </form>
        )}

        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

        {contacts.length === 0 && !isAdding ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-4">Nenhum contato de pânico configurado.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center justify-center py-2 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-colors text-sm shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Adicionar Primeiro Contato
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map(contact => {
              const inviteLink = `${window.location.origin}/convite-panico/${contact.invite_token}`;
              return (
                <div key={contact.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-100 rounded-lg bg-white shadow-sm gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{contact.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {contact.status === 'accepted' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Ativo (Convite aceito)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pendente
                        </span>
                      )}
                      
                      {contact.status === 'accepted' && contact.push_subscription && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Push Habilitado
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    {contact.status !== 'accepted' && (
                      <button
                        onClick={() => handleCopy(inviteLink, contact.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        {copiedLink === contact.id ? (
                          <><Check className="w-3.5 h-3.5 mr-1 text-green-600" /> Copiado</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5 mr-1" /> Link de Convite</>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleResend(contact.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      title="Regerar e copiar link"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" /> Reenviar
                    </button>

                    <button
                      onClick={() => handleRemove(contact.id)}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-md text-red-600 hover:bg-red-50"
                      title="Remover Contato"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
