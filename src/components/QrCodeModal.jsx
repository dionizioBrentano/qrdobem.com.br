import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { entitiesApi, reauthHandler } from '../services/api';

/**
 * Exibe o QR Code de uma entidade já registrada.
 *
 * A imagem vem da API (que é whitelabel e centraliza a geração). Não dá para
 * apontar um <img src> direto para o endpoint: ele exige o Bearer token, então
 * buscamos por fetch e usamos o data URI que volta.
 */
export default function QrCodeModal({ entity, onClose, onUpdated }) {
  const hasInitialQr = Boolean(entity.qr_code_base64);
  const [data, setData] = useState(
    hasInitialQr ? { qr_code_base64: entity.qr_code_base64, url: entity.url } : null
  );
  const [loading, setLoading] = useState(!hasInitialQr);
  const [error, setError] = useState('');

  // Vacinação é o único campo editável depois da criação (trilha Pet).
  const [showVaccineForm, setShowVaccineForm] = useState(false);
  const [vaccine, setVaccine] = useState({ vaccine_name: '', applied_at: '' });
  const [savingVaccine, setSavingVaccine] = useState(false);
  const [vaccineError, setVaccineError] = useState('');

  // Edição da legenda do QR Code (todos os tipos)
  const [caption, setCaption] = useState(entity.qr_caption || '');
  const [originalCaption, setOriginalCaption] = useState(entity.qr_caption || '');
  const [showCaptionForm, setShowCaptionForm] = useState(false);
  const [savingCaption, setSavingCaption] = useState(false);
  const [captionError, setCaptionError] = useState('');
  const [downloadingPrint, setDownloadingPrint] = useState(false);

  const [reads, setReads] = useState([]);
  const [readsLoading, setReadsLoading] = useState(true);
  const [readsPage, setReadsPage] = useState(1);
  const [hasMoreReads, setHasMoreReads] = useState(false);

  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  const [showAudit, setShowAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [hasMoreAudit, setHasMoreAudit] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setReadsLoading(true);
      try {
        const res = await entitiesApi.reads(entity.unique_code, readsPage);
        if (active) {
          if (readsPage === 1) {
            setReads(res.data);
          } else {
            setReads(prev => [...prev, ...res.data]);
          }
          setHasMoreReads(res.current_page < res.last_page);
        }
      } catch (err) {
        console.error('Falha ao carregar leituras:', err);
      } finally {
        if (active) setReadsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [entity.unique_code, readsPage]);

  useEffect(() => {
    let active = true;
    (async () => {
      setAlertsLoading(true);
      try {
        const res = await entitiesApi.alerts(entity.unique_code);
        if (active) setAlerts(res.alerts || []);
      } catch (err) {
        console.error('Falha ao carregar alertas:', err);
      } finally {
        if (active) setAlertsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [entity.unique_code]);

  useEffect(() => {
    if (!showAudit) return;
    let active = true;
    (async () => {
      setAuditLoading(true);
      try {
        const res = await entitiesApi.auditLogs(entity.unique_code, auditPage);
        if (active) {
          if (auditPage === 1) {
            setAuditLogs(res.data);
          } else {
            setAuditLogs(prev => [...prev, ...res.data]);
          }
          setHasMoreAudit(res.current_page < res.last_page);
        }
      } catch (err) {
        console.error('Falha ao carregar auditoria:', err);
      } finally {
        if (active) setAuditLoading(false);
      }
    })();
    return () => { active = false; };
  }, [entity.unique_code, showAudit, auditPage]);

  useEffect(() => {
    if (hasInitialQr) return;

    let active = true;

    (async () => {
      try {
        const res = await entitiesApi.qrCode(entity.unique_code);
        if (active) setData(res);
      } catch (err) {
        if (active) setError(err.data?.error || err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [entity.unique_code, hasInitialQr]);

  // Considera como indisponível se carregou e não tem erro mas também não tem o base64 (null) ou erro 503
  const isUnavailable = !loading && !error && data && !data.qr_code_base64;

  const handleAddVaccination = async (e) => {
    e.preventDefault();
    setSavingVaccine(true);
    setVaccineError('');
    try {
      await entitiesApi.addVaccination(entity.unique_code, vaccine);
      setVaccine({ vaccine_name: '', applied_at: '' });
      setShowVaccineForm(false);
      if (onUpdated) onUpdated();
    } catch (err) {
      setVaccineError(err.data?.error || err.message);
    } finally {
      setSavingVaccine(false);
    }
  };

  const handleDownloadPrint = async () => {
    setDownloadingPrint(true);
    setError('');
    try {
      const res = await entitiesApi.qrCode(entity.unique_code, { layout: 'print' });
      if (res.qr_code_base64) {
        const link = document.createElement('a');
        link.href = res.qr_code_base64;
        link.download = `qrdobem-${entity.unique_code}-impressao.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      setError(err.data?.error || 'Erro ao gerar versão para impressão.');
    } finally {
      setDownloadingPrint(false);
    }
  };

  const handleEditCaption = async (e) => {
    e.preventDefault();
    if (reauthHandler) {
      const success = await reauthHandler(
        'Autorização Necessária',
        'Por segurança, confirme sua senha para salvar a nova legenda.'
      );
      if (!success) return;
    }

    setSavingCaption(true);
    setCaptionError('');

    try {
      const fullEntity = await entitiesApi.getForEdit(entity.unique_code);
      const payload = { ...fullEntity, qr_caption: caption };

      await entitiesApi.update(entity.unique_code, payload);
      setOriginalCaption(caption);
      setShowCaptionForm(false);
      if (onUpdated) onUpdated();
    } catch (err) {
      if (err.data?.code === 'CONTACT_DETECTED') {
        setCaptionError('A legenda não pode conter telefone ou e-mail. Corrija o campo e tente de novo.');
      } else {
        setCaptionError(err.data?.error || err.message);
      }
    } finally {
      setSavingCaption(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 truncate pr-2">{entity.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        <div className="p-5 text-center space-y-4 overflow-y-auto grow">
          {loading && (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm text-left">
              {error.includes('503') || error.includes('QRCODE_UNAVAILABLE') 
                ? 'QR indisponível no momento' 
                : error}
            </div>
          )}

          {isUnavailable && (
            <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-sm text-left">
              QR indisponível no momento
            </div>
          )}

          {data?.qr_code_base64 && (
            <>
              <img
                src={data.qr_code_base64}
                alt={`QR Code de ${entity.name}`}
                className="mx-auto w-56 h-56 border rounded-lg p-2 bg-white"
              />
              <div className="flex gap-2 justify-center">
                <a
                  href={data.qr_code_base64}
                  download={`qrdobem-${entity.unique_code}.svg`}
                  className="inline-block border border-brand-accent text-brand-accent hover:bg-brand-accent/10 px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Baixar SVG puro
                </a>
                <button
                  onClick={handleDownloadPrint}
                  disabled={downloadingPrint}
                  className="inline-block bg-brand-accent hover:bg-brand-accent-strong text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {downloadingPrint ? 'Gerando...' : 'Baixar p/ Impressão'}
                </button>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={data.url || entity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-brand-accent text-brand-accent hover:bg-brand-accent/10 px-5 py-2 rounded-lg text-sm font-medium transition"
                >
                  Abrir página pública
                </a>
                <Link
                  to="/messages"
                  onClick={onClose}
                  className="border border-brand-accent text-brand-accent hover:bg-brand-accent/10 px-5 py-2 rounded-lg text-sm font-medium transition"
                >
                  Ver mensagens
                </Link>
              </div>
              <p className="text-xs text-gray-400">
                O formato SVG é vetorial e não perde a nitidez.
              </p>

              <div className="pt-4 border-t text-left">
                <h3 className="text-sm font-medium text-gray-900 mb-1">Legenda do QR Code</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Esse texto aparece impresso junto ao código na "Versão p/ Impressão".
                </p>
                
                {captionError && (
                  <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm mb-2">
                    {captionError}
                  </div>
                )}

                {showCaptionForm ? (
                  <form onSubmit={handleEditCaption} className="space-y-2">
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Ex: Em caso de emergência, escaneie."
                      maxLength={100}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCaption(originalCaption);
                          setShowCaptionForm(false);
                          setCaptionError('');
                        }}
                        className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={savingCaption}
                        className="flex-1 bg-brand-accent hover:bg-brand-accent-strong text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                      >
                        {savingCaption ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2 bg-gray-50 p-2 rounded border">
                      {originalCaption || <span className="text-gray-400 italic">Usando texto padrão</span>}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCaptionForm(true)}
                      className="text-sm text-brand-blue hover:underline font-medium"
                    >
                      Editar legenda
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {entity.type === 'pet' && (
            <div className="pt-4 border-t text-left">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Vacinas</h3>

              {entity.pet_info?.vaccinations?.length > 0 && (
                <ul className="space-y-1 text-sm mb-2">
                  {entity.pet_info.vaccinations.map((v) => (
                    <li key={v.id} className="flex justify-between gap-4">
                      <span className="text-gray-500">{v.vaccine_name}</span>
                      <span className="text-gray-900">
                        {new Date(v.applied_at + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {vaccineError && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm mb-2">
                  {vaccineError}
                </div>
              )}

              {showVaccineForm ? (
                <form onSubmit={handleAddVaccination} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nome da vacina"
                    value={vaccine.vaccine_name}
                    onChange={(e) => setVaccine({ ...vaccine, vaccine_name: e.target.value })}
                    required
                    maxLength={255}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                  <input
                    type="date"
                    value={vaccine.applied_at}
                    onChange={(e) => setVaccine({ ...vaccine, applied_at: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                  />
                  <button
                    type="submit"
                    disabled={savingVaccine}
                    className="w-full bg-brand-accent hover:bg-brand-accent-strong text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    {savingVaccine ? 'Salvando...' : 'Salvar vacina'}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowVaccineForm(true)}
                  className="text-sm text-brand-blue hover:underline font-medium"
                >
                  + Adicionar vacina
                </button>
              )}
            </div>
          )}

          {/* Alertas */}
          {!alertsLoading && alerts.length > 0 && (
            <div className="pt-4 border-t text-left">
              <h3 className="text-sm font-medium text-red-600 mb-2">Alertas Recentes</h3>
              <ul className="space-y-2 text-sm max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {alerts.map((a) => (
                  <li key={a.id} className="flex flex-col gap-1 border-b border-red-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-red-800 font-medium">
                      {a.type === 'read_spike' ? 'Pico de Leituras Detectado' : 
                       a.type === 'first_read_today' ? 'Primeira Leitura do Dia' : a.type}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(a.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* P1-04: Histórico de leituras */}
          <div className="pt-4 border-t text-left">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Histórico de leituras</h3>
            {readsLoading && reads.length === 0 ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : reads.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded border">Nenhuma leitura registrada ainda.</p>
            ) : (
              <ul className="space-y-2 text-sm max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {reads.map((r) => (
                  <li key={r.id} className="flex justify-between items-center gap-2 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-gray-900">
                      {new Date(r.read_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {r.latitude && r.longitude ? 'com localização' : 'sem localização'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {hasMoreReads && (
              <button 
                onClick={() => setReadsPage(p => p + 1)} 
                disabled={readsLoading}
                className="text-xs text-brand-blue hover:underline mt-2 inline-block font-medium disabled:opacity-50"
              >
                {readsLoading ? 'Carregando...' : 'Carregar mais'}
              </button>
            )}
          </div>

          {/* P6-04: Auditoria */}
          <div className="pt-4 border-t text-left">
            <button
              onClick={() => setShowAudit(!showAudit)}
              className="flex justify-between items-center w-full text-sm font-medium text-gray-900 mb-2 hover:text-brand-blue transition"
            >
              <span>Auditoria</span>
              <span>{showAudit ? '▲' : '▼'}</span>
            </button>
            
            {showAudit && (
              <>
                {auditLoading && auditLogs.length === 0 ? (
                  <p className="text-sm text-gray-500">Carregando auditoria...</p>
                ) : auditLogs.length === 0 ? (
                  <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded border">Nenhum log de auditoria encontrado.</p>
                ) : (
                  <ul className="space-y-2 text-sm max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {auditLogs.map((log) => (
                      <li key={log.id} className="flex flex-col gap-1 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-gray-900 font-medium truncate" title={log.action}>
                            {log.action}
                          </span>
                          <span className="text-gray-500 text-xs shrink-0">
                            {log.accessed_at ? new Date(log.accessed_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Desconhecido'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {hasMoreAudit && (
                  <button 
                    onClick={() => setAuditPage(p => p + 1)} 
                    disabled={auditLoading}
                    className="text-xs text-brand-blue hover:underline mt-2 inline-block font-medium disabled:opacity-50"
                  >
                    {auditLoading ? 'Carregando...' : 'Carregar mais'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
