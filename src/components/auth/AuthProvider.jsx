import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getJson } from '../../services/apiClient';
import { normalizeRole } from '../../utils/moduleAccess';

const AuthContext = createContext(null);
const sessionKeys = ['access_token', 'user_name', 'user_id', 'user_role', 'ginfina_user_id'];
const clearSession = () => sessionKeys.forEach(key => localStorage.removeItem(key));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('access_token')));
  const [error, setError] = useState('');
  const sessionVersion = useRef(0);
  useEffect(() => {
    let active = true;
    const version = sessionVersion.current;
    const isCurrent = () => active && version === sessionVersion.current;
    if (localStorage.getItem('access_token')) {
      getJson('/auth/me').then(profile => {
        if (!isCurrent()) return;
        if (!profile?.role) throw new Error('Your account has no role assigned. Please sign in again.');
        const role = normalizeRole(profile.role);
        localStorage.setItem('user_role', role);
        setUser({ ...profile, role });
      }).catch(() => {
        if (isCurrent()) setError('Unable to verify your account access. Please sign in again.');
      }).finally(() => { if (isCurrent()) setLoading(false); });
    }
    return () => { active = false; };
  }, []);

  const signIn = response => {
    if (!response?.access_token || !normalizeRole(response.role)) {
      throw new Error('The sign-in response must include an access token and account role.');
    }
    const role = normalizeRole(response.role);
    sessionVersion.current += 1;
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user_name', response.name || '');
    localStorage.setItem('user_id', response.user_id || '');
    localStorage.setItem('ginfina_user_id', response.user_id || '');
    localStorage.setItem('user_role', role);
    setUser({ ...response, role });
    setError('');
    setLoading(false);
    return role;
  };
  const signOut = () => { sessionVersion.current += 1; clearSession(); setUser(null); setError(''); setLoading(false); };
  return <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
