// Firebase Auth via REST API — sem o SDK pesado (~800KB a menos no bundle)
const API_KEY = import.meta.env.VITE_FIREBASE_API_KEY || '';
const AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

async function firebaseRequest(endpoint, body) {
  const res = await fetch(`${AUTH_URL}:${endpoint}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) {
    const msg = {
      EMAIL_NOT_FOUND: 'E-mail não encontrado.',
      INVALID_PASSWORD: 'Senha incorreta.',
      INVALID_LOGIN_CREDENTIALS: 'Credenciais inválidas.',
      EMAIL_EXISTS: 'Este e-mail já está cadastrado.',
      WEAK_PASSWORD: 'A senha deve ter pelo menos 6 caracteres.',
      TOO_MANY_ATTEMPTS_TRY_LATER: 'Muitas tentativas. Aguarde e tente novamente.',
    }[data.error.message] || data.error.message;
    throw new Error(msg);
  }
  return data;
}

export async function firebaseLogin(email, password) {
  const data = await firebaseRequest('signInWithPassword', {
    email,
    password,
    returnSecureToken: true,
  });
  localStorage.setItem('firebase_token', data.idToken);
  localStorage.setItem('firebase_refresh', data.refreshToken);
  localStorage.setItem('firebase_uid', data.localId);
  localStorage.setItem('firebase_email', data.email);
  return {
    uid: data.localId,
    email: data.email,
    token: data.idToken,
  };
}

export async function firebaseRegister(email, password) {
  const data = await firebaseRequest('signUp', {
    email,
    password,
    returnSecureToken: true,
  });
  localStorage.setItem('firebase_token', data.idToken);
  localStorage.setItem('firebase_refresh', data.refreshToken);
  localStorage.setItem('firebase_uid', data.localId);
  localStorage.setItem('firebase_email', data.email);
  return {
    uid: data.localId,
    email: data.email,
    token: data.idToken,
  };
}

export async function firebaseAnonymousLogin() {
  const data = await firebaseRequest('signUp', {
    returnSecureToken: true,
  });
  localStorage.setItem('firebase_token', data.idToken);
  localStorage.setItem('firebase_refresh', data.refreshToken);
  localStorage.setItem('firebase_uid', data.localId);
  // Anônimos não têm e-mail na conta Firebase
  return {
    uid: data.localId,
    token: data.idToken,
  };
}

export async function firebaseRefreshToken() {
  const refreshToken = localStorage.getItem('firebase_refresh');
  if (!refreshToken) return null;

  try {
    const res = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
      }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    localStorage.setItem('firebase_token', data.id_token);
    localStorage.setItem('firebase_refresh', data.refresh_token);
    return {
      uid: data.user_id,
      email: localStorage.getItem('firebase_email'),
      token: data.id_token,
    };
  } catch {
    firebaseLogout();
    return null;
  }
}

export function firebaseLogout() {
  localStorage.removeItem('firebase_token');
  localStorage.removeItem('firebase_refresh');
  localStorage.removeItem('firebase_uid');
  localStorage.removeItem('firebase_email');
}

export function getStoredUser() {
  const token = localStorage.getItem('firebase_token');
  const uid = localStorage.getItem('firebase_uid');
  const email = localStorage.getItem('firebase_email');
  if (token && uid) return { uid, email, token };
  return null;
}
