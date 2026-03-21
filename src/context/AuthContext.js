'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export const ROLE_REDIRECTS = {
  'super-admin':   '/super-admin/dashboard',
  'branch-admin':  '/branch-admin/dashboard',
  'teacher-admin': '/teacher-admin/dashboard',
  'student':       '/student/dashboard',
};

function normalizeRole(role) {
  if (role === 'teacher') return 'teacher-admin';
  if (role === 'staff')   return 'branch-admin';
  return role;
}

function normalizeUser(userData) {
  return {
    ...userData,
    role: normalizeRole(userData.role),
    _id: userData._id || userData.id || '', // ✅ always ensure _id
  };
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('erp_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(normalizeUser(parsed)); // ✅ normalize on rehydrate
      }
    } catch {
      localStorage.removeItem('erp_user');
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    localStorage.setItem('erp_user', JSON.stringify(normalized));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('erp_user');
    router.replace('/login');
  };

  // ✅ updateUser — patches BOTH state and localStorage so changes survive relogin
  const updateUser = (updates) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = normalizeUser({ ...prev, ...updates }); // ✅ normalize on update too
      localStorage.setItem('erp_user', JSON.stringify(updated));
      return updated;
    });
  };

  const getDashboard = () => ROLE_REDIRECTS[user?.role] || '/login';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, getDashboard, ROLE_REDIRECTS }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
