import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useEntityEdit } from '../hooks/useEntityEdit';
import { useEntityQr } from '../hooks/useEntityQr';
import { ENTITY_EDIT_TEXTS } from '../constants/entityEdit';
import EntityMediaBlock from '../components/EntityMediaBlock';
import EntityEditFields from '../components/EntityEditFields';
import Breadcrumbs from '../components/Breadcrumbs';

export default function EntityEditPage() {
  const { uniqueCode } = useParams();
  const navigate = useNavigate();
  const [showQr, setShowQr] = useState(false);

  const editLogic = useEntityEdit(uniqueCode);
  const { qrBase64, loading: qrLoading } = useEntityQr(uniqueCode);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (editLogic.dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editLogic.dirty]);

  const handleDiscard = () => {
    if (window.confirm(ENTITY_EDIT_TEXTS.confirmDiscard)) {
      editLogic.discard();
    }
  };

  const handleSave = async () => {
    const success = await editLogic.save();
    if (success) {
      alert(ENTITY_EDIT_TEXTS.saveSuccess);
      navigate('/painel');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(ENTITY_EDIT_TEXTS.confirmDelete)) {
      const success = await editLogic.remove();
      if (success) {
        alert(ENTITY_EDIT_TEXTS.deleteSuccess);
        navigate('/painel');
      }
    }
  };

  if (editLogic.loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (editLogic.error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg max-w-4xl mx-auto mt-6">
        {editLogic.error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="mb-6">
        <Breadcrumbs 
          items={[
            { label: 'Painel', to: '/painel' },
            { label: editLogic.data?.form?.name || 'Editar QR Code' }
          ]} 
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Photo & QR */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-4 relative overflow-hidden flex flex-col items-center justify-center aspect-square">
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="absolute top-3 right-3 z-20 bg-white/90 p-2 rounded-full shadow hover:bg-white text-gray-700 transition-colors"
              title="Alternar entre foto e QR Code"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {showQr ? (
              qrLoading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
              ) : qrBase64 ? (
                <img src={qrBase64} alt="QR Code" className="w-full h-full object-contain p-4 absolute inset-0" />
              ) : (
                <span className="text-gray-400 text-sm">QR Code indisponível</span>
              )
            ) : (
              <EntityMediaBlock uniqueCode={uniqueCode} />
            )}
          </div>
        </div>

        {/* Right Column: Fields */}
        <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Editar Informações</h2>
          <EntityEditFields uniqueCode={uniqueCode} data={editLogic.data} {...editLogic} />
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center px-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={editLogic.saving}
            className="text-red-600 font-medium hover:underline text-sm disabled:opacity-50"
          >
            {ENTITY_EDIT_TEXTS.delete}
          </button>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={!editLogic.dirty || editLogic.saving}
              className="px-6 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50"
            >
              {ENTITY_EDIT_TEXTS.discard}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!editLogic.dirty || editLogic.saving}
              className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-brand-accent hover:bg-brand-accent-strong transition disabled:opacity-50"
            >
              {editLogic.saving ? 'Salvando...' : ENTITY_EDIT_TEXTS.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
