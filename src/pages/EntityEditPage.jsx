import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useEntityEdit } from '../hooks/useEntityEdit';
import { useEntityQr } from '../hooks/useEntityQr';
import { useEntityMedia } from '../hooks/useEntityMedia';
import { ENTITY_EDIT_TEXTS } from '../constants/entityEdit';
import EntityMediaBlock from '../components/EntityMediaBlock';
import EntityEditFields from '../components/EntityEditFields';

export default function EntityEditPage() {
  const { uniqueCode } = useParams();
  const navigate = useNavigate();
  const [showQr, setShowQr] = useState(false);

  const editLogic = useEntityEdit(uniqueCode);
  const { qrBase64, loading: qrLoading } = useEntityQr(uniqueCode);
  const { mediaUrl } = useEntityMedia(uniqueCode);

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

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async () => {
    setErrorMessage('');
    const success = await editLogic.save();
    if (success) {
      setSuccessMessage(ENTITY_EDIT_TEXTS.saveSuccess);
      setTimeout(() => navigate('/painel'), 1500);
    } else {
      setErrorMessage(editLogic.error || 'Erro ao salvar.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(ENTITY_EDIT_TEXTS.confirmDelete)) {
      setErrorMessage('');
      const success = await editLogic.remove();
      if (success) {
        setSuccessMessage(ENTITY_EDIT_TEXTS.deleteSuccess);
        setTimeout(() => navigate('/painel'), 1500);
      } else {
        setErrorMessage(editLogic.error || 'Erro ao excluir.');
      }
    }
  };

  const previewUrl = useMemo(() => {
    if (editLogic.stagedFile) return URL.createObjectURL(editLogic.stagedFile);
    if (editLogic.removePhoto) return null;
    return mediaUrl;
  }, [editLogic.stagedFile, editLogic.removePhoto, mediaUrl]);

  useEffect(() => {
    return () => {
      if (editLogic.stagedFile && previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [editLogic.stagedFile, previewUrl]);

  if (editLogic.loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (editLogic.error || errorMessage) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg max-w-4xl mx-auto mt-6">
        {errorMessage || editLogic.error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {successMessage && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg max-w-4xl mx-auto mt-4 mb-4">
          {successMessage}
        </div>
      )}
      

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
              <EntityMediaBlock 
                previewUrl={previewUrl}
                onPickFile={(file) => {
                  editLogic.setStagedFile(file);
                  editLogic.setRemovePhoto(false);
                }}
                onAskRemove={() => {
                  editLogic.setStagedFile(null);
                  editLogic.setRemovePhoto(true);
                }}
                pending={editLogic.saving}
              />
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

