import { useState, useRef } from 'react';
import { ENTITY_EDIT_TEXTS } from '../constants/entityEdit';
import { Upload, Trash2, AlertCircle } from 'lucide-react';

export default function EntityMediaBlock({ previewUrl, onPickFile, onAskRemove, pending }) {
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExts = ['jpg', 'jpeg', 'png', 'webp'];
    const ext = file.name.split('.').pop().toLowerCase();
    
    const isTypeValid = file.type ? validTypes.includes(file.type) : false;
    const isExtValid = validExts.includes(ext);

    if (!isTypeValid && !isExtValid) {
      setErrorMsg(ENTITY_EDIT_TEXTS.invalidMediaFormat);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('O arquivo é muito grande (máximo 20MB).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    onPickFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = () => {
    if (!window.confirm('Tem certeza que deseja remover a foto?')) return;
    onAskRemove();
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50 border rounded-xl flex items-center justify-center">
        {pending ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
        ) : previewUrl ? (
          <>
            <img src={previewUrl} alt="Foto" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute bottom-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={handleRemove}
                disabled={pending}
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
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Upload size={16} />
            {pending ? 'Salvando...' : ENTITY_EDIT_TEXTS.uploadMedia}
          </button>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 px-1">{ENTITY_EDIT_TEXTS.mediaSaveHint}</p>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg flex items-start gap-1">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
