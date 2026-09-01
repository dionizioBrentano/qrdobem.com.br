import { ShieldAlert } from 'lucide-react';
import AdventureRoutineBlock from './AdventureRoutineBlock';
import EmergencyContactsList from './EmergencyContactsList';
import PanicButton from './PanicButton';

import { TYPES, HEALTH_FIELDS, SPECIES, SIZES, NEUTERED_STATES, HANDLING_FLAGS, PUBLIC_LABEL_MAX, MAX_CUSTOM_ATTRS, CUSTOM_ATTR_KEY_MAX, CUSTOM_ATTR_VALUE_MAX } from '../constants/entityFields';

export default function EntityEditFields({
  uniqueCode,
  data,
  updateForm,
  updatePet,
  updateObject,
  updateHealth,
  setBloodType,
  setBloodRh,
  addCustomAttr,
  updateCustomAttr,
  removeCustomAttr,
  addVaccination,
  updateVaccination,
  removeVaccination
}) {
  if (!data) return null;
  const { form, customAttrs, healthFields, petFields, vaccinations, objectFields, bloodType, bloodRh } = data;

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                  form.type === t.value
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : 'bg-white text-gray-600 border-gray-300'
                } opacity-60 cursor-not-allowed`}
                disabled
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateForm('name', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de contato *</label>
          <input
            type="tel"
            value={form.contact_phone}
            onChange={(e) => updateForm('contact_phone', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de contato</label>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => updateForm('contact_email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
          />
        </div>
      </div>

      {/* Pet Fields */}
      {form.type === 'pet' && (
        <div className="space-y-4 border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sobre o pet</label>
          
          <div>
            <label className="block text-sm text-gray-700 mb-1">Espécie *</label>
            <select
              value={petFields.species}
              onChange={(e) => updatePet('species', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
            >
              {SPECIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {petFields.species === 'other' && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Qual espécie? *</label>
              <input
                type="text"
                value={petFields.species_other_description}
                onChange={(e) => updatePet('species_other_description', e.target.value)}
                maxLength={255}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Porte</label>
              <select value={petFields.size} onChange={(e) => updatePet('size', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Não informar</option>
                {SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                <input type="checkbox" checked={petFields.size_is_public} onChange={(e) => updatePet('size_is_public', e.target.checked)} className="h-4 w-4" />
                <span className="text-xs text-gray-500">Tornar público</span>
              </label>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Castrado</label>
              <select value={petFields.is_neutered} onChange={(e) => updatePet('is_neutered', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Não informar</option>
                {NEUTERED_STATES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                <input type="checkbox" checked={petFields.is_neutered_is_public} onChange={(e) => updatePet('is_neutered_is_public', e.target.checked)} className="h-4 w-4" />
                <span className="text-xs text-gray-500">Tornar público</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Cor</label>
            <input type="text" value={petFields.color} onChange={(e) => updatePet('color', e.target.value)} placeholder="Caramelo, preto..." maxLength={255} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <label className="flex items-center gap-2 mt-1 cursor-pointer">
              <input type="checkbox" checked={petFields.color_is_public} onChange={(e) => updatePet('color_is_public', e.target.checked)} className="h-4 w-4" />
              <span className="text-xs text-gray-500">Tornar público</span>
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Características e particularidades</label>
            <textarea value={petFields.physical_description} onChange={(e) => updatePet('physical_description', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
            <label className="flex items-center gap-2 mt-1 cursor-pointer">
              <input type="checkbox" checked={petFields.physical_description_is_public} onChange={(e) => updatePet('physical_description_is_public', e.target.checked)} className="h-4 w-4" />
              <span className="text-xs text-gray-500">Tornar público</span>
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Cuidados</label>
            <textarea value={petFields.clinical_notes} onChange={(e) => updatePet('clinical_notes', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
            <label className="flex items-center gap-2 mt-1 cursor-pointer">
              <input type="checkbox" checked={petFields.clinical_notes_is_public} onChange={(e) => updatePet('clinical_notes_is_public', e.target.checked)} className="h-4 w-4" />
              <span className="text-xs text-gray-500">Tornar público</span>
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Vacinas</label>
            {vaccinations.length > 0 && (
              <div className="space-y-2 mb-2">
                {vaccinations.map((v, index) => (
                  <div key={v._id || index} className="flex gap-2">
                    <input type="text" placeholder="Nome" value={v.vaccine_name} onChange={(e) => updateVaccination(index, 'vaccine_name', e.target.value)} maxLength={255} className="flex-1 min-w-0 px-3 py-2 border rounded-lg text-sm" />
                    <input type="date" value={v.applied_at} onChange={(e) => updateVaccination(index, 'applied_at', e.target.value)} className="flex-1 min-w-0 px-3 py-2 border rounded-lg text-sm" />
                    <button type="button" onClick={() => removeVaccination(index)} className="px-2 text-gray-400 hover:text-red-600 text-xl">&times;</button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={addVaccination} className="text-sm text-brand-blue hover:underline">+ Adicionar vacina</button>
          </div>
        </div>
      )}

      {/* Object Fields */}
      {form.type === 'object' && (
        <div className="space-y-4 border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sobre o objeto</label>
          
          <div>
            <label className="block text-sm text-gray-700 mb-1">Descrição do objeto</label>
            <textarea value={objectFields.description} onChange={(e) => updateObject('description', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
            <label className="flex items-center gap-2 mt-1 cursor-pointer">
              <input type="checkbox" checked={objectFields.description_is_public} onChange={(e) => updateObject('description_is_public', e.target.checked)} className="h-4 w-4" />
              <span className="text-xs text-gray-500">Tornar público</span>
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Texto público (aparece impresso junto ao QR)</label>
            <textarea value={objectFields.public_label} onChange={(e) => updateObject('public_label', e.target.value)} rows={2} maxLength={PUBLIC_LABEL_MAX} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Avisos de manuseio</label>
            <div className="space-y-1">
              {HANDLING_FLAGS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={objectFields[key]} onChange={(e) => updateObject(key, e.target.checked)} className="h-4 w-4" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Outras instruções</label>
            <textarea value={objectFields.handling_notes_extra} onChange={(e) => updateObject('handling_notes_extra', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
          </div>
        </div>
      )}

      {/* Person Fields */}
      {form.type === 'person' && (
        <div className="space-y-4 border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Informações de saúde</label>
          
          <div>
            <label className="block text-sm text-gray-700 mb-1">Tipo sanguíneo e Fator RH</label>
            <div className="flex gap-2">
              <select value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="w-1/2 px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="">Não informar</option>
                <option value="A">A</option><option value="B">B</option><option value="AB">AB</option><option value="O">O</option>
              </select>
              <select value={bloodRh} onChange={(e) => setBloodRh(e.target.value)} disabled={!bloodType} className="w-1/2 px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="">(Sem RH)</option><option value="+">Positivo (+)</option><option value="-">Negativo (-)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 mt-1 cursor-pointer">
              <input type="checkbox" checked={Boolean(healthFields['blood_type']?.is_public)} onChange={(e) => updateHealth('blood_type', { is_public: e.target.checked })} className="h-4 w-4" />
              <span className="text-xs text-gray-500">Tornar público</span>
            </label>
          </div>

          {HEALTH_FIELDS.map(({ key, label, placeholder, restricted, emergencyOnly }) => (
            <div key={key}>
              <label className="block text-sm text-gray-700 mb-1">{label}</label>
              <input type="text" value={healthFields[key]?.value || ''} onChange={(e) => updateHealth(key, { value: e.target.value })} placeholder={placeholder} className="w-full px-3 py-2 border rounded-lg text-sm" />
              {restricted ? (
                <p className="text-xs text-gray-400 mt-1">Sempre privado (emergência).</p>
              ) : emergencyOnly ? (
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <input type="checkbox" checked={Boolean(healthFields[key]?.is_public)} onChange={(e) => updateHealth(key, { is_public: e.target.checked })} className="h-4 w-4" />
                  <span className="text-xs text-gray-500">Liberar em emergência</span>
                </label>
              ) : (
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <input type="checkbox" checked={Boolean(healthFields[key]?.is_public)} onChange={(e) => updateHealth(key, { is_public: e.target.checked })} className="h-4 w-4" />
                  <span className="text-xs text-gray-500">Tornar público</span>
                </label>
              )}
            </div>
          ))}

          <AdventureRoutineBlock uniqueCode={uniqueCode} onClose={() => {}} />
        </div>
      )}

      {/* Additional Info / Custom Attrs */}
      <div className="space-y-4 border-t pt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Informações adicionais</label>
          <textarea value={form.additional_info} onChange={(e) => updateForm('additional_info', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campos personalizados</label>
          {customAttrs.length > 0 && (
            <div className="space-y-2 mb-2">
              {customAttrs.map((attr, index) => (
                <div key={attr._id || index} className="flex gap-2">
                  <input type="text" placeholder="Chave" value={attr.key} onChange={(e) => updateCustomAttr(index, 'key', e.target.value)} maxLength={CUSTOM_ATTR_KEY_MAX} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  <input type="text" placeholder="Valor" value={attr.value} onChange={(e) => updateCustomAttr(index, 'value', e.target.value)} maxLength={CUSTOM_ATTR_VALUE_MAX} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  <button type="button" onClick={() => removeCustomAttr(index)} className="px-2 text-gray-400 hover:text-red-600 text-xl">&times;</button>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={addCustomAttr} disabled={customAttrs.length >= MAX_CUSTOM_ATTRS} className="text-sm text-brand-blue hover:underline">
            + Adicionar campo
          </button>
        </div>
      </div>

      {form.type === 'person' && form.space_id && (
        <div className="pt-5 border-t border-gray-100">
          <h3 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5" /> Proteção Ativa
          </h3>
          <div className="space-y-6">
            <PanicButton spaceId={form.space_id} entityId={form.id} />
            <EmergencyContactsList spaceId={form.space_id} entityId={form.id} />
          </div>
        </div>
      )}
    </div>
  );
}
