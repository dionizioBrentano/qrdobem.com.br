import { useEffect, useState } from 'react';
import { Users, Plus, Trash2, AlertCircle, Network } from 'lucide-react';
import { familyApi, entitiesApi } from '../services/api';

/**
 * FamilyPage — árvore genealógica do espaço familiar.
 * Fase 1, entrega 1.6 do PLANO_TRILHAS_2026-08.md (T1-R01, T1-R02).
 *
 * A árvore é um GRAFO, não uma hierarquia: cônjuges são ligação
 * horizontal, noras e genros entram por afinidade, segundos casamentos
 * criam meio-irmãos. Por isso a tela lista vínculos tipados em vez de
 * desenhar níveis fixos — desenho hierárquico mentiria sobre a estrutura.
 *
 * Versão desta entrega: cadastro e leitura dos vínculos, agrupados por
 * pessoa. O desenho gráfico da árvore (SVG com linhas) é refinamento
 * visual e não muda o modelo de dados — entra depois, sem migration.
 */
export default function FamilyPage() {
  const [spaceId, setSpaceId] = useState(null);
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    from_entity_id: '',
    to_entity_id: '',
    relation_type: 'parent_of',
    note: '',
  });

  // O espaço ativo vem da mesma fonte do painel: a listagem de entidades
  // devolve `active_space_id`. Evita inventar um segundo mecanismo de
  // contexto que poderia divergir do painel.
  useEffect(() => {
    let cancelled = false;

    async function loadSpace() {
      try {
        const res = await entitiesApi.list();
        if (cancelled) return;

        if (!res.active_space_id) {
          setError('Nenhum espaço familiar ativo. Crie um QR Code primeiro.');
          setLoading(false);
          return;
        }

        setSpaceId(res.active_space_id);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Não foi possível carregar o espaço.');
          setLoading(false);
        }
      }
    }

    loadSpace();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!spaceId) return;
    loadTree();
  }, [spaceId]);

  const loadTree = async () => {
    setLoading(true);
    setError('');
    try {
      setTree(await familyApi.tree(spaceId));
    } catch (err) {
      setError(err.message || 'Não foi possível carregar a árvore.');
    } finally {
      setLoading(false);
    }
  };

  const nameOf = (entityId) =>
    tree?.nodes.find((n) => n.entity_id === Number(entityId))?.name || `#${entityId}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await familyApi.addRelation(spaceId, {
        from_entity_id: Number(form.from_entity_id),
        to_entity_id: Number(form.to_entity_id),
        relation_type: form.relation_type,
        note: form.note || null,
      });

      setForm({ from_entity_id: '', to_entity_id: '', relation_type: 'parent_of', note: '' });
      setShowForm(false);
      await loadTree();
    } catch (err) {
      // A mensagem do backend é específica (ciclo, duplicata, fora do
      // espaço) e ajuda mais que um texto genérico.
      setError(err.message || 'Não foi possível criar o vínculo.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (relationshipId) => {
    if (!window.confirm('Tem certeza que deseja remover este vínculo?')) return;
    setError('');
    try {
      await familyApi.removeRelation(spaceId, relationshipId);
      await loadTree();
    } catch (err) {
      setError(err.message || 'Não foi possível remover o vínculo.');
    }
  };

  if (loading) {
    return <div className="text-gray-500 py-8">Carregando árvore...</div>;
  }

  // Agrupa as arestas por pessoa de origem: é como se lê uma família
  // ("o João é pai da Maria e cônjuge da Ana"), não como lista solta.
  const edgesByPerson = {};
  (tree?.edges || []).forEach((edge) => {
    (edgesByPerson[edge.from_entity_id] ||= []).push(edge);
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Network className="w-6 h-6" />
            Árvore da família
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {tree?.space?.name} — {tree?.nodes?.length ?? 0} perfis, {tree?.edges?.length ?? 0} vínculos.
            Sem limite de perfis.
          </p>
        </div>

        {tree?.nodes?.length >= 2 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Novo vínculo
          </button>
        )}
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {tree?.nodes?.length < 2 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-4 text-sm">
          É preciso ter ao menos dois perfis cadastrados neste espaço para
          criar um vínculo de parentesco.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-gray-200 rounded-xl p-4 bg-white space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm">
              <span className="block font-bold text-gray-700 mb-1">Quem</span>
              <select
                required
                value={form.from_entity_id}
                onChange={(e) => setForm({ ...form, from_entity_id: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Selecione...</option>
                {tree.nodes.map((n) => (
                  <option key={n.entity_id} value={n.entity_id}>{n.name}</option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="block font-bold text-gray-700 mb-1">É</span>
              <select
                value={form.relation_type}
                onChange={(e) => setForm({ ...form, relation_type: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {tree.relation_types.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="block font-bold text-gray-700 mb-1">De quem</span>
              <select
                required
                value={form.to_entity_id}
                onChange={(e) => setForm({ ...form, to_entity_id: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Selecione...</option>
                {tree.nodes.map((n) => (
                  <option key={n.entity_id} value={n.entity_id}>{n.name}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="text-sm block">
            <span className="block font-bold text-gray-700 mb-1">
              Observação <span className="font-normal text-gray-500">(opcional — ex.: "por afinidade", "guarda compartilhada")</span>
            </span>
            <input
              type="text"
              maxLength={255}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </label>

          {/* Pré-visualização da frase: evita o erro clássico de inverter
              quem é pai de quem. */}
          {form.from_entity_id && form.to_entity_id && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
              <strong>{nameOf(form.from_entity_id)}</strong>{' '}
              {tree.relation_types.find((t) => t.value === form.relation_type)?.label}{' '}
              <strong>{nameOf(form.to_entity_id)}</strong>
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-accent hover:bg-brand-accent-strong text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Criar vínculo'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-bold text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <section className="space-y-4">
        {(tree?.nodes || []).map((node) => {
          const edges = edgesByPerson[node.entity_id] || [];

          return (
            <div key={node.entity_id} className="border border-gray-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-gray-900">{node.name}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {node.type === 'pet' ? 'Pet' : node.type === 'person' ? 'Pessoa' : 'Objeto'}
                </span>
              </div>

              {edges.length === 0 ? (
                <p className="text-sm text-gray-400">Sem vínculos cadastrados.</p>
              ) : (
                <ul className="space-y-1">
                  {edges.map((edge) => (
                    <li key={edge.id} className="text-sm text-gray-700 flex items-center justify-between gap-2">
                      <span>
                        {edge.label} <strong>{nameOf(edge.to_entity_id)}</strong>
                        {edge.note && <span className="text-gray-500"> — {edge.note}</span>}
                      </span>
                      <button
                        onClick={() => handleRemove(edge.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Remover vínculo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
