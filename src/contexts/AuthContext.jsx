import { createContext, useContext, useEffect, useState } from 'react';
import { localDb } from '../utils/localDb';

const AuthContext = createContext(null);
const LOGGED_IN_KEY = 'mindmesh_local_logged_in';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const isLoggedIn = localStorage.getItem(LOGGED_IN_KEY) === 'true';
        if (isLoggedIn) {
          const profile = await localDb.getProfile();
          setUser({
            uid: 'local-guest-user',
            ...profile,
          });
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Error loading mock user:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      localStorage.setItem(LOGGED_IN_KEY, 'true');
      const profile = await localDb.getProfile();
      const guestUser = {
        uid: 'local-guest-user',
        ...profile,
      };
      setUser(guestUser);
      return guestUser;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      localStorage.removeItem(LOGGED_IN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
