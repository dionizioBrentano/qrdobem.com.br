export const ENTITY_TYPES = {
  person: 'Pessoa',
  pet: 'Pet',
  object: 'Objeto',
  all: 'Todos'
};

export const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Mais recentes' },
  { value: 'created_asc', label: 'Mais antigos' },
  { value: 'name_asc', label: 'Nome (A-Z)' },
  { value: 'name_desc', label: 'Nome (Z-A)' }
];

export const DASHBOARD_TEXTS = {
  emptySearch: 'Nenhum QR Code encontrado para esta busca.',
  emptyList: 'Nenhum QR Code registrado ainda.',
  noPhoto: 'Sem foto',
  flipToQr: 'Ver QR Code',
  flipToPortrait: 'Ver Foto',
  statusActive: 'Ativo',
  statusSuspended: 'Suspenso',
  statusPending: 'Pendente',
  emergency: 'EMERGÊNCIA',
  actions: {
    viewQr: 'Ver QR',
    openLink: 'Abrir link',
    edit: 'Editar',
    delete: 'Excluir',
    confirmDelete: 'Tem certeza que deseja excluir este QR Code?'
  }
};
