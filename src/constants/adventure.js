export const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export const DEFAULT_TOLERANCE_MINUTES = 15;
export const DEFAULT_RADIUS_METERS = 50;

export const ADVENTURE_UI = {
  SKIP_ALERT_LABEL: 'Não avisar se eu estiver dentro da trilha, mesmo sem horário',
  WINDOW_REST_LABEL: 'Janela de repouso (dormir/descansar): não cobrar imobilidade',
  WINDOW_POINT_LABEL: 'Vale só para o ponto:',
  WINDOW_ALL_POINTS: 'Toda a trilha',
  WINDOW_TITLE: 'Janelas de horário',
  WINDOW_EMPTY: 'Nenhuma janela cadastrada.',
  WINDOW_ADD: 'Adicionar janela',
  PROTECTION_TITLE: 'Tela de Proteção',
  PROTECTION_NO_POSITION: 'Sem posição registrada ainda',
  PROTECTION_IM_OK: 'Estou bem',
  PROTECTION_IM_OK_SENT: 'Enviado',
  PROTECTION_MONITORING_ON: 'Monitoramento ligado',
  PROTECTION_MONITORING_OFF: 'Monitoramento desligado',
  PROTECTION_GPS_ERROR: 'Erro ao obter localização',
  PROTECTION_GPS_DENIED: 'Permissão de GPS negada',
  PROTECTION_SEND_ERROR: 'Falha ao enviar posição',
  DEVICE_ROLE_LABEL: 'Este aparelho é:',
  DEVICE_ROLE_PROTECTED: 'da pessoa protegida',
  DEVICE_ROLE_COMPANION: 'do acompanhante',
};

export const GPS_INTERVAL_MS = 60000;
export const WELLNESS_POLL_MS = 60000;

export const WELLNESS_REASON_TEXT = {
  off_route: 'Você parece estar fora da sua rotina.',
  idle: 'Você está parado há um tempo.',
  companion_far: 'Você se afastou do acompanhante.',
  manual: 'Confirmação solicitada.',
};
