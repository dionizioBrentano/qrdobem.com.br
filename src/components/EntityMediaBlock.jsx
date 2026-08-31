import { useState, useEffect } from 'react';
import { entitiesApi } from '../services/api';
import { ENTITY_EDIT_TEXTS } from '../constants/entityEdit';
import { Upload, Trash2 } from 'lucide-react';

export default function EntityMediaBlock({ uniqueCode }) {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    entitiesApi.listMedia(uniqueCode)
      .then(res => {
        if (!isMounted) return;
        setMedia(res.media && res.media.length > 0 ? res.media[0] : null);
      })
      .catch(() => {
        // error handling omitted for brevity, fallback to null
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [uniqueCode]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('O arquivo é muito grande (máximo 20MB).');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await entitiesApi.uploadMedia(uniqueCode, formData);
      const mediaRes = await entitiesApi.listMedia(uniqueCode);
      setMedia(mediaRes.media && mediaRes.media.length > 0 ? mediaRes.media[0] : null);
    } catch (err) {
      alert(ENTITY_EDIT_TEXTS.mediaError);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!media) return;
    if (!window.confirm('Tem certeza que deseja remover a foto?')) return;

    setUploading(true);
    try {
      await entitiesApi.removeMedia(uniqueCode, media.id);
      setMedia(null);
    } catch (err) {
      alert(ENTITY_EDIT_TEXTS.mediaError);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-gray-50 aspect-square relative overflow-hidden">
      {loading ? (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
      ) : media ? (
        <>
          <img src={media.url} alt="Foto" className="w-full h-full object-cover absolute inset-0" />
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
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <span className="text-sm">{ENTITY_EDIT_TEXTS.noPhoto}</span>
        </div>
      )}

      {/* Ação de upload sempre disponível (sobrescreve se já existir) */}
      <div className="mt-4 z-10 w-full flex justify-center">
        <button
          type="button"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
               // wrap in pseudo-event shape for the existing handler
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
  );
}
