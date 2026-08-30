import { Link } from 'react-router-dom';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { ADVENTURE_UI } from '../constants/adventure';
import { useAdventureRoutine } from '../hooks/useAdventureRoutine';
import AdventureWindowsBlock from './AdventureWindowsBlock';

export default function AdventureRoutineBlock({ uniqueCode, onClose }) {
  const a = useAdventureRoutine(uniqueCode);
  const orphanPoints = a.referencePoints.filter((pt) => !pt.routine_id);

  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Aventura / Rotina</h3>
      <p className="text-sm text-gray-500 mb-4">
        Cadastre uma trilha nomeada com pontos georreferenciados. Sem geocodificação nesta etapa: endereço é texto; latitude e longitude vêm da digitação ou da localização atual.
      </p>

      <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
        <h4 className="font-medium text-gray-800">Nome da trilha</h4>
        <input
          type="text"
          placeholder="Ex.: Plantão enfermeira"
          value={a.routineName}
          onChange={(e) => a.setRoutineName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-brand-blue"
        />
        <button
          type="button"
          onClick={a.saveRoutine}
          disabled={a.loading}
          className="px-3 py-2 bg-brand-blue text-white text-sm rounded w-full hover:bg-brand-blue-strong"
        >
          {a.loading ? 'Salvando...' : (a.routine?.id ? 'Atualizar trilha' : 'Salvar trilha')}
        </button>
        {a.routineError && <p className="text-xs text-red-600">{a.routineError}</p>}
        {a.routineMessage && <p className="text-xs text-green-600">{a.routineMessage}</p>}
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={a.skipAlertInsideTrail}
            onChange={(e) => a.setSkipAlertInsideTrail(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-blue"
          />
          {ADVENTURE_UI.SKIP_ALERT_LABEL}
        </label>
        <p className="text-xs text-gray-500">A flag entra no botão de salvar/atualizar a trilha.</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h4 className="font-medium text-gray-800 mb-2">Pontos da trilha</h4>
        {a.routinePoints.length > 0 ? (
          <ul className="mb-4 space-y-2">
            {a.routinePoints.map((pt) => (
              <li key={pt.id} className="flex justify-between items-center bg-white p-2 border border-gray-200 rounded">
                <span className="text-sm">
                  {pt.order_index ?? 0}. {pt.name}
                  {pt.address ? ` — ${pt.address}` : ''}
                  {' '}({pt.latitude}, {pt.longitude})
                </span>
                <button
                  type="button"
                  onClick={() => a.removeRoutinePoint(pt.id)}
                  className="text-red-500 hover:text-red-700"
                  disabled={a.loading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-500 mb-4">Nenhum ponto nesta trilha.</p>
        )}

        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nome (ex: Casa)"
            value={a.newPoint.name}
            onChange={(e) => a.setNewPoint({ ...a.newPoint, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-brand-blue"
          />
          <input
            type="text"
            placeholder="Endereço (texto, sem geocodificação)"
            value={a.newPoint.address}
            onChange={(e) => a.setNewPoint({ ...a.newPoint, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-brand-blue"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Latitude"
              value={a.newPoint.latitude}
              onChange={(e) => a.setNewPoint({ ...a.newPoint, latitude: e.target.value })}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-brand-blue"
            />
            <input
              type="text"
              placeholder="Longitude"
              value={a.newPoint.longitude}
              onChange={(e) => a.setNewPoint({ ...a.newPoint, longitude: e.target.value })}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Raio (m)"
              value={a.newPoint.radius_meters}
              onChange={(e) => a.setNewPoint({ ...a.newPoint, radius_meters: e.target.value })}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-brand-blue"
            />
            <input
              type="number"
              placeholder="Ordem"
              value={a.newPoint.order_index}
              onChange={(e) => a.setNewPoint({ ...a.newPoint, order_index: e.target.value })}
              className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
          <button
            type="button"
            onClick={a.useCurrentLocation}
            disabled={a.loading}
            className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded w-full hover:bg-gray-100"
          >
            Usar minha localização atual
          </button>
          <button
            type="button"
            onClick={a.addRoutinePoint}
            disabled={a.loading}
            className="px-3 py-2 bg-brand-blue text-white text-sm rounded w-full hover:bg-brand-blue-strong"
          >
            {a.loading ? 'Salvando...' : 'Adicionar ponto na trilha'}
          </button>
        </div>
      </div>

      {orphanPoints.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-gray-800 mb-2">Pontos sem trilha (não monitorados)</h4>
          <ul className="mb-2 space-y-2">
            {orphanPoints.map((pt) => (
              <li key={pt.id} className="flex justify-between items-center bg-white p-2 border border-gray-200 rounded">
                <span className="text-sm">{pt.name} (Lat: {pt.latitude}, Lng: {pt.longitude})</span>
                <button
                  type="button"
                  onClick={() => a.removeOrphanPoint(pt.id)}
                  className="text-red-500 hover:text-red-700"
                  disabled={a.loading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500">Pontos sem trilha não são monitorados. Recrie-os dentro da trilha.</p>
        </div>
      )}

      {a.routine?.id && (
        <AdventureWindowsBlock
          uniqueCode={uniqueCode}
          routine={a.routine}
          points={a.routinePoints}
        />
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-brand-accent" />
          Senha Silenciosa
        </h4>
        <p className="text-xs text-gray-600 mb-3 bg-brand-accent/10 border border-brand-accent/20 p-2 rounded">
          <strong>Aviso:</strong> A senha silenciosa é usada quando o sistema pergunta se você está fora da rotina. Ela aciona seus contatos de emergência sem mostrar nada na tela.
        </p>
        <input
          type="password"
          placeholder="Nova Senha (mínimo 6 caracteres)"
          value={a.silentPassword}
          onChange={(e) => a.setSilentPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-brand-blue mb-2"
        />
        {a.silentPasswordError && <p className="text-xs text-red-600 mb-2">{a.silentPasswordError}</p>}
        {a.silentPasswordMessage && <p className="text-xs text-green-600 mb-2">{a.silentPasswordMessage}</p>}
        <button
          type="button"
          onClick={a.saveSilentPassword}
          disabled={a.loading}
          className="px-3 py-2 border border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-white transition text-sm rounded w-full mb-3"
        >
          {a.loading ? 'Definindo...' : 'Definir Senha Silenciosa'}
        </button>
        <div className="text-center mt-2">
          <Link
            to={`/painel/aventura/challenge/${uniqueCode}`}
            onClick={onClose}
            className="text-xs text-brand-blue hover:underline"
          >
            Testar challenge de rotina
          </Link>
        </div>
      </div>
    </div>
  );
}

export { AdventureRoutineBlock };