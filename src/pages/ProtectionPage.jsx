import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { entitiesApi } from '../services/api';
import { deviceApi } from '../services/deviceApi';
import PanicButton from '../components/PanicButton';
import PublicPanicButton from '../components/PublicPanicButton';
import { ADVENTURE_UI } from '../constants/adventure';
import { useProtectionGps } from '../hooks/useProtectionGps';
import { useProtectionDevice } from '../hooks/useProtectionDevice';
import { useWellnessCheck } from '../hooks/useWellnessCheck';
import WellnessOverlay from '../components/WellnessOverlay';
import { getDeviceToken, setDeviceToken } from '../utils/deviceToken';
import { getDeviceId } from '../utils/deviceId';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../utils/apiError';
import { PUBLIC_ORIGIN } from '../constants/urls';

export default function ProtectionPage() {
  const { uniqueCode } = useParams();
  const { user } = useAuth();
  
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [monitoring, setMonitoring] = useState(true);
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#token=')) {
      const token = hash.replace('#token=', '');
      if (token) {
        setDeviceToken(token);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, []);

  const hasAccess = !!user || !!getDeviceToken();
  const isTokenMode = !user && !!getDeviceToken();

  const { role, error: deviceError, setRole } = useProtectionDevice(hasAccess ? uniqueCode : null);
  const { lastKnown, error: gpsError, sending } = useProtectionGps(hasAccess ? uniqueCode : null, monitoring);
  const { pendingCheck, error: wellnessError, busy: wellnessBusy, respond, createManualAndRespond } = useWellnessCheck(hasAccess ? uniqueCode : null, monitoring);

  useEffect(() => {
    async function loadEntity() {
      if (!hasAccess) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        if (isTokenMode) {
          setEntity({ name: 'Proteção Ativa', id: null, space_id: null });
        } else {
          const res = await entitiesApi.getForEdit(uniqueCode);
          setEntity(res.data || res);
        }
      } catch (err) {
        setError(err.data?.error || 'Erro ao carregar a entidade.');
      } finally {
        setLoading(false);
      }
    }
    loadEntity();
  }, [uniqueCode, hasAccess, isTokenMode]);

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const handleGenerateAccess = async () => {
    setActionError('');
    setActionSuccess('');
    try {
      const deviceId = getDeviceId();
      const res = await deviceApi.issueToken(uniqueCode, deviceId);
      const url = `${PUBLIC_ORIGIN}/protecao/${uniqueCode}#token=${res.token}`;
      setGeneratedLink(url);
    } catch (err) {
      setActionError('Erro ao gerar acesso: ' + apiError(err));
    }
  };

  const handleRevokeAccess = async () => {
    if (!window.confirm('Revogar acesso deste aparelho?')) return;
    setActionError('');
    setActionSuccess('');
    try {
      const deviceId = getDeviceId();
      await deviceApi.revokeToken(uniqueCode, deviceId);
      setGeneratedLink('');
      setActionSuccess('Acesso revogado com sucesso.');
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setActionError('Erro ao revogar acesso: ' + apiError(err));
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 text-center text-gray-500 font-medium">
          Peça o link de proteção ao responsável.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="text-gray-500">Carregando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        {error}
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="p-8 text-center text-gray-500">
        Nenhuma pessoa encontrada.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col p-4">
      {user && (
        <div className="mb-4 flex items-center justify-between">
          <Link to={`/painel/aventura/challenge/${uniqueCode}`} className="text-brand-blue font-bold text-sm hover:underline">
            ← Voltar
          </Link>
        </div>
      )}

      {user && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-black text-gray-900 mb-2">Acesso PWA</h2>
          <p className="text-sm text-gray-600 mb-4">
            Gere um link para a criança/acompanhante abrir no próprio celular sem login.
          </p>

          {actionError && <p className="text-red-600 text-sm mb-2">{actionError}</p>}
          {actionSuccess && <p className="text-green-600 text-sm mb-2">{actionSuccess}</p>}

          <div className="flex gap-2">
            <button onClick={handleGenerateAccess} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-bold text-sm">
              Gerar acesso deste aparelho
            </button>
            <button onClick={handleRevokeAccess} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold text-sm">
              Revogar
            </button>
          </div>
          {generatedLink && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs break-all border border-gray-200">
              <p className="font-bold mb-1">Copie o link abaixo e envie:</p>
              {generatedLink}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h1 className="text-2xl font-black text-brand-blue mb-2 text-center">
          {entity.name}
        </h1>
        
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
          <span className="text-gray-700 font-bold">
            {monitoring ? ADVENTURE_UI.PROTECTION_MONITORING_ON : ADVENTURE_UI.PROTECTION_MONITORING_OFF}
          </span>
          <button
            onClick={() => setMonitoring(!monitoring)}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${
              monitoring ? 'bg-brand-accent' : 'bg-gray-300'
            }`}
          >
            <div
              className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                monitoring ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="border-t border-gray-100 pt-4 mt-4 text-sm text-gray-600">
          <p className="font-bold mb-2">{ADVENTURE_UI.DEVICE_ROLE_LABEL}</p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="deviceRole"
                value="protected"
                checked={role === 'protected'}
                onChange={() => setRole('protected')}
                className="text-brand-accent focus:ring-brand-accent w-4 h-4"
              />
              {ADVENTURE_UI.DEVICE_ROLE_PROTECTED}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="deviceRole"
                value="companion"
                checked={role === 'companion'}
                onChange={() => setRole('companion')}
                className="text-brand-accent focus:ring-brand-accent w-4 h-4"
              />
              {ADVENTURE_UI.DEVICE_ROLE_COMPANION}
            </label>
          </div>
          {deviceError && <p className="text-red-500 text-xs mt-2">{deviceError}</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6 text-center">
        <p className="text-sm text-gray-500 uppercase tracking-wide font-bold mb-1">
          Última posição
        </p>
        <p className="text-gray-800 font-medium">
          {lastKnown ? (
            <>
              {new Date(lastKnown.recorded_at).toLocaleTimeString('pt-BR')} - Lat: {Number(lastKnown.latitude).toFixed(4)}, Lng: {Number(lastKnown.longitude).toFixed(4)} ({lastKnown.accuracy_meters}m)
            </>
          ) : (
            ADVENTURE_UI.PROTECTION_NO_POSITION
          )}
        </p>
        {gpsError && <p className="text-red-500 text-sm mt-2 font-bold">{gpsError}</p>}
        {sending && <p className="text-brand-accent text-xs mt-1">Enviando nova posição...</p>}
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        <button
          onClick={createManualAndRespond}
          disabled={wellnessBusy || isTokenMode}
          className={`w-[80%] mx-auto h-20 rounded-2xl text-2xl font-black shadow-lg transition-all ${
            wellnessBusy || isTokenMode
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white active:scale-95'
          }`}
        >
          {wellnessBusy ? ADVENTURE_UI.PROTECTION_IM_OK_SENT : ADVENTURE_UI.PROTECTION_IM_OK}
        </button>

        <div className="w-full">
          {user ? <PanicButton spaceId={entity.space_id} entityId={entity.id} /> : <PublicPanicButton uniqueCode={uniqueCode} />}
        </div>
      </div>

      <WellnessOverlay
        check={pendingCheck}
        onRespond={respond}
        error={wellnessError}
        busy={wellnessBusy}
      >
        {user ? <PanicButton spaceId={entity.space_id} entityId={entity.id} /> : <PublicPanicButton uniqueCode={uniqueCode} />}
      </WellnessOverlay>
    </div>
  );
}
