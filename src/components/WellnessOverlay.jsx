import { WELLNESS_REASON_TEXT, ADVENTURE_UI } from '../constants/adventure';

export default function WellnessOverlay({ check, onRespond, error, busy, children }) {
  if (!check) return null;

  const reasonText = WELLNESS_REASON_TEXT[check.reason] || WELLNESS_REASON_TEXT.manual;

  return (
    <div className="fixed inset-0 z-50 bg-brand-blue/95 flex flex-col justify-between p-6 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-black text-white mb-6">
          Você está bem?
        </h2>
        <p className="text-lg text-blue-100 mb-12 px-4">
          {reasonText}
        </p>

        <button
          onClick={() => onRespond(check)}
          disabled={busy}
          className={`w-full max-w-sm h-24 rounded-3xl text-3xl font-black shadow-2xl transition-all ${
            busy
              ? 'bg-green-300 text-green-800 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-400 text-white active:scale-95'
          }`}
        >
          {busy ? 'Enviando...' : ADVENTURE_UI.PROTECTION_IM_OK}
        </button>

        {error && (
          <p className="text-red-300 font-medium mt-6 bg-red-900/50 p-4 rounded-xl">
            {error}
          </p>
        )}
      </div>

      <div className="w-full pb-6">
        {children}
      </div>
    </div>
  );
}
