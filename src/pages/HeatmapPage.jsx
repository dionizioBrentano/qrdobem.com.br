import { useEffect, useState } from 'react';
import { Map, AlertCircle } from 'lucide-react';
import { heatmapApi } from '../services/api';

/**
 * HeatmapPage — mapa de calor público das leituras de QR.
 * Fase 6, T2-R07 do PLANO_TRILHAS_2026-08.md.
 *
 * POR QUE SVG E NÃO BIBLIOTECA DE MAPA
 * Leaflet ou Google Maps trariam dependência nova, chave de API e ~150 KB
 * ao bundle. Para a leitura que interessa aqui — onde há concentração de
 * ocorrências —, uma projeção simples em SVG resolve, funciona offline e
 * não depende de contrato com ninguém.
 *
 * A camada de mapa base (ruas, cidades) pode entrar depois trocando só
 * este componente: os dados vêm agregados por célula e não mudam.
 *
 * Os dados são células de ~1,1 km, não pontos exatos — e a legenda diz
 * isso, para ninguém ler o mapa como endereço.
 */

import { TYPE_LABELS, TYPE_COLORS, TYPE_TEXT_CLASSES } from '../constants/heatmap';

export default function HeatmapPage() {
  const [cells, setCells] = useState([]);
  const [summary, setSummary] = useState([]);
  const [meta, setMeta] = useState(null);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, [type]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [cellsRes, summaryRes] = await Promise.all([
        heatmapApi.cells(type ? { type } : {}),
        heatmapApi.summary(),
      ]);
      setCells(cellsRes.cells || []);
      setMeta(cellsRes.meta || null);
      setSummary(summaryRes.summary || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Enquadramento a partir dos próprios dados: sem células, não há mapa a
  // desenhar, e um enquadramento fixo do Brasil deixaria tudo num canto.
  const bounds = cells.length ? {
    minLat: Math.min(...cells.map((c) => c.lat)),
    maxLat: Math.max(...cells.map((c) => c.lat)),
    minLng: Math.min(...cells.map((c) => c.lng)),
    maxLng: Math.max(...cells.map((c) => c.lng)),
  } : null;

  const W = 800;
  const H = 500;
  const PAD = 40;

  /** Projeção linear. Latitude invertida: no SVG, y cresce para baixo. */
  const project = (lat, lng) => {
    if (!bounds) return { x: 0, y: 0 };

    const spanLat = (bounds.maxLat - bounds.minLat) || 0.01;
    const spanLng = (bounds.maxLng - bounds.minLng) || 0.01;

    return {
      x: PAD + ((lng - bounds.minLng) / spanLng) * (W - PAD * 2),
      y: PAD + ((bounds.maxLat - lat) / spanLat) * (H - PAD * 2),
    };
  };

  const maxWeight = meta?.max_weight || 1;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Map className="w-6 h-6" />
          Mapa de calor
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Onde os QR Codes do QR do Bem são mais lidos.
        </p>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setType('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${
            type === '' ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white border-gray-300'
          }`}
        >
          Todos
        </button>
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setType(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${
              type === value ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white border-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="bg-white border border-gray-200 rounded-xl p-4 overflow-x-auto">
        {loading ? (
          <p className="text-gray-500 py-12 text-center">Carregando...</p>
        ) : cells.length === 0 ? (
          <p className="text-gray-400 py-12 text-center">
            Ainda não há leituras com localização registrada.
          </p>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Mapa de calor das leituras">
            <rect width={W} height={H} fill="#f8fafc" rx="8" />

            {cells.map((cell, index) => {
              const { x, y } = project(cell.lat, cell.lng);

              // Raio pela raiz do peso: proporcional à área, não ao raio.
              // Com escala linear, uma célula 100x maior viraria um círculo
              // que engoliria o mapa inteiro.
              const radius = 6 + Math.sqrt(cell.weight / maxWeight) * 26;
              const opacity = 0.25 + (cell.weight / maxWeight) * 0.45;

              return (
                <circle
                  key={`${cell.lat}-${cell.lng}-${cell.type}-${index}`}
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={TYPE_COLORS[cell.type] || '#64748b'}
                  opacity={opacity}
                >
                  <title>
                    {`${TYPE_LABELS[cell.type] || cell.type}: ${cell.weight} leitura(s)`}
                  </title>
                </circle>
              );
            })}
          </svg>
        )}

        {meta && cells.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            Cada círculo é uma região de aproximadamente {meta.cell_size_km} km,
            não um endereço. {meta.count} regiões exibidas.
          </p>
        )}
      </section>

      {summary.length > 0 && (
        <section className="grid gap-3 md:grid-cols-3">
          {summary.map((s) => (
            <div key={s.type} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">{TYPE_LABELS[s.type] || s.type}</p>
              <p className={`text-2xl font-black ${TYPE_TEXT_CLASSES[s.type] || 'text-gray-900'}`}>
                {s.reads.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-gray-400">{s.cells} regiões</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
