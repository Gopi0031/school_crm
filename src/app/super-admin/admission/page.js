'use client';
import AppLayout from '@/components/AppLayout';
import { ComingSoon } from '@/components/ui';

export default function SuperAdminAdmission() {
  return (
    <AppLayout requiredRole="super-admin">
      <ComingSoon title="Admission" />
    </AppLayout>
  );
}
