import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useStudentId() {
  const { user } = useAuth();
  // studentId is the real Student doc _id — prefer it over user._id
  return user?.studentId && user.studentId !== '' ? user.studentId : user?._id || user?.id;
}

export function useStudentProfile() {
  const { user } = useAuth();
  const studentId = useStudentId();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    fetch(`/api/students/${studentId}`)
      .then(r => r.json())
      .then(d => { if (d.data) setStudent(d.data); })
      .finally(() => setLoading(false));
  }, [studentId]);

  return { student, loading, studentId };
}
