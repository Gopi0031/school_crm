'use client';
import { useState, useEffect, useCallback } from 'react';

function computeFee(s) {
  if (!s) return null;
  
  const total = Number(s.totalFee) || 0;
  const t1    = Number(s.term1)    || 0;
  const t2    = Number(s.term2)    || 0;
  const t3    = Number(s.term3)    || 0;
  const paid  = t1 + t2 + t3;

  // Compute term dues
  let term1Due = Number(s.term1Due) || 0;
  let term2Due = Number(s.term2Due) || 0;
  let term3Due = Number(s.term3Due) || 0;

  // Recompute if dues are zero but fee exists
  if (total > 0 && term1Due === 0 && term2Due === 0 && term3Due === 0) {
    const base  = Math.floor(total / 3);
    const extra = total - base * 3;
    term1Due = Math.max(0, (base + extra) - t1);
    term2Due = Math.max(0, base - t2);
    term3Due = Math.max(0, base - t3);
  }

  return { 
    ...s, 
    totalFee: total, 
    paidFee: paid, 
    term1: t1, 
    term2: t2, 
    term3: t3, 
    term1Due, 
    term2Due, 
    term3Due 
  };
}

function getStoredUser() {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try erp_user first (your app's storage key)
    const erpUser = localStorage.getItem('erp_user');
    if (erpUser) {
      const parsed = JSON.parse(erpUser);
      if (parsed && (parsed.username || parsed.id || parsed.studentId)) {
        console.log('📦 Found user in erp_user:', {
          id: parsed.id,
          username: parsed.username,
          studentId: parsed.studentId,
          rollNo: parsed.rollNo,
          role: parsed.role,
        });
        return parsed;
      }
    }

    // Fallback to other storage keys
    const fallbackKeys = ['user', 'userData', 'currentUser', 'authUser'];
    for (const key of fallbackKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.username || parsed.id || parsed.studentId)) {
            console.log(`📦 Found user in ${key}`);
            return parsed;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    console.log('❌ No user found in any storage key');
    return null;
  } catch (e) {
    console.error('Error reading stored user:', e);
    return null;
  }
}

export function useStudentProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const user = getStoredUser();

      if (!user) {
        console.log('❌ No user in storage');
        setError('Session expired. Please log in again.');
        setLoading(false);
        return;
      }

      // Build params with ALL identifiers
      const params = new URLSearchParams();
      
      if (user.studentId)   params.set('studentId', user.studentId);
      if (user.username)    params.set('username',  user.username);
      if (user.id)          params.set('userId',    user.id);
      if (user._id)         params.set('userId',    user._id);
      if (user.rollNo)      params.set('rollNo',    user.rollNo);
      if (user.branch)      params.set('branch',    user.branch);

      console.log('🔍 Fetching profile with params:', Object.fromEntries(params));

      const res = await fetch(`/api/students/profile?${params}`);
      
      // Handle non-JSON responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('❌ Non-JSON response:', text);
        setError('Server returned invalid response');
        setLoading(false);
        return;
      }

      const data = await res.json();

      console.log('📥 Profile response:', { 
        success: data.success, 
        hasData: !!data.data,
        studentName: data.data?.name,
        totalFee: data.data?.totalFee,
        term1: data.data?.term1,
        term2: data.data?.term2,
        term3: data.data?.term3,
        error: data.error 
      });

      if (!res.ok || !data.success) {
        setError(data.error || 'Profile not found');
        setStudent(null);
        setLoading(false);
        return;
      }

      const computed = computeFee(data.data);
      console.log('✅ Computed fee data:', {
        name: computed?.name,
        totalFee: computed?.totalFee,
        paidFee: computed?.paidFee,
        term1: computed?.term1,
        term2: computed?.term2,
        term3: computed?.term3,
      });
      
      setStudent(computed);
      setError(null);
    } catch (err) {
      console.error('❌ Profile fetch error:', err);
      setError('Network error. Please try again.');
      setStudent(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchProfile(); 
  }, [fetchProfile]);

  return { student, loading, error, refetch: fetchProfile };
}