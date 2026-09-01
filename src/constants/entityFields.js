export const TYPES = [
  { value: 'person', label: 'Pessoa' },
  { value: 'pet', label: 'Pet' },
  { value: 'object', label: 'Objeto' },
];

export const PROFILE_ERROR_CODES = ['PROFILE_INCOMPLETE', 'ADDRESS_REQUIRED'];

export const MAX_CUSTOM_ATTRS = 20;
export const CUSTOM_ATTR_KEY_MAX = 100;
export const CUSTOM_ATTR_VALUE_MAX = 500;

export const HEALTH_FIELDS = [
  { key: 'allergies', label: 'Alergias' },
  { key: 'chronic_conditions', label: 'Condições crônicas', placeholder: 'Diabetes, epilepsia...' },
  { key: 'continuous_medications', label: 'Medicamentos de uso contínuo', restricted: true },
  { key: 'relevant_surgeries', label: 'Cirurgias ou procedimentos relevantes' },
  { key: 'substance_use_risk', label: 'Uso de substâncias de risco', restricted: true },
  { key: 'caregiver_name', label: 'Nome do cuidador / contato de emergência' },
  { key: 'caregiver_contact', label: 'Contato do cuidador', emergencyOnly: true },
];

export const SPECIES = [
  { value: 'dog', label: 'Cão' },
  { value: 'cat', label: 'Gato' },
  { value: 'horse', label: 'Cavalo' },
  { value: 'bird', label: 'Ave' },
  { value: 'rabbit', label: 'Coelho' },
  { value: 'reptile', label: 'Réptil' },
  { value: 'other', label: 'Outro' },
];

export const SIZES = [
  { value: 'small', label: 'Pequeno' },
  { value: 'medium', label: 'Médio' },
  { value: 'large', label: 'Grande' },
];

export const NEUTERED_STATES = [
  { value: 'yes', label: 'Sim' },
  { value: 'no', label: 'Não' },
  { value: 'unknown', label: 'Não sei' },
];

export const HANDLING_FLAGS = [
  { key: 'handling_fragile', label: 'Frágil' },
  { key: 'handling_light_sensitive', label: 'Sensível à luz/calor' },
  { key: 'handling_keep_refrigerated', label: 'Manter refrigerado' },
  { key: 'handling_do_not_invert', label: 'Não virar/inverter' },
  { key: 'handling_sentimental_value', label: 'Valor sentimental alto' },
];

export const PUBLIC_LABEL_MAX = 200;

export const EMPTY_PET_FIELDS = {
  species: 'dog',
  species_other_description: '',
  size: '',
  size_is_public: true,
  color: '',
  color_is_public: true,
  is_neutered: '',
  is_neutered_is_public: true,
  physical_description: '',
  physical_description_is_public: true,
  clinical_notes: '',
  clinical_notes_is_public: true,
  reference_contact: '',
  reference_contact_is_public: false,
};

export const EMPTY_OBJECT_FIELDS = {
  description: '',
  description_is_public: false,
  public_label: '',
  handling_fragile: false,
  handling_light_sensitive: false,
  handling_keep_refrigerated: false,
  handling_do_not_invert: false,
  handling_sentimental_value: false,
  handling_notes_extra: '',
};
