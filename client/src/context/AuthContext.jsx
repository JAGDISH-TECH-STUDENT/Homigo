import { useState, useEffect } from 'react';
import API from '../api/axios';
import { AuthContext } from './authContextValue';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const res = await API.post('/auth/login', { username, password });
    setUser(res.data.user);
    return res.data;
  };

  const signup = async ({ username, email, password }) => {
    const res = await API.post('/auth/signup', { username, email, password });
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    await API.get('/auth/logout');
    setUser(null);
  };

  const upgradeToHost = async () => {
    const res = await API.post('/auth/upgrade-to-host');
    setUser(res.data.user);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, upgradeToHost, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

