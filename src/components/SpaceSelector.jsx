import { Home, HeartHandshake, Building2, HandCoins, Layers } from 'lucide-react';

/**
 * SpaceSelector — troca do espaço de trilha ativo no painel.
 * Fase 0, entrega 0.6 do PLANO_TRILHAS_2026-08.md (fundação F1).
 *
 * Substitui, na prática, o seletor de organização: `Space` é a unidade de
 * produto (família, causa, empresa, doação), enquanto `Organization` é o
 * vínculo jurídico. O seletor de organização segue no lugar por enquanto —
 * quem tem mais de uma organização ainda precisa dele durante a transição.
 *
 * Não renderiza nada quando há um espaço só: seletor de uma opção é ruído.
 * A identificação do espaço ativo, nesse caso, fica na barra de identidade
 * do Layout.
 */

const TYPE_META = {
  family:   { label: 'Família', Icon: Home },
  cause:    { label: 'Causa',   Icon: HeartHandshake },
  company:  { label: 'Empresa', Icon: Building2 },
  donation: { label: 'Doação',  Icon: HandCoins },
};

export default function SpaceSelector({ spaces = [], activeSpaceId, onSelect }) {
  if (!spaces || spaces.length < 2) {
    return null;
  }

  return (
    <div className="mb-6">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
        <Layers className="w-3.5 h-3.5" />
        Espaço ativo
      </label>

      <div className="flex flex-wrap gap-2">
        {spaces.map((space) => {
          const meta = TYPE_META[space.type] || { label: space.type, Icon: Layers };
          const { Icon } = meta;
          const isActive = String(space.id) === String(activeSpaceId);

          return (
            <button
              key={space.id}
              type="button"
              onClick={() => onSelect(space.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition ${
                isActive
                  ? 'border-brand-blue bg-brand-blue text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-brand-blue'
              }`}
              aria-pressed={isActive}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-[180px]">{space.name}</span>
              <span
                className={`text-xs font-normal ${isActive ? 'text-white/80' : 'text-gray-500'}`}
              >
                {meta.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
