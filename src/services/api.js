import { firebaseRefreshToken, firebaseLogout } from './firebase';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.qrdobem.com.br/api';

export let reauthHandler = null;
export const setReauthHandler = (handler) => { reauthHandler = handler; };

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('firebase_token');

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'Accept': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  Object.keys(headers).forEach((key) => {
    if (headers[key] === undefined) delete headers[key];
  });

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && token && !options._isRetry && !options._noReauth) {
      // Tenta atualizar o token silenciosamente
      const refreshed = await firebaseRefreshToken();
      
      if (refreshed) {
        // Token atualizado com sucesso, repete a requisição original
        return request(endpoint, { ...options, _isRetry: true });
      } else {
        // Falhou o refresh, força logout e vai para o login
        firebaseLogout();
        window.location.href = '/login?expired=true';
        // Interrompe a promise atual para não estourar erro na tela antes do redirect
        return new Promise(() => {}); 
      }
    }

    const error = new Error(data?.error || `Erro ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// --- Auth ---
export const authApi = {
  sendOtp: (email, firebase_uid) =>
    request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, firebase_uid }),
    }),

  verifyOtp: (firebase_uid, code) =>
    request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ firebase_uid, code }),
    }),

  me: (opts = {}) => request('/auth/me', opts),

  validateRegisterToken: (token) =>
    request(`/auth/register-validate?token=${token}`),

  requestRegisterLink: (email, trail = null) =>
    request('/auth/register-link', {
      method: 'POST',
      body: JSON.stringify({ email, trail }),
    }),

  completeRegistration: (data) =>
    request('/auth/register-complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Entities ---
export const entitiesApi = {
  // `spaceId` é o contexto novo (F1). Opcional: sem ele, o backend resolve
  // o espaço a partir da organização, e quem não mandar nenhum dos dois
  // continua recebendo o comportamento antigo.
  list: (organizationId = null, spaceId = null) => {
    let url = '/entities?';
    if (organizationId) url += `organization_id=${organizationId}&`;
    if (spaceId) url += `space_id=${spaceId}`;
    return request(url);
  },

  getForEdit: (uniqueCode) => request(`/entities/${uniqueCode}/edit`),

  update: (uniqueCode, payload) => request(`/entities/${uniqueCode}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),

  create: (data) =>
    request('/entities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  show: (uniqueCode) => request(`/entities/${uniqueCode}`),

  // A API gera o QR (é whitelabel). Precisa passar pelo request() por causa
  // do Bearer token — usar a URL direto num <img src> daria 401.
  qrCode: (uniqueCode) => request(`/entities/${uniqueCode}/qrcode`),

  addVaccination: (uniqueCode, data) =>
    request(`/entities/${uniqueCode}/vaccinations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  declareEmergency: (uniqueCode, declarantCpf) =>
    request(`/entities/${uniqueCode}/declare-emergency`, {
      method: 'POST',
      body: JSON.stringify({ declarant_cpf: declarantCpf }),
    }),
};

// --- Perfil (coleta progressiva) ---
export const profileApi = {
  get: () => request('/profile'),

  update: (data) =>
    request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  addDocument: (data) =>
    request('/profile/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Identidade da pessoa: contas múltiplas e vínculos (F10 / TX-R02..R04) ---
//
// Nenhuma destas chamadas envia CPF. O backend responde sempre a partir da
// conta autenticada — CPF não é credencial de leitura de vínculo.
export const meApi = {
  // Contas da mesma pessoa (mesmo CPF), incluindo a atual.
  accounts: () => request('/me/accounts'),

  // Vínculos consolidados: espaços, papéis e por qual conta.
  links: () => request('/me/links'),

  // Valida a troca de conta. Hoje devolve method: 'reauth' — o backend não
  // emite token do Firebase, então a troca é assistida, não silenciosa.
  switchAccount: (targetTenantId) =>
    request('/me/switch-account', {
      method: 'POST',
      body: JSON.stringify({ target_tenant_id: targetTenantId }),
    }),
};

// --- Botão de Pânico (T1-R07) ---
export const panicApi = {
  // Acionamento pelo app instalado. `data` aceita latitude, longitude,
  // location_accuracy, note e entity_id — todos opcionais.
  trigger: (spaceId, data = {}) =>
    request(`/spaces/${spaceId}/panic`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Acionamento público por leitura do QR. Sem autenticação: quem
  // encontrou a pessoa na rua não tem conta.
  triggerPublic: (uniqueCode, data = {}) =>
    request(`/entities/${uniqueCode}/panic`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  history: (spaceId) => request(`/spaces/${spaceId}/panic`),

  resolve: (eventId, falseAlarm = false) =>
    request(`/panic/${eventId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ false_alarm: falseAlarm }),
    }),
};

// --- Árvore genealógica (T1-R02) ---
export const familyApi = {
  tree: (spaceId) => request(`/spaces/${spaceId}/family`),

  addRelation: (spaceId, data) =>
    request(`/spaces/${spaceId}/family`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeRelation: (spaceId, relationshipId) =>
    request(`/spaces/${spaceId}/family/${relationshipId}`, { method: 'DELETE' }),
};

// --- 2FA (T1-R05) ---
export const twoFactorApi = {
  status: () => request('/2fa/status'),
  setup: () => request('/2fa/setup', { method: 'POST' }),
  confirm: (code) =>
    request('/2fa/confirm', { method: 'POST', body: JSON.stringify({ code }) }),
  verify: (code) =>
    request('/2fa/verify', { method: 'POST', body: JSON.stringify({ code }) }),
  disable: (code) =>
    request('/2fa/disable', { method: 'POST', body: JSON.stringify({ code }) }),
};

// --- Espaços de trilha (F1) e guarda-chuva (T2-R01, T2-R02) ---
export const spacesApi = {
  list: () => request('/spaces'),

  // `type`: family | cause | company | donation.
  // Causa de pessoa física não manda organization_id — e isso é o ponto:
  // o sistema não exige CNPJ (T2-R01).
  create: (data) =>
    request('/spaces', { method: 'POST', body: JSON.stringify(data) }),

  show: (spaceId) => request(`/spaces/${spaceId}`),

  update: (spaceId, data) =>
    request(`/spaces/${spaceId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Chamado pelo dono do GUARDA-CHUVA, nunca pelo grupo apoiado.
  attachChild: (spaceId, childSpaceId) =>
    request(`/spaces/${spaceId}/children`, {
      method: 'POST',
      body: JSON.stringify({ child_space_id: childSpaceId }),
    }),
};

// --- Vitrine das causas (T2-R04, T2-R05) ---
export const causesApi = {
  // Público — não exige login.
  list: (filters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v)
    );
    const qs = params.toString();
    return request(`/causes${qs ? `?${qs}` : ''}`);
  },

  show: (slug) => request(`/causes/${slug}`),

  update: (spaceId, data) =>
    request(`/spaces/${spaceId}/cause`, { method: 'PUT', body: JSON.stringify(data) }),

  publish: (spaceId, publish = true) =>
    request(`/spaces/${spaceId}/cause/publish`, {
      method: 'POST',
      body: JSON.stringify({ publish }),
    }),
};

// --- Mídia com moderação (T2-R05) ---
export const mediaApi = {
  // Upload usa FormData: o Content-Type precisa vir do browser com o
  // boundary do multipart, por isso o header é removido aqui.
  upload: (spaceId, file, caption = '') => {
    const form = new FormData();
    form.append('file', file);
    if (caption) form.append('caption', caption);

    return request(`/spaces/${spaceId}/media`, {
      method: 'POST',
      body: form,
      headers: { 'Content-Type': undefined },
    });
  },

  list: (spaceId) => request(`/spaces/${spaceId}/media`),

  moderate: (mediaId, approve, reason = null) =>
    request(`/media/${mediaId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ approve, reason }),
    }),

  remove: (mediaId) => request(`/media/${mediaId}`, { method: 'DELETE' }),
};

// --- QR Codes em lote (T2-R03) ---
export const qrBatchesApi = {
  create: (spaceId, quantity, label = null) =>
    request(`/spaces/${spaceId}/qr-batches`, {
      method: 'POST',
      body: JSON.stringify({ quantity, label }),
    }),

  list: (spaceId) => request(`/spaces/${spaceId}/qr-batches`),

  show: (batchId) => request(`/qr-batches/${batchId}`),
};

// --- Doações (T4-R01 a T4-R04) ---
export const donationsApi = {
  // Rateio da doação ANTES de confirmar: quanto é taxa da OSCIP/plataforma,
  // quanto chega à causa, total a pagar. Público e sem efeito colateral —
  // é a fonte única do breakdown, a mesma conta que o /donations usa.
  // Body: amount, cover_fees?, extra_platform_support?, payment_method?
  preview: (data) =>
    request('/donation-causes/preview', { method: 'POST', body: JSON.stringify(data) }),

  create: (data) =>
    request('/donation-causes', { method: 'POST', body: JSON.stringify(data) }),

  createCard: (data) =>
    request('/donation-causes/card', { method: 'POST', body: JSON.stringify(data) }),

  mine: () => request('/donation-causes/mine'),

  subscribe: (data) =>
    request('/donation-causes/subscribe', { method: 'POST', body: JSON.stringify(data) }),

  cancelSubscription: (subscriptionId) =>
    request(`/donation-causes/${subscriptionId}/cancel-subscription`, { method: 'POST' }),

  // Público: últimas doações de uma causa.
  publicList: (slug) => request(`/causes/${slug}/donations`),

  // Status público (Fase 0.2)
  status: (token) => request(`/donation-causes/status/${token}`),
};

// --- Beneficiários e repasses (T4-R05, T4-R06, T4-R08, T4-R09) ---
export const beneficiariesApi = {
  create: (spaceId, data) =>
    request(`/spaces/${spaceId}/beneficiaries`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (spaceId) => request(`/spaces/${spaceId}/beneficiaries`),

  update: (id, data) =>
    request(`/beneficiaries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // A senha é definida pela gestão e entregue de viva voz ao beneficiário:
  // ele frequentemente não tem e-mail para um fluxo de "esqueci a senha".
  setProofPassword: (id, password) =>
    request(`/beneficiaries/${id}/proof-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  // --- URL única do beneficiário (públicas) ---
  publicShow: (uniqueCode) => request(`/b/${uniqueCode}`),

  createNeed: (uniqueCode, data) =>
    request(`/b/${uniqueCode}/needs`, { method: 'POST', body: JSON.stringify(data) }),

  // A CONTRAPROVA (T4-R06). `factor`: password | tutor | facial.
  confirmReceipt: (uniqueCode, disbursementId, factor, password = null) =>
    request(`/b/${uniqueCode}/disbursements/${disbursementId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ factor, password }),
    }),

  // Prova social (T4-R07). Só aceita depois da confirmação.
  sendProof: (uniqueCode, disbursementId, file, caption = '') => {
    const form = new FormData();
    form.append('file', file);
    if (caption) form.append('caption', caption);

    return request(`/b/${uniqueCode}/disbursements/${disbursementId}/proof`, {
      method: 'POST',
      body: form,
      headers: { 'Content-Type': undefined },
    });
  },
};

export const disbursementsApi = {
  create: (spaceId, data) =>
    request(`/spaces/${spaceId}/disbursements`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (spaceId) => request(`/spaces/${spaceId}/disbursements`),

  // status: approved | sent | disputed. A máquina de estados é validada
  // no backend — o frontend usa `next_states` para montar os botões.
  transition: (id, status) =>
    request(`/disbursements/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),

  authorizeReimbursement: (id, data) =>
    request(`/disbursements/${id}/reimbursement`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Módulo Premium de Saúde (T1-R08 a T1-R11) ---
export const healthApi = {
  show: (uniqueCode) => request(`/entities/${uniqueCode}/health`),

  addDiaryEntry: (uniqueCode, data) =>
    request(`/entities/${uniqueCode}/health/diary`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createPrescription: (uniqueCode, data) =>
    request(`/entities/${uniqueCode}/prescriptions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePrescription: (id, data) =>
    request(`/prescriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Código de barras → produto. Devolve `needs_confirmation`: quando true,
  // a tela precisa perguntar "é este o produto que você comprou?".
  lookupMedication: (ean) =>
    request('/medications/lookup', { method: 'POST', body: JSON.stringify({ ean }) }),

  // O voto que constrói a base. Três confirmações independentes tornam o
  // registro confiável; uma correção o leva a `conflict`.
  confirmMedication: (medicationId, isCorrect, correction = null) =>
    request(`/medications/${medicationId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ is_correct: isCorrect, correction }),
    }),
};

// --- Apadrinhamento (T2-R06) ---
export const sponsorshipsApi = {
  sponsor: (uniqueCode, monthlyAmount) =>
    request(`/b/${uniqueCode}/sponsor`, {
      method: 'POST',
      body: JSON.stringify({ monthly_amount: monthlyAmount }),
    }),

  mine: () => request('/sponsorships/mine'),

  end: (id) => request(`/sponsorships/${id}/end`, { method: 'POST' }),
};

// --- Mapa de calor (T2-R07) — público ---
export const heatmapApi = {
  cells: (filters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v)
    );
    const qs = params.toString();
    return request(`/heatmap${qs ? `?${qs}` : ''}`);
  },

  summary: () => request('/heatmap/summary'),
};

// --- Admin ---
export const adminApi = {
  getTenants: () => request('/admin/tenants'),


  createBatch: (data) =>
    request('/admin/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleBatch: (batchId) =>
    request(`/admin/batches/${batchId}/toggle`, { method: 'POST' }),
};

// --- Messages ---
export const messagesApi = {
  list: () => request('/messages'),

  markAsRead: (id) =>
    request(`/messages/${id}/read`, { method: 'POST' }),

  sendPublic: (uniqueCode, data) =>
    request(`/entities/${uniqueCode}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Conversas (chat mediado) ---
export const conversationsApi = {
  create: (uniqueCode, data) =>
    request(`/entities/${uniqueCode}/conversations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reply: (uniqueCode, conversationId, data) =>
    request(`/entities/${uniqueCode}/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  recover: (uniqueCode, recoveryCode) =>
    request(`/entities/${uniqueCode}/conversations/recover`, {
      method: 'POST',
      body: JSON.stringify({ recovery_code: recoveryCode }),
    }),

  get: (uniqueCode, conversationId) =>
    request(`/entities/${uniqueCode}/conversations/${conversationId}`),

  tenantReply: (conversationId, data) =>
    request(`/conversations/${conversationId}/reply`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resolve: (conversationId) =>
    request(`/conversations/${conversationId}/resolve`, { method: 'POST' }),
};

// --- Credits ---
export const creditsApi = {
  mpPublicConfig: () => request('/credits/mp-public-config'),

  pricing: () => request('/credits/pricing'),
  
  checkout: (quantity) => 
    request('/credits/checkout', {
      method: 'POST',
      body: JSON.stringify({ quantity }),
    }),

  checkoutCard: (data) =>
    request('/credits/checkout/card', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  orderStatus: (id) => request(`/credits/orders/${id}`),
};

// --- Waitlist ---
export const waitlistApi = {
  join: (email, interest) =>
    request('/waitlist', {
      method: 'POST',
      body: JSON.stringify({ email, interest }),
    }),
};

// --- Contact ---
export const contactApi = {
  send: (data) =>
    request('/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Generic API Wrapper (Usado para endpoints não mapeados acima) ---
export const api = {
  get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
  post: (url, data, options = {}) => request(url, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: (url, data, options = {}) => request(url, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' }),
};
