import { useState, useEffect } from 'react';
import { messagesApi, conversationsApi } from '../services/api';

const TYPE_LABELS = { person: 'Pessoa', pet: 'Pet', object: 'Objeto' };

const TYPE_CLASSES = {
  person: 'bg-blue-100 text-blue-700',
  pet: 'bg-amber-100 text-amber-700',
  object: 'bg-purple-100 text-purple-700',
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [riskWarning, setRiskWarning] = useState(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await messagesApi.list();
      setConversations(data.conversations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleThread = (conversation) => {
    const key = threadKey(conversation);
    setOpenId((prev) => (prev === key ? null : key));
    setReply('');
    setSendError('');
    setRiskWarning(null);
  };

  const sendReply = async (conversationId, { confirmRisk = false } = {}) => {
    setSending(true);
    setSendError('');
    try {
      const body = { message: reply, ...(confirmRisk && { confirm_risk: true }) };
      await conversationsApi.tenantReply(conversationId, body);
      setReply('');
      setRiskWarning(null);
      await loadConversations();
    } catch (err) {
      if (err.data?.code === 'CONTACT_DETECTED') {
        setRiskWarning({ conversationId, message: err.data.error });
      } else {
        setSendError(err.data?.error || err.message);
      }
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async (conversationId) => {
    await conversationsApi.resolve(conversationId);
    await loadConversations();
  };

  const handleMarkAsRead = async (messageId) => {
    await messagesApi.markAsRead(messageId);
    await loadConversations();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>;
  }

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
        {totalUnread > 0 && (
          <span className="bg-brand-blue/20 text-brand-blue px-3 py-1 rounded-full text-sm font-medium">
            {totalUnread} nova{totalUnread > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-10 text-center text-gray-500">
          Quando alguém escanear seu QR e enviar recado, aparece aqui.
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => {
            const key = threadKey(conversation);
            const isOpen = openId === key;
            const hasUnread = conversation.unread_count > 0;
            const lastMessage = conversation.messages[conversation.messages.length - 1];

            return (
              <div
                key={key}
                className={`bg-white rounded-xl shadow-sm border transition ${
                  hasUnread ? 'border-l-4 border-l-brand-blue' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleThread(conversation)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-gray-900">
                      {conversation.benefactor_nickname || 'Anônimo'}
                    </span>
                    {hasUnread && (
                      <span className="bg-brand-blue/100 text-white text-xs px-2 py-0.5 rounded-full">
                        {conversation.unread_count} nova{conversation.unread_count > 1 ? 's' : ''}
                      </span>
                    )}
                    {conversation.resolved_at && (
                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                        Resolvida
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 text-sm line-clamp-2">{lastMessage?.message}</p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    <div className="flex items-center">
                      <span>QR: {conversation.entity?.name || '—'}</span>
                      {conversation.entity?.type && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ml-2 ${
                            TYPE_CLASSES[conversation.entity.type] || TYPE_CLASSES.object
                          }`}
                        >
                          {TYPE_LABELS[conversation.entity.type] || conversation.entity.type}
                        </span>
                      )}
                    </div>
                    {conversation.last_message_at && (
                      <span>{new Date(conversation.last_message_at).toLocaleString('pt-BR')}</span>
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t p-4 space-y-3">
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {conversation.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${
                            msg.sender_type === 'system'
                              ? 'bg-gray-100 text-gray-500 text-xs mx-auto text-center'
                              : msg.sender_type === 'tenant'
                              ? 'bg-brand-blue text-white ml-auto'
                              : 'bg-gray-50 text-gray-800 border border-gray-200 mr-auto'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          {msg.latitude && msg.longitude && (
                            <a
                              href={`https://maps.google.com/?q=${msg.latitude},${msg.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline"
                            >
                              Ver no mapa
                            </a>
                          )}
                        </div>
                      ))}
                    </div>

                    {sendError && (
                      <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {sendError}
                      </div>
                    )}

                    {riskWarning?.conversationId === conversation.id && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm space-y-2">
                        <p>{riskWarning.message}</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => sendReply(conversation.id, { confirmRisk: true })}
                            disabled={sending}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded text-xs font-bold transition disabled:opacity-50"
                          >
                            Enviar mesmo assim
                          </button>
                          <button
                            type="button"
                            onClick={() => setRiskWarning(null)}
                            className="text-amber-800 hover:underline text-xs font-medium"
                          >
                            Corrigir a mensagem
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Threads antigas são mensagens avulsas, anteriores ao chat:
                        não têm conversa para responder, só marcar como lida. */}
                    {conversation.is_legacy ? (
                      lastMessage && !lastMessage.read_at && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(lastMessage.id)}
                          className="text-sm text-brand-blue hover:underline"
                        >
                          Marcar como lida
                        </button>
                      )
                    ) : (
                      <>
                        {!conversation.resolved_at && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              sendReply(conversation.id);
                            }}
                            className="space-y-2"
                          >
                            <textarea
                              placeholder="Sua resposta"
                              value={reply}
                              onChange={(e) => setReply(e.target.value)}
                              required
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={sending}
                                className="bg-brand-accent hover:bg-brand-accent-strong text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                              >
                                {sending ? 'Enviando...' : 'Responder'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResolve(conversation.id)}
                                className="border border-gray-300 text-gray-600 hover:border-brand-blue hover:text-brand-blue px-5 py-2 rounded-lg text-sm font-medium transition"
                              >
                                Marcar como resolvido
                              </button>
                            </div>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Threads legadas não têm id de conversa; a chave usa o id da mensagem.
function threadKey(conversation) {
  return conversation.is_legacy
    ? `legacy-${conversation.messages[0]?.id}`
    : `conversation-${conversation.id}`;
}
