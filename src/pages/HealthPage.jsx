import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeartPulse, Pill, CalendarPlus, ScanBarcode, Plus, AlertCircle, Check } from 'lucide-react';
import { healthApi, entitiesApi } from '../services/api';

/**
 * HealthPage — diário de saúde e medicação.
 * Fase 6, T1-R08 a T1-R11 do PLANO_TRILHAS_2026-08.md.
 *
 * O PRINCÍPIO QUE GOVERNA ESTA TELA
 * O sistema SUGERE horários, EXIBE de onde tirou, e EXIGE confirmação.
 * Nunca decide sozinho. Quando o intervalo vem da bula, a tela diz isso em
 * texto — e diz para conferir com quem prescreveu.
 *
 * CÓDIGO DE BARRAS
 * A base de medicamentos cresce por confirmação: escaneia, o sistema
 * mostra o que achou, o usuário responde se é aquele produto mesmo. Quem
 * tem a caixa na mão é a única pessoa capaz de dizer se está certo.
 */

const MEASURE_SUGGESTIONS = ['Pressão', 'Glicemia', 'Peso', 'Temperatura'];

export default function HealthPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [entities, setEntities] = useState([]);
  const [code, setCode] = useState(searchParams.get('qr') || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  // Fluxo do código de barras: guarda o produto encontrado enquanto o
  // usuário não responde se está certo.
  const [scanned, setScanned] = useState(null);
  const [ean, setEan] = useState('');

  const [prescription, setPrescription] = useState({
    medication_name: '', dosage: '', interval_hours: '', first_dose_at: '08:00',
  });

  const [diary, setDiary] = useState({
    kind: 'note', title: '', description: '', measure_key: '', measure_value: '',
  });

  useEffect(() => {
    entitiesApi.list()
      .then((res) => {
        const list = (res.entities || []).filter((e) => e.type !== 'object');
        setEntities(list);
        if (!code && list.length) setCode(list[0].unique_code);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!code) return;
    load();
    setSearchParams({ qr: code }, { replace: true });
  }, [code]);

  const load = async () => {
    setError('');
    try {
      setData(await healthApi.show(code));
    } catch (err) {
      setError(err.message);
    }
  };

  const flash = (msg) => {
    setOk(msg);
    setTimeout(() => setOk(''), 4000);
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await healthApi.lookupMedication(ean);
      setScanned(res);

      // Já confiável: preenche direto, sem perguntar.
      if (!res.needs_confirmation) {
        setPrescription((p) => ({ ...p, medication_name: res.medication.name }));
        setScanned(null);
        flash(`Identificado: ${res.medication.name}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmMedication = async (isCorrect) => {
    setBusy(true);
    setError('');
    try {
      const res = await healthApi.confirmMedication(scanned.medication.id, isCorrect);

      if (isCorrect) {
        setPrescription((p) => ({ ...p, medication_name: res.medication.name }));
        flash('Obrigado por confirmar.');
      } else {
        // Correção: o nome fica em branco para o usuário digitar o certo.
        setPrescription((p) => ({ ...p, medication_name: '' }));
        flash('Obrigado. Digite o nome correto abaixo.');
      }

      setScanned(null);
      setEan('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await healthApi.createPrescription(code, {
        ...prescription,
        interval_hours: prescription.interval_hours === '' ? null : Number(prescription.interval_hours),
      });

      setPrescription({ medication_name: '', dosage: '', interval_hours: '', first_dose_at: '08:00' });
      flash(res.warning || 'Prescrição criada.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAddDiary = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await healthApi.addDiaryEntry(code, diary);
      setDiary({ kind: 'note', title: '', description: '', measure_key: '', measure_value: '' });
      flash('Registro adicionado.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Carregando...</div>;

  if (!entities.length) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
        Cadastre um QR Code de pessoa ou pet para usar o diário de saúde.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <HeartPulse className="w-6 h-6" />
          Saúde
        </h1>

        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {entities.map((e) => (
            <option key={e.unique_code} value={e.unique_code}>{e.name}</option>
          ))}
        </select>
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

      {/* Código de barras */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
          <ScanBarcode className="w-5 h-5" />
          Identificar remédio pelo código de barras
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Digite ou escaneie o código da caixa. Se ainda não conhecermos,
          vamos procurar e pedir sua confirmação.
        </p>

        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={20}
            placeholder="7899547500363"
            value={ean}
            onChange={(e) => setEan(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 font-mono text-sm"
          />
          <button
            type="submit"
            disabled={busy || !ean}
            className="bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            Buscar
          </button>
        </form>

        {/* A pergunta que constrói a base. */}
        {scanned && (
          <div className="mt-3 border-2 border-amber-400 bg-amber-50 rounded-lg p-4">
            <p className="font-bold text-amber-900 mb-1">
              {scanned.question || 'Este é o produto que você comprou?'}
            </p>
            <p className="text-gray-900 font-bold">{scanned.medication.name}</p>
            {scanned.medication.presentation && (
              <p className="text-sm text-gray-600">{scanned.medication.presentation}</p>
            )}
            {scanned.medication.laboratory && (
              <p className="text-xs text-gray-500">{scanned.medication.laboratory}</p>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleConfirmMedication(true)}
                disabled={busy}
                className="flex-1 bg-emerald-600 text-white font-bold py-2 rounded flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                Sim, é este
              </button>
              <button
                onClick={() => handleConfirmMedication(false)}
                disabled={busy}
                className="flex-1 border border-gray-300 bg-white font-bold py-2 rounded"
              >
                Não é este
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Prescrições */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Pill className="w-5 h-5" />
          Medicações ({data?.prescriptions?.length ?? 0})
        </h2>

        <form onSubmit={handleCreatePrescription} className="grid gap-2 md:grid-cols-4 mb-4">
          <input
            type="text" required maxLength={255} placeholder="Nome do remédio"
            value={prescription.medication_name}
            onChange={(e) => setPrescription({ ...prescription, medication_name: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-2"
          />
          <input
            type="text" maxLength={120} placeholder="Dose (1 comprimido)"
            value={prescription.dosage}
            onChange={(e) => setPrescription({ ...prescription, dosage: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <input
            type="number" min="1" max="168" placeholder="A cada X horas"
            value={prescription.interval_hours}
            onChange={(e) => setPrescription({ ...prescription, interval_hours: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <label className="text-sm md:col-span-2">
            <span className="block text-xs text-gray-500 mb-1">Primeira dose</span>
            <input
              type="time"
              value={prescription.first_dose_at}
              onChange={(e) => setPrescription({ ...prescription, first_dose_at: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
            />
          </label>
          <button
            type="submit" disabled={busy}
            className="bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-4 py-2 rounded text-sm md:col-span-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Adicionar medicação
          </button>
        </form>

        {data?.prescriptions?.length > 0 && (
          <ul className="space-y-2">
            {data.prescriptions.map((p) => (
              <li key={p.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">
                      {p.medication_name}
                      {p.dosage && <span className="font-normal text-gray-600"> — {p.dosage}</span>}
                    </p>
                    <p className="text-sm text-gray-600">
                      {p.schedule_times?.length
                        ? p.schedule_times.join(' · ')
                        : 'Sem horários definidos'}
                    </p>
                    {/* A fonte da sugestão, sempre visível. */}
                    {p.suggested_from_leaflet && (
                      <p className="text-xs text-amber-700 mt-1">
                        Horários sugeridos pela bula — confira com quem prescreveu.
                      </p>
                    )}
                  </div>

                  <a
                    href={`${p.calendar_url}?id_token=${encodeURIComponent(localStorage.getItem('firebase_token') || '')}`}
                    className="text-xs border border-gray-300 px-3 py-1.5 rounded font-bold flex items-center gap-1"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Agenda
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Diário */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-bold text-gray-900 mb-3">Diário de saúde</h2>

        <form onSubmit={handleAddDiary} className="grid gap-2 md:grid-cols-4 mb-4">
          <select
            value={diary.kind}
            onChange={(e) => setDiary({ ...diary, kind: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            {Object.entries(data?.diary_kinds || {}).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <input
            type="text" required maxLength={255} placeholder="O que aconteceu"
            value={diary.title}
            onChange={(e) => setDiary({ ...diary, title: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-3"
          />

          <input
            type="text" maxLength={40} placeholder="Medida (opcional)"
            list="measure-suggestions"
            value={diary.measure_key}
            onChange={(e) => setDiary({ ...diary, measure_key: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <datalist id="measure-suggestions">
            {MEASURE_SUGGESTIONS.map((m) => <option key={m} value={m} />)}
          </datalist>

          <input
            type="text" maxLength={60} placeholder="Valor (12x8, 110 mg/dL...)"
            value={diary.measure_value}
            onChange={(e) => setDiary({ ...diary, measure_value: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />

          <button
            type="submit" disabled={busy}
            className="bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-4 py-2 rounded text-sm md:col-span-2 disabled:opacity-50"
          >
            Registrar
          </button>
        </form>

        {data?.diary?.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum registro ainda.</p>
        ) : (
          <ul className="space-y-2">
            {data?.diary?.map((d) => (
              <li key={d.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {d.kind_label}
                  </span>
                  <span className="font-bold text-gray-900">{d.title}</span>
                  {d.measure_value && (
                    <span className="text-gray-600">
                      {d.measure_key}: <strong>{d.measure_value}</strong>
                    </span>
                  )}
                </div>
                {d.description && <p className="text-gray-600 mt-1">{d.description}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(d.occurred_at).toLocaleString('pt-BR')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
