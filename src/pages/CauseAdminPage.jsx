import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, Upload, Check, X, AlertCircle } from 'lucide-react';
import { spacesApi, causesApi, mediaApi } from '../services/api';
import CauseProductsBlock from '../components/CauseProductsBlock';

/**
 * CauseAdminPage — painel da causa: vitrine, mídia e QR em lote.
 * Fase 3, T2-R03 a T2-R05 do PLANO_TRILHAS_2026-08.md.
 *
 * Reúne numa tela só as três coisas que o líder da causa faz:
 *   1. contar a história e prestar contas (vitrine)
 *   2. aprovar as fotos que vão para a vitrine (moderação)
 *   3. gerar e imprimir as etiquetas da campanha (lote)
 *
 * A moderação fica aqui, e não escondida num painel de admin, porque quem
 * responde pela causa é quem precisa decidir o que aparece com o nome dela.
 */
export default function CauseAdminPage() {
  const [spaces, setSpaces] = useState([]);
  const [spaceId, setSpaceId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [media, setMedia] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [saveOk, setSaveOk] = useState('');
  const [saveError, setSaveError] = useState('');
  const [publishOk, setPublishOk] = useState('');
  const [publishError, setPublishError] = useState('');

  const [form, setForm] = useState({
    headline: '', story: '', category: '', city: '', state: '',
    goal_amount: '', accountability: '',
  });

  // Criação da primeira causa. O mínimo para existir um espaço: só `name` é
  // obrigatório — a história, a meta e a prestação de contas são preenchidas
  // depois, na vitrine, que já nasce despublicada.
  const [createForm, setCreateForm] = useState({
    name: '', headline: '', city: '', state: '',
  });
  // Marca o erro 403 de perfil incompleto: o caminho de saída não é tentar de
  // novo, é completar o cadastro.
  const [profileBlocked, setProfileBlocked] = useState(false);

  useEffect(() => {
    spacesApi.list()
      .then((res) => {
        const causes = (res.spaces || []).filter((s) => s.type === 'cause');
        setSpaces(causes);
        if (causes.length) setSpaceId(causes[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!spaceId) return;
    loadAll();
  }, [spaceId]);

  const loadAll = async () => {
    setError('');
    try {
      const [detailRes, mediaRes, donationsRes] = await Promise.all([
        spacesApi.show(spaceId),
        mediaApi.list(spaceId),
        import('../services/api').then(m => m.donationsApi.listBySpace(spaceId)),
      ]);

      setDetail(detailRes.space);
      setMedia(mediaRes.media || []);
      setDonations(donationsRes.donations || []);

      const cause = detailRes.space?.cause;
      if (cause) {
        setForm((prev) => ({
          ...prev,
          headline: cause.headline || '',
          story: cause.story || '',
          category: cause.category || '',
          city: cause.city || '',
          state: cause.state || '',
          goal_amount: cause.goal_amount || '',
          accountability: cause.accountability || '',
        }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const flash = (message) => {
    setOk(message);
    setTimeout(() => setOk(''), 3000);
  };

  const handleCreateCause = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setProfileBlocked(false);
    try {
      const res = await spacesApi.create({
        type: 'cause',
        name: createForm.name.trim(),
        // Campos vazios não viajam: o backend aceita ausência, e mandar ''
        // gravaria vitrine com string vazia em vez de nulo.
        ...(createForm.headline.trim() && { headline: createForm.headline.trim() }),
        ...(createForm.city.trim() && { city: createForm.city.trim() }),
        // UF só viaja completa: o backend exige exatamente 2 letras e
        // devolveria 422 por uma tecla solta no campo.
        ...(createForm.state.trim().length === 2 && { state: createForm.state.trim() }),
      });

      const space = res.space;
      setSpaces([space]);
      // Não chamamos loadAll() aqui: `spaceId` ainda seria o valor antigo
      // (null) dentro deste closure. O useEffect de `spaceId` dispara o
      // carregamento assim que o estado novo entra.
      setSpaceId(space.id);
      flash('Causa criada. Agora conte a história dela.');
    } catch (err) {
      // 403 PROFILE_INCOMPLETE / PROFILE_INACTIVE — Gate 1 do backend.
      if (err.status === 403 && String(err.data?.code || '').startsWith('PROFILE')) {
        setProfileBlocked(true);
      }
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveShowcase = async (e) => {
    e.preventDefault();
    setBusy(true);
    setSaveError('');
    setSaveOk('');
    try {
      await causesApi.update(spaceId, {
        ...form,
        goal_amount: form.goal_amount === '' ? null : Number(form.goal_amount),
      });
      setSaveOk('Vitrine salva.');
      setTimeout(() => setSaveOk(''), 3000);
      await loadAll();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async (publish) => {
    setBusy(true);
    setPublishError('');
    setPublishOk('');
    try {
      const res = await causesApi.publish(spaceId, publish);
      setPublishOk(res.message);
      setTimeout(() => setPublishOk(''), 3000);
      await loadAll();
    } catch (err) {
      // A mensagem do backend diz o que falta (chamada, história).
      setPublishError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError('');
    try {
      await mediaApi.upload(spaceId, file);
      flash('Arquivo enviado. Aguarda revisão.');
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const handleModerate = async (mediaId, approve) => {
    setError('');
    try {
      await mediaApi.moderate(mediaId, approve);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Carregando...</div>;

  if (!spaces.length) {
    return (
      <div className="space-y-4 max-w-xl">
        <header>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <HeartHandshake className="w-6 h-6" />
            Criar minha causa
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Você ainda não tem nenhuma causa. Comece com o nome — não é preciso
            CNPJ. A história, as fotos e os QR Codes vêm no passo seguinte.
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {error}
              {profileBlocked && (
                <>
                  {' '}
                  <Link to="/profile" className="font-bold underline">
                    Completar meu cadastro
                  </Link>
                </>
              )}
            </span>
          </div>
        )}

        <form
          onSubmit={handleCreateCause}
          className="bg-white border border-gray-200 rounded-xl p-5 space-y-3"
        >
          <label className="block text-sm">
            <span className="block font-bold text-gray-700 mb-1">
              Nome da causa <span className="text-red-600">*</span>
            </span>
            <input
              type="text" required maxLength={255}
              placeholder="Ex.: Patas do Bairro"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="block font-bold text-gray-700 mb-1">
              Chamada curta <span className="text-gray-400 font-normal">(opcional)</span>
            </span>
            <input
              type="text" maxLength={255}
              placeholder="Ex.: Resgate e cuidado de animais atropelados"
              value={createForm.headline}
              onChange={(e) => setCreateForm({ ...createForm, headline: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm sm:col-span-2">
              <span className="block font-bold text-gray-700 mb-1">
                Cidade <span className="text-gray-400 font-normal">(opcional)</span>
              </span>
              <input
                type="text" maxLength={120}
                value={createForm.city}
                onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-sm">
              <span className="block font-bold text-gray-700 mb-1">
                UF <span className="text-gray-400 font-normal">(opcional)</span>
              </span>
              {/* O backend valida `size:2`: qualquer coisa fora disso volta 422. */}
              <input
                type="text" maxLength={2}
                value={createForm.state}
                onChange={(e) =>
                  setCreateForm({ ...createForm, state: e.target.value.toUpperCase() })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={busy || !createForm.name.trim()}
            className="bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {busy ? 'Criando...' : 'Criar causa'}
          </button>
        </form>
      </div>
    );
  }

  const pending = media.filter((m) => m.status === 'pending');

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <HeartHandshake className="w-6 h-6" />
          Minha causa
        </h1>

        {spaces.length > 1 && (
          <select
            value={spaceId || ''}
            onChange={(e) => setSpaceId(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {ok && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded p-3 text-sm">
          {ok}
        </div>
      )}

      {/* Vitrine */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-900">Vitrine pública</h2>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${detail?.cause?.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
              {detail?.cause?.is_published ? 'Publicada' : 'Não publicada'}
            </span>
            {detail?.cause?.is_published && detail?.slug && (
              <Link to={`/causa/${detail.slug}`} target="_blank" className="text-sm text-brand-blue hover:underline ml-2">
                Ver página pública
              </Link>
            )}
          </div>

          <div>
            {!detail?.cause?.is_published ? (
              <button
                type="button"
                onClick={() => handlePublish(true)}
                disabled={busy || !form.headline.trim() || !form.story.trim()}
                className="bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                Publicar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handlePublish(false)}
                disabled={busy}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                Tornar não publicada
              </button>
            )}
            {publishOk && <div className="text-sm font-medium text-emerald-600 mt-2 text-right">{publishOk}</div>}
            {publishError && <div className="text-sm font-medium text-red-600 mt-2 text-right">{publishError}</div>}
          </div>
        </div>

        {!detail?.cause?.is_published && (
          <div className="mb-4 text-sm bg-gray-50 p-3 rounded border border-gray-200">
            <p className="font-bold mb-2">Preencha e salve a vitrine antes de publicar.</p>
            <ul className="text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                {form.headline.trim() ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-red-600" />}
                Chamada curta
              </li>
              <li className="flex items-center gap-2">
                {form.story.trim() ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-red-600" />}
                História
              </li>
            </ul>
          </div>
        )}

        <form onSubmit={handleSaveShowcase} className="space-y-3">
          <input
            type="text" required maxLength={255}
            placeholder="Chamada curta (ex.: Resgate e cuidado de animais atropelados)"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />

          <textarea
            rows={4} maxLength={5000}
            placeholder="A história da causa: o que vocês fazem, para quem, desde quando."
            value={form.story}
            onChange={(e) => setForm({ ...form, story: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />

          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="text" maxLength={50} placeholder="Categoria"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              type="text" maxLength={120} placeholder="Cidade"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              type="text" maxLength={2} placeholder="UF"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              type="number" min="0" step="0.01" placeholder="Meta (R$)"
              value={form.goal_amount}
              onChange={(e) => setForm({ ...form, goal_amount: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <textarea
            rows={4} maxLength={10000}
            placeholder="Prestação de contas: o que foi feito com o que foi arrecadado."
            value={form.accountability}
            onChange={(e) => setForm({ ...form, accountability: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />

          <div>
            {saveError && <div className="text-sm font-medium text-red-600 mb-2">{saveError}</div>}
            {saveOk && <div className="text-sm font-medium text-emerald-600 mb-2">{saveOk}</div>}
            <button
              type="submit" disabled={busy}
              className="bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {busy ? 'Salvando...' : 'Salvar vitrine'}
            </button>
          </div>
        </form>
      </section>

      {/* Mídia e moderação */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">
            Fotos e vídeos
            {pending.length > 0 && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {pending.length} aguardando revisão
              </span>
            )}
          </h2>

          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1">
            <Upload className="w-4 h-4" />
            Enviar
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Tudo passa por revisão antes de aparecer na vitrine. Confira se não
          há rosto de criança sem autorização, endereço ou documento visível
          ao fundo.
        </p>

        {media.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum arquivo enviado.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {media.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {item.status === 'approved' ? (
                  item.is_video
                    ? <video src={item.url} className="w-full aspect-square object-cover" />
                    : <img src={item.url} alt="" className="w-full aspect-square object-cover" />
                ) : (
                  // Pendente e reprovada não são exibidas nem para quem
                  // modera pela miniatura pública: a rota só serve aprovada.
                  <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-xs text-gray-500 text-center p-2">
                    {item.status === 'pending' ? 'Aguardando revisão' : 'Reprovada'}
                  </div>
                )}

                <div className="p-2 flex items-center justify-between gap-1">
                  <span className="text-xs text-gray-500 truncate">
                    {(item.size_bytes / 1024 / 1024).toFixed(1)} MB
                  </span>

                  {item.status === 'pending' && (
                    <span className="flex gap-1">
                      <button
                        onClick={() => handleModerate(item.id, true)}
                        className="text-emerald-600 p-1"
                        title="Aprovar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleModerate(item.id, false)}
                        className="text-red-600 p-1"
                        title="Reprovar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <CauseProductsBlock spaceId={spaceId} />

      {/* Doações */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-bold text-gray-900 mb-4">Doações recebidas</h2>
        {donations.length === 0 ? (
          <p className="text-sm text-gray-500">Ainda não há doações registradas para esta causa.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-2 px-3 font-medium">Data</th>
                  <th className="py-2 px-3 font-medium">Doador</th>
                  <th className="py-2 px-3 font-medium">Valor</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium">Método</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 whitespace-nowrap text-gray-600">
                      {new Date(d.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 text-gray-900 font-medium">{d.donor_name}</td>
                    <td className="py-2 px-3 text-brand-blue font-bold">
                      {Number(d.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        d.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        d.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        d.status === 'cancelled' || d.status === 'refunded' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {d.status === 'paid' ? 'Pago' :
                         d.status === 'pending' ? 'Pendente' :
                         d.status === 'cancelled' ? 'Cancelado' :
                         d.status === 'refunded' ? 'Estornado' : d.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-500 uppercase text-xs">{d.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
