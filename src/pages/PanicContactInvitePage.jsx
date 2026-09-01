import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { emergencyContactsApi } from '../services/api';
import { API_BASE } from '../services/http';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  BellRing
} from 'lucide-react';
import { urlBase64ToUint8Array } from '../utils/pushSupport';

export function PanicContactInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteData, setInviteData] = useState(null);
  const [step, setStep] = useState('review'); // review | accepting | success | error

  useEffect(() => {
    fetchInvite();
  }, [token]);

  const fetchInvite = async () => {
    try {
      const data = await emergencyContactsApi.getInvite(token);
      setInviteData(data);
    } catch (err) {
      setError(err.message || 'Convite inválido ou expirado.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setStep('accepting');
    try {
      await emergencyContactsApi.acceptInvite(token);
      
      // Tentar registrar push subscription
      try {
        await subscribeToPush();
      } catch (pushErr) {
        console.warn('Não foi possível registrar push:', pushErr);
        // Não impede o fluxo se o usuário negar a permissão,
        // apenas não receberá via push (fallback email se tiver)
      }

      setStep('success');
    } catch (err) {
      setError(err.message || 'Erro ao aceitar convite.');
      setStep('error');
    }
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push não suportado no navegador.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada.');
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Obter VAPID public key da API
    const res = await fetch(`${API_BASE}/push/public-key`);
    const { publicKey } = await res.json();
    
    if (!publicKey) {
      throw new Error('Chave de notificação indisponível. Contate o suporte.');
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    await emergencyContactsApi.pushSubscription(token, subscription.toJSON());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Erro no Convite</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors"
          >
            Voltar para o Início
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Convite Aceito!</h1>
          <p className="text-gray-600 mb-6">
            Você agora é um contato de pânico. Recomendamos adicionar este site à tela inicial do seu celular (Instalar App) para receber notificações com som mesmo quando não estiver navegando.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 bg-brand-blue hover:bg-brand-blue-dark text-white font-medium rounded-lg transition-colors"
          >
            Ir para a Página Inicial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm max-w-md w-full overflow-hidden">
        <div className="bg-red-50 p-6 text-center border-b border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Contato de Pânico</h1>
          <p className="text-sm text-red-600 mt-1">QR do Bem</p>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            Olá, <strong>{inviteData.name_preview}</strong>. Você foi convidado para ser um Contato de Pânico.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-sm text-gray-700 space-y-3">
            <h3 className="font-semibold text-gray-900">O que significa isso?</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Você receberá alertas caso uma emergência seja declarada (ex: se o tutor ou alguém na rua ler o QR Code de emergência).</li>
              <li>Não é necessário criar uma conta completa no QR do Bem.</li>
              <li>Seus dados (telefone/email) nunca são exibidos publicamente para quem lê o QR.</li>
              <li>Sua localização atual <strong>não</strong> é rastreada nem compartilhada.</li>
            </ul>
            
            <div className="flex items-start gap-2 mt-4 text-blue-800 bg-blue-50 p-3 rounded border border-blue-100">
              <BellRing className="w-5 h-5 shrink-0 mt-0.5" />
              <p>Ao aceitar, o navegador pedirá permissão para enviar <strong>Notificações (Push)</strong>. Permita para que os alertas toquem no seu celular.</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleAccept}
              disabled={step === 'accepting'}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              {step === 'accepting' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Aceitando e Configurando...
                </>
              ) : (
                'Aceitar e Permitir Alertas'
              )}
            </button>
            <button
              onClick={() => navigate('/')}
              disabled={step === 'accepting'}
              className="w-full py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Recusar
            </button>
          </div>
          
          <p className="text-xs text-center text-gray-500 mt-6">
            Ao aceitar, você concorda com os {inviteData.term_version} do QR do Bem.
          </p>
        </div>
      </div>
    </div>
  );
}
