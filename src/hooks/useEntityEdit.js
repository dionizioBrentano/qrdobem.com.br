import { useState, useEffect, useCallback } from 'react';
import { entitiesApi } from '../services/api';
import { resizeImageFile } from '../utils/resizeImageFile';

const EMPTY_PET_FIELDS = {
  species: 'dog', species_other_description: '', size: '', size_is_public: true,
  color: '', color_is_public: true, is_neutered: '', is_neutered_is_public: true,
  physical_description: '', physical_description_is_public: true,
  clinical_notes: '', clinical_notes_is_public: true,
  reference_contact: '', reference_contact_is_public: false,
};

const EMPTY_OBJECT_FIELDS = {
  description: '', description_is_public: false, public_label: '',
  handling_fragile: false, handling_light_sensitive: false, handling_keep_refrigerated: false,
  handling_do_not_invert: false, handling_sentimental_value: false, handling_notes_extra: '',
};

const HEALTH_FIELDS = [
  'allergies', 'chronic_conditions', 'continuous_medications', 
  'relevant_surgeries', 'substance_use_risk', 'caregiver_name', 'caregiver_contact'
];

export function useEntityEdit(uniqueCode) {
  const [snapshot, setSnapshot] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stagedFile, setStagedFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await entitiesApi.getForEdit(uniqueCode);
      
      const parsedData = {
        form: {
          id: res.id,
          space_id: res.space_id,
          type: res.type,
          name: res.name || '',
          contact_phone: res.contact_phone || '',
          contact_email: res.contact_email || '',
          additional_info: res.additional_info || '',
        },
        customAttrs: res.custom_attributes 
          ? Object.entries(res.custom_attributes).map(([key, value]) => ({ key, value, _id: crypto.randomUUID() }))
          : [],
        healthFields: {},
        bloodType: '',
        bloodRh: '',
        petFields: { ...EMPTY_PET_FIELDS },
        vaccinations: res.vaccinations ? res.vaccinations.map(v => ({ ...v, _id: v._id || crypto.randomUUID() })) : [],
        objectFields: { ...EMPTY_OBJECT_FIELDS }
      };

      if (res.health_fields) {
        res.health_fields.forEach(hf => {
          parsedData.healthFields[hf.field_key] = { value: hf.field_value, is_public: hf.is_public };
          if (hf.field_key === 'blood_type') {
            const val = hf.field_value || '';
            if (val.includes('+')) { parsedData.bloodRh = '+'; parsedData.bloodType = val.replace('+', '').trim(); }
            else if (val.includes('-')) { parsedData.bloodRh = '-'; parsedData.bloodType = val.replace('-', '').trim(); }
            else { parsedData.bloodRh = ''; parsedData.bloodType = val.trim(); }
          }
        });
      }

      if (res.type === 'pet' && res.pet_fields) {
        const pf = res.pet_fields;
        parsedData.petFields = {
          species: pf.species || 'dog',
          species_other_description: pf.species_other_description || '',
          size: pf.size || '',
          size_is_public: Boolean(pf.size_is_public ?? true),
          color: pf.color || '',
          color_is_public: Boolean(pf.color_is_public ?? true),
          is_neutered: pf.is_neutered || '',
          is_neutered_is_public: Boolean(pf.is_neutered_is_public ?? true),
          physical_description: pf.physical_description || '',
          physical_description_is_public: Boolean(pf.physical_description_is_public ?? true),
          clinical_notes: pf.clinical_notes || '',
          clinical_notes_is_public: Boolean(pf.clinical_notes_is_public ?? true),
          reference_contact: pf.reference_contact || '',
          reference_contact_is_public: Boolean(pf.reference_contact_is_public ?? false),
        };
      }

      if (res.type === 'object' && res.object_fields) {
        const of = res.object_fields;
        parsedData.objectFields = {
          description: of.description || '',
          description_is_public: Boolean(of.description_is_public),
          public_label: of.public_label || '',
          handling_fragile: Boolean(of.handling_fragile),
          handling_light_sensitive: Boolean(of.handling_light_sensitive),
          handling_keep_refrigerated: Boolean(of.handling_keep_refrigerated),
          handling_do_not_invert: Boolean(of.handling_do_not_invert),
          handling_sentimental_value: Boolean(of.handling_sentimental_value),
          handling_notes_extra: of.handling_notes_extra || '',
        };
      }

      setSnapshot(JSON.stringify(parsedData));
      setData(parsedData);
    } catch (err) {
      setError('Erro ao carregar dados da entidade.');
    } finally {
      setLoading(false);
    }
  }, [uniqueCode]);

  useEffect(() => {
    load();
  }, [load]);

  const updateForm = (k, v) => setData(p => ({ ...p, form: { ...p.form, [k]: v } }));
  const updatePet = (k, v) => setData(p => ({ ...p, petFields: { ...p.petFields, [k]: v } }));
  const updateObject = (k, v) => setData(p => ({ ...p, objectFields: { ...p.objectFields, [k]: v } }));
  const updateHealth = (k, patch) => setData(p => ({ ...p, healthFields: { ...p.healthFields, [k]: { value: '', is_public: false, ...(p.healthFields[k] || {}), ...patch } } }));
  
  const setBloodType = (v) => setData(p => ({ ...p, bloodType: v }));
  const setBloodRh = (v) => setData(p => ({ ...p, bloodRh: v }));

  const addCustomAttr = () => setData(p => p.customAttrs.length >= 20 ? p : { ...p, customAttrs: [...p.customAttrs, { _id: crypto.randomUUID(), key: '', value: '' }] });
  const updateCustomAttr = (idx, k, v) => setData(p => ({ ...p, customAttrs: p.customAttrs.map((a, i) => i === idx ? { ...a, [k]: v } : a) }));
  const removeCustomAttr = (idx) => setData(p => ({ ...p, customAttrs: p.customAttrs.filter((_, i) => i !== idx) }));

  const addVaccination = () => setData(p => ({ ...p, vaccinations: [...p.vaccinations, { _id: crypto.randomUUID(), vaccine_name: '', applied_at: '' }] }));
  const updateVaccination = (idx, k, v) => setData(p => ({ ...p, vaccinations: p.vaccinations.map((a, i) => i === idx ? { ...a, [k]: v } : a) }));
  const removeVaccination = (idx) => setData(p => ({ ...p, vaccinations: p.vaccinations.filter((_, i) => i !== idx) }));

  const dirtyFields = snapshot !== null && data !== null && snapshot !== JSON.stringify(data);
  const dirty = dirtyFields || stagedFile !== null || removePhoto;

  const discard = () => {
    if (snapshot) setData(JSON.parse(snapshot));
    setStagedFile(null);
    setRemovePhoto(false);
  };

  const save = async () => {
    if (!dirty) return false;
    setSaving(true);
    setError('');
    
    try {
      if (stagedFile) {
        const ready = await resizeImageFile(stagedFile);
        const formData = new FormData();
        formData.append('file', ready);
        await entitiesApi.uploadMedia(uniqueCode, formData);
      } else if (removePhoto) {
        const res = await entitiesApi.listMedia(uniqueCode);
        const obj = res.media && res.media.length > 0 ? res.media[0] : null;
        if (obj) {
          await entitiesApi.removeMedia(uniqueCode, obj.id);
        }
      }

      if (dirtyFields) {
        const attributes = data.customAttrs.reduce((acc, { key, value }) => {
          const tk = key.trim();
          const tv = value.trim();
          if (tk && tv) acc[tk] = tv;
          return acc;
        }, {});

        const health = HEALTH_FIELDS.reduce((acc, key) => {
          const entry = data.healthFields[key];
          if (entry?.value?.trim()) {
            const restricted = ['continuous_medications', 'substance_use_risk'].includes(key);
            acc.push({
              field_key: key,
              field_value: entry.value.trim(),
              is_public: restricted ? false : Boolean(entry.is_public),
            });
          }
          return acc;
        }, []);

        const bloodStr = data.bloodType ? `${data.bloodType}${data.bloodRh}` : '';
        if (bloodStr) {
          health.push({
            field_key: 'blood_type',
            field_value: bloodStr,
            is_public: Boolean(data.healthFields['blood_type']?.is_public),
          });
        }

        const payload = {
          ...data.form,
          ...(Object.keys(attributes).length > 0 && { custom_attributes: attributes }),
          ...(health.length > 0 && { health_fields: health }),
          ...(data.form.type === 'pet' && {
            pet_fields: {
              ...data.petFields,
              species_other_description: data.petFields.species === 'other' ? data.petFields.species_other_description : null,
              size: data.petFields.size || null,
              is_neutered: data.petFields.is_neutered || null,
            },
            vaccinations: data.vaccinations.filter((v) => v.vaccine_name.trim() && v.applied_at),
          }),
          ...(data.form.type === 'object' && { object_fields: data.objectFields }),
        };

        await entitiesApi.update(uniqueCode, payload);
      }
      
      setStagedFile(null);
      setRemovePhoto(false);
      setSnapshot(JSON.stringify(data));
      return true;
    } catch (err) {
      setError(err.data?.error || err.message || 'Erro ao salvar alterações.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await entitiesApi.destroy(uniqueCode);
      return true;
    } catch (err) {
      setError(err.data?.error || err.message || 'Erro ao excluir.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    data,
    loading,
    saving,
    error,
    dirty,
    stagedFile,
    setStagedFile,
    removePhoto,
    setRemovePhoto,
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
    removeVaccination,
    discard,
    save,
    remove
  };
}
