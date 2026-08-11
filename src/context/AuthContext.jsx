import { createContext, useContext, useState, useEffect } from 'react';
import {
  firebaseLogin,
  firebaseRegister,
  firebaseLogout,
  firebaseRefreshToken,
  getStoredUser,
} from '../services/firebase';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

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
    window.location.href = '/login';
  };

  // Rebusca o tenant no backend.
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
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
