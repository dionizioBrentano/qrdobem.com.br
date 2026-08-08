import { createContext, useContext, useState, useEffect } from 'react';
import {
  firebaseLogin,
  firebaseRegister,
  firebaseLogout,
  firebaseRefreshToken,
  getStoredUser,
} from '../services/firebase';
import { authApi, setReauthHandler } from '../services/api';
import ReauthModal from '../components/ReauthModal';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reauthCallback, setReauthCallback] = useState(null);

  useEffect(() => {
    setReauthHandler(() => {
      return new Promise((resolve) => {
        setReauthCallback(() => resolve);
      });
    });
  }, []);

  // Restaura sessão ao carregar
  useEffect(() => {
    async function restore() {
      let stored = getStoredUser();
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const data = await authApi.me({ _noReauth: true });
        setUser(stored);
        setTenant(data.tenant);
      } catch (err) {
        if (err.status === 401) {
          // Token expirado — tenta refresh
          const refreshed = await firebaseRefreshToken();
          if (refreshed) {
            try {
              const data = await authApi.me({ _noReauth: true });
              setUser(refreshed);
              setTenant(data.tenant);
            } catch {
              firebaseLogout();
            }
          }
        }
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  const login = async (email, password) => {
    const u = await firebaseLogin(email, password);
    const data = await authApi.me();
    setUser(u);
    setTenant(data.tenant);
    return u;
  };

  const register = async (email, password) => {
    const u = await firebaseRegister(email, password);
    const data = await authApi.me();
    setUser(u);
    setTenant(data.tenant);
    return u;
  };

  const logout = () => {
    firebaseLogout();
    setUser(null);
    setTenant(null);
  };

  // Rebusca o tenant no backend. Usado depois de verificar o e-mail ou
  // completar o perfil, para a navegação refletir o novo profile_status
  // sem obrigar o usuário a recarregar a página.
  const refreshTenant = async () => {
    try {
      const data = await authApi.me();
      setTenant(data.tenant);
      return data.tenant;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, register, logout, refreshTenant }}>
      {children}
      {reauthCallback && (
        <ReauthModal 
          onSuccess={() => {
            if (reauthCallback) reauthCallback(true);
            setReauthCallback(null);
          }}
          onCancel={() => {
            if (reauthCallback) reauthCallback(false);
            setReauthCallback(null);
          }}
        />
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
