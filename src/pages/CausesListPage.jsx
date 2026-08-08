import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { HeartHandshake, MapPin, Search, ArrowLeft } from 'lucide-react';
import { causesApi } from '../services/api';
import PublicShell from '../components/layout/PublicShell';

/**
 * CausesListPage — vitrine pública de todas as causas.
 * Fase 3, T2-R04 do PLANO_TRILHAS_2026-08.md.
 *
 * Porta de entrada do visitante que ainda não é usuário: é aqui que ele
 * escolhe uma causa antes de doar. Sem esta tela, a vitrine individual
 * (/causa/{slug}) só era alcançável por link direto — e uma vitrine que
 * ninguém encontra não arrecada nada.
 *
 * Página pública, sem login.
 */

const CATEGORY_SUGGESTIONS = ['animal', 'criança', 'estomizado', 'idoso', 'moradia', 'saúde'];

export default function CausesListPage() {
  const [causes, setCauses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ q: '', category: '', state: '' });

  /**
   * Distingue "não há causa nenhuma" de "a busca não achou nada".
   *
   * A diferença importa: sem causa alguma, a página não deve existir
   * (decisão do proprietário, 06/08/2026) e o visitante volta à home. Já
   * uma busca sem resultado é situação normal — a pessoa filtrou por uma
   * cidade onde não há causa, e precisa poder limpar o filtro.
   */
  const [hasAnyCause, setHasAnyCause] = useState(null);
  const [filtered, setFiltered] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async (applied = null) => {
    setLoading(true);
    setError('');

    const isFiltered = applied !== null && Object.values(applied).some((v) => v);

    try {
      const res = await causesApi.list(applied || {});
      const list = res.causes || [];

      setCauses(list);
      setFiltered(isFiltered);

      // A primeira carga (sem filtro) é a que decide se a página existe.
      if (!isFiltered) {
        setHasAnyCause(list.length > 0);
      }
    } catch (err) {
      setError(err.message || 'Não foi possível carregar as causas.');
      if (!isFiltered) setHasAnyCause(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    load(filters);
  };

  const clearFilters = () => {
    setFilters({ q: '', category: '', state: '' });
    load();
  };

  // Nenhuma causa publicada: a página não deve existir. Volta à home em
  // vez de exibir uma vitrine vazia, que passaria a impressão de sistema
  // sem conteúdo.
  if (hasAnyCause === false) {
    return <Navigate to="/" replace />;
  }

  const money = (v) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <PublicShell>
      <div className="bg-gray-50 flex-1 w-full">
      <div className="max-w-5xl mx-auto p-4 pt-8 space-y-6">

        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <HeartHandshake className="w-6 h-6" />
              Causas para apoiar
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Escolha uma causa e acompanhe o que foi feito com o que já foi arrecadado.
            </p>
          </div>

          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Início
          </Link>
        </header>

        <form onSubmit={handleSearch} className="bg-white border border-gray-200 rounded-xl p-4 grid gap-2 md:grid-cols-4">
          <input
            type="text"
            placeholder="Buscar por nome"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm md:col-span-2"
          />

          <input
            type="text"
            list="category-suggestions"
            placeholder="Categoria"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <datalist id="category-suggestions">
            {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
          </datalist>

          <div className="flex gap-2">
            <input
              type="text"
              maxLength={2}
              placeholder="UF"
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value.toUpperCase() })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20"
            />
            <button
              type="submit"
              className="flex-1 bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-1"
            >
              <Search className="w-4 h-4" />
              Buscar
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 py-12 text-center">Carregando causas...</p>
        ) : causes.length === 0 ? (
          /* Só chega aqui com filtro aplicado: sem nenhuma causa, a página
             já redirecionou para a home. */
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-600">Nenhuma causa encontrada com esses filtros.</p>
            <button
              onClick={clearFilters}
              className="mt-4 bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-5 py-2 rounded-lg text-sm"
            >
              Ver todas as causas
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {causes.map((cause) => (
              <Link
                key={cause.slug}
                to={`/causa/${cause.slug}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-brand-blue transition block"
              >
                <div className="flex items-center gap-2 mb-1">
                  {cause.category && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {cause.category}
                    </span>
                  )}
                  {(cause.city || cause.state) && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {[cause.city, cause.state].filter(Boolean).join(' — ')}
                    </span>
                  )}
                </div>

                <h2 className="font-black text-gray-900">{cause.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{cause.headline}</p>

                <div className="mt-3">
                  <div className="flex items-end justify-between gap-2 mb-1">
                    <span className="text-lg font-black text-brand-blue">
                      {money(cause.raised_amount)}
                    </span>
                    {cause.goal_amount && (
                      <span className="text-xs text-gray-500">
                        de {money(cause.goal_amount)}
                      </span>
                    )}
                  </div>

                  {/* Barra só quando há meta declarada: nem toda causa
                      trabalha com meta, e barra sem meta seria inventada. */}
                  {cause.progress !== null && cause.progress !== undefined && (
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-blue h-2 rounded-full"
                        style={{ width: `${cause.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>
    </PublicShell>
  );
}
