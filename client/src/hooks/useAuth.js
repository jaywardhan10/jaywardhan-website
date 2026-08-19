import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(null);

  const checkSession = useCallback(() => {
    return api.getSession().then((data) => {
      setAuthenticated(data.authenticated);
      return data.authenticated;
    });
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(async (username, password) => {
    await api.login(username, password);
    setAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setAuthenticated(false);
  }, []);

  return { authenticated, login, logout, checkSession };
}
