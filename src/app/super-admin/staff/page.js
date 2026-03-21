import AppLayout from '@/components/AppLayout';
import { ComingSoon } from '@/components/ui';
export default function Staff() {
  return (
    <AppLayout requiredRole="super-admin">
      <ComingSoon title="Staff Details" />
    </AppLayout>
  );
}
