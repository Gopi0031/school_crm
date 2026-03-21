'use client';
import AppLayout from '@/components/AppLayout';
import { ComingSoon } from '@/components/ui';
export default function Page() {
  return <AppLayout requiredRole="branch-admin"><ComingSoon title="Admission" /></AppLayout>;
}
