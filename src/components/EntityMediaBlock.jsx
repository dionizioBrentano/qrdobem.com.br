import { useState } from 'react';
import { ENTITY_EDIT_TEXTS } from '../constants/entityEdit';
import { Upload, Trash2, AlertCircle } from 'lucide-react';
import { useEntityMedia } from '../hooks/useEntityMedia';

export default function EntityMediaBlock({ uniqueCode }) {
  const { mediaUrl, loading, uploadMedia, removeMedia } = useEntityMedia(uniqueCode);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getErrorMessage = (err) => {
    return err.data?.error || 
           err.data?.message || 
           err.data?.errors?.file?.[0] || 
           err.data?.received || 
           err.message || 
           ENTITY_EDIT_TEXTS.mediaError;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg(ENTITY_EDIT_TEXTS.invalidMediaFormat);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('O arquivo é muito grande (máximo 20MB).');
      return;
    }

    setUploading(true);
    try {
      await uploadMedia(file);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Tem certeza que deseja remover a foto?')) return;
    setUploading(true);
    setErrorMsg('');
    try {
      await removeMedia();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50 border rounded-xl flex items-center justify-center">
        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
        ) : mediaUrl ? (
          <>
            <img src={mediaUrl} alt="Foto" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute bottom-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="p-2 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition"
                title={ENTITY_EDIT_TEXTS.removeMedia}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full absolute inset-0 text-gray-400">
            <span className="text-sm">{ENTITY_EDIT_TEXTS.noPhoto}</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-4 flex justify-center z-10">
          <button
            type="button"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/jpeg,image/png,image/webp';
              input.onchange = (e) => {
                 handleFileChange({ target: { files: e.target.files } });
              };
              input.click();
            }}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Upload size={16} />
            {uploading ? 'Enviando...' : ENTITY_EDIT_TEXTS.uploadMedia}
          </button>
        </div>
      </div>
      
      {errorMsg && (
        <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg flex items-start gap-1">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
