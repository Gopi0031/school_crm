// src/hooks/useStudentData.js
'use client';
import { useState, useEffect, useCallback } from 'react';

function computeFee(s) {
  if (!s) return null;
  
  const total = Number(s.totalFee) || 0;
  const t1 = Number(s.term1) || 0;
  const t2 = Number(s.term2) || 0;
  const t3 = Number(s.term3) || 0;
  const paid = t1 + t2 + t3;

  let term1Due = 0, term2Due = 0, term3Due = 0;
  if (total > 0) {
    const base = Math.floor(total / 3);
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
    // Check multiple possible storage keys
    const keys = ['user', 'userData', 'currentUser', 'authUser'];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.username || parsed.id || parsed.rollNo)) {
          console.log('Found user in localStorage key:', key, parsed);
          return parsed;
        }
      }
    }
    
    // Also check sessionStorage
    for (const key of keys) {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.username || parsed.id || parsed.rollNo)) {
          console.log('Found user in sessionStorage key:', key, parsed);
          return parsed;
        }
      }
    }
    
    return null;
  } catch (err) {
    console.error('Error getting stored user:', err);
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
      console.log('Fetching profile for user:', user);

      if (!user) {
        setError('No session found. Please log in again.');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();

      // Add all possible identifiers
      if (user.username) params.set('username', user.username);
      if (user.id) params.set('userId', user.id);
      if (user.studentId) params.set('studentId', user.studentId);
      if (user.rollNo) params.set('rollNo', user.rollNo);
      if (user.roll_no) params.set('rollNo', user.roll_no);

      console.log('Fetching from API with params:', params.toString());

      const res = await fetch(`/api/students/profile?${params.toString()}`);
      const data = await res.json();

      console.log('API Response:', data);

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load fee data');
        setStudent(null);
        setLoading(false);
        return;
      }

      const computed = computeFee(data.data);
      console.log('Computed student data:', computed);
      setStudent(computed);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
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

// Additional hook for fetching any student by ID (for admin use)
export function useStudentById(studentId) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudent = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/students/${studentId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load student');
        setStudent(null);
      } else {
        setStudent(computeFee(data.data));
      }
    } catch (err) {
      setError('Network error');
      setStudent(null);
    }

    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  return { student, loading, error, refetch: fetchStudent };
}