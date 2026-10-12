import { createContext, useContext, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

function readSavedUser() {
  try { return JSON.parse(localStorage.getItem('devshelf_user') || 'null'); }
  catch { localStorage.removeItem('devshelf_user'); return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser);
  const [token, setToken] = useState(() => localStorage.getItem('devshelf_token'));

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const receivedToken = data.token ?? data.Token;
    const userData = { id: data.id ?? data.Id, userName: data.userName ?? data.UserName, email: data.email ?? data.Email };
    if (!receivedToken) throw new Error('The API did not return an authentication token.');
    localStorage.setItem('devshelf_token', receivedToken);
    localStorage.setItem('devshelf_user', JSON.stringify(userData));
    setToken(receivedToken); setUser(userData);
    return data;
  };

  const register = async (userName, email, password) => {
    const { data } = await api.post('/auth/register', { userName, email, password });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('devshelf_token'); localStorage.removeItem('devshelf_user');
    setToken(null); setUser(null);
  };

  const value = useMemo(() => ({ user, token, isAuthenticated: Boolean(token), login, register, logout }), [user, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
