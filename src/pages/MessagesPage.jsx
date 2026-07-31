import { useState, useEffect } from 'react';
import { messagesApi } from '../services/api';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const data = await messagesApi.list();
      setMessages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    await messagesApi.markAsRead(id);
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, read_at: new Date().toISOString() } : m))
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>;
  }

  const unread = messages.filter((m) => !m.read_at);
  const read = messages.filter((m) => m.read_at);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
        {unread.length > 0 && (
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
            {unread.length} nova{unread.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-10 text-center text-gray-400">
          Nenhuma mensagem recebida ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {[...unread, ...read].map((msg) => (
            <div
              key={msg.id}
              className={`bg-white rounded-xl shadow-sm border p-4 transition ${
                !msg.read_at ? 'border-l-4 border-l-emerald-500' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{msg.sender_name}</span>
                    {msg.sender_contact && (
                      <span className="text-xs text-gray-400">({msg.sender_contact})</span>
                    )}
                    {!msg.read_at && (
                      <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                        Nova
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm">{msg.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>Entidade: {msg.entity?.encrypted_name || msg.entity_id}</span>
                    {msg.latitude && msg.longitude && (
                      <a
                        href={`https://maps.google.com/?q=${msg.latitude},${msg.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline"
                      >
                        Ver no mapa
                      </a>
                    )}
                    <span>{new Date(msg.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                {!msg.read_at && (
                  <button
                    onClick={() => handleMarkAsRead(msg.id)}
                    className="text-sm text-emerald-600 hover:underline whitespace-nowrap"
                  >
                    Marcar como lida
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
