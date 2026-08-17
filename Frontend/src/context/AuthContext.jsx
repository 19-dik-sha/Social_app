import { createContext, useContext, useState, useEffect } from 'react';
import { getMyProfile, login as apiLogin } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      getMyProfile()
        .then(setUser)
        .catch(() => localStorage.removeItem('access'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const data = await apiLogin(credentials);
    if (data.access) {
      localStorage.setItem('access', data.access);
      const profile = await getMyProfile();
      setUser(profile);
      return profile;
    }
    throw data;
  };

  const logout = () => {
    localStorage.removeItem('access');
    setUser(null);
  };

  const refreshUser = async () => {
    const profile = await getMyProfile();
    setUser(profile);
    return profile;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
