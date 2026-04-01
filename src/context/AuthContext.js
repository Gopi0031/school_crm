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
    _id: userData._id || userData.id || '',
    // ✅ Ensure student-specific fields are preserved
    ...(userData.studentId && {
      studentId: userData.studentId,
      studentName: userData.studentName || userData.name,
      rollNo: userData.rollNo,
      class: userData.class,
      section: userData.section,
      parentName: userData.parentName,
      totalFee: userData.totalFee,
      paidFee: userData.paidFee,
    }),
    // ✅ Ensure teacher-specific fields are preserved
    ...(userData.teacherId && {
      teacherId: userData.teacherId,
      assignedClass: userData.assignedClass,
      classTeacher: userData.classTeacher,
      subject: userData.subject,
      employeeId: userData.employeeId,
    }),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('erp_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const normalized = normalizeUser(parsed);
        
        console.log('📦 Restored user from storage:', {
          username: normalized.username,
          role: normalized.role,
          studentId: normalized.studentId,
          rollNo: normalized.rollNo,
        });
        
        setUser(normalized);
      }
    } catch (e) {
      console.error('Error restoring user:', e);
      localStorage.removeItem('erp_user');
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const normalized = normalizeUser(userData);
    
    console.log('✅ Logging in user:', {
      username: normalized.username,
      role: normalized.role,
      studentId: normalized.studentId,
      rollNo: normalized.rollNo,
      branch: normalized.branch,
    });
    
    setUser(normalized);
    localStorage.setItem('erp_user', JSON.stringify(normalized));
  };

  const logout = () => {
    console.log('👋 Logging out user:', user?.username);
    setUser(null);
    localStorage.removeItem('erp_user');
    router.replace('/login');
  };

  const updateUser = (updates) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = normalizeUser({ ...prev, ...updates });
      
      console.log('🔄 Updating user:', {
        username: updated.username,
        updates: Object.keys(updates),
      });
      
      localStorage.setItem('erp_user', JSON.stringify(updated));
      return updated;
    });
  };

  const getDashboard = () => ROLE_REDIRECTS[user?.role] || '/login';

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      updateUser, 
      getDashboard, 
      ROLE_REDIRECTS 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};