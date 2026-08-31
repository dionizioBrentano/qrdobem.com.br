import { useState } from 'react';
import { User, Dog, Package, RefreshCw, Trash2, Edit, ExternalLink, Eye, AlertCircle } from 'lucide-react';
import { useEntityMedia } from '../hooks/useEntityCatalog';
import { useEntityQr } from '../hooks/useEntityQr';
import { ENTITY_TYPES, DASHBOARD_TEXTS } from '../constants/dashboard';

export default function EntityCard({ entity, onEdit, onViewQr, onDelete }) {
  const [showQr, setShowQr] = useState(false);
  const { mediaUrl, loading } = useEntityMedia(entity.unique_code);
  const { qrBase64, loading: qrLoading } = useEntityQr(entity.unique_code);

  const isActive = entity.status ? entity.status === 'active' : entity.is_active;

  const getPlaceholderIcon = () => {
    if (entity.type === 'pet') return <Dog className="w-12 h-12 text-gray-300" />;
    if (entity.type === 'object') return <Package className="w-12 h-12 text-gray-300" />;
    return <User className="w-12 h-12 text-gray-300" />;
  };

  const statusLabel = isActive ? DASHBOARD_TEXTS.statusActive : (entity.status === 'suspended' ? DASHBOARD_TEXTS.statusSuspended : DASHBOARD_TEXTS.statusPending);
  const typeLabel = ENTITY_TYPES[entity.type] || entity.type;

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
      {/* Front/Back Media Area */}
      <div className="relative aspect-square w-full bg-gray-50 border-b flex items-center justify-center">
        {showQr ? (
          qrLoading ? (
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
          ) : qrBase64 ? (
             <img src={qrBase64} alt="QR Code" className="w-full h-full object-contain p-4" loading="lazy" />
          ) : (
             <span className="text-gray-400 text-sm">Indisponível</span>
          )
        ) : (
          mediaUrl ? (
            <img 
              src={mediaUrl} 
              alt={entity.name} 
              className="w-full h-full object-cover" 
              loading="lazy" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              {loading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
              ) : (
                <>
                  {getPlaceholderIcon()}
                  <span className="text-xs text-gray-400 mt-2">{DASHBOARD_TEXTS.noPhoto}</span>
                </>
              )}
            </div>
          )
        )}
        
        <button
          type="button"
          onClick={() => setShowQr(!showQr)}
          className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow hover:bg-white text-gray-700 transition-colors"
          aria-label={showQr ? DASHBOARD_TEXTS.flipToPortrait : DASHBOARD_TEXTS.flipToQr}
          title={showQr ? DASHBOARD_TEXTS.flipToPortrait : DASHBOARD_TEXTS.flipToQr}
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {entity.has_active_emergency && (
          <div className="absolute top-3 left-3 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-sm">
            <AlertCircle className="w-3 h-3" />
            {DASHBOARD_TEXTS.emergency}
          </div>
        )}
      </div>

      {/* Info Area */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 text-lg truncate" title={entity.name}>
          {entity.name}
        </h3>
        <div className="flex items-center justify-between mt-1 mb-4">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
            entity.type === 'person' ? 'bg-blue-100 text-blue-700' :
            entity.type === 'pet' ? 'bg-amber-100 text-amber-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {typeLabel}
          </span>
          <div className="flex items-center text-xs text-gray-500">
            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
              isActive ? 'bg-brand-blue/100' :
              entity.status === 'suspended' ? 'bg-red-400' : 'bg-gray-300'
            }`} />
            {statusLabel}
          </div>
        </div>

        {/* Actions - wrap and stack on mobile */}
        <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onViewQr(entity)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-brand-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            {DASHBOARD_TEXTS.actions.viewQr}
          </button>
          
          <button
            type="button"
            onClick={() => onEdit(entity.unique_code)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            {DASHBOARD_TEXTS.actions.edit}
          </button>
          
          <a
            href={entity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {DASHBOARD_TEXTS.actions.openLink}
          </a>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(DASHBOARD_TEXTS.actions.confirmDelete)) {
                onDelete(entity);
              }
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {DASHBOARD_TEXTS.actions.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
