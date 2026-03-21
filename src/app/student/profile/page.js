'use client';
import AppLayout from '@/components/AppLayout';
import { PageHeader } from '@/components/ui';
import { useStudentProfile } from '@/hooks/useStudentData';
import { User, Phone, Mail, MapPin, BookOpen, Heart } from 'lucide-react';

function InfoField({ label, value }) {
  return (
    <div style={{ padding: '11px 0', borderBottom: '1px solid #f8fafc' }}>
      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: value ? '#1e293b' : '#cbd5e1' }}>{value || '—'}</div>
    </div>
  );
}

function SectionCard({ title, icon, children, delay = 0 }) {
  return (
    <div className="card" style={{ marginBottom: 16, animation: 'fadeSlideUp 0.4s ease both', animationDelay: `${delay}ms` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #f1f5f9' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <h3 style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function StudentProfile() {
  const { student, loading } = useStudentProfile();

  if (loading) return (
    <AppLayout requiredRole="student">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 14 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #ede9fe', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading profile...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppLayout>
  );

  const s = student || {};

  return (
    <AppLayout requiredRole="student">
      <PageHeader title="My Profile" subtitle="Your personal details" />
      <div style={{ maxWidth: 640 }}>

        {/* Profile Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 60%, #7c3aed 100%)',
          borderRadius: 20, padding: '28px 24px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
          animation: 'fadeSlideUp 0.4s ease both',
          boxShadow: '0 8px 32px rgba(109,40,217,0.3)',
        }}>
          <div style={{ width: 74, height: 74, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 900, border: '3px solid rgba(255,255,255,0.35)', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
            {s.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', letterSpacing: '-0.01em' }}>{s.name || '—'}</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', marginTop: 4 }}>
              {s.class} — Section {s.section} &nbsp;•&nbsp; Roll No: {s.rollNo}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', marginTop: 3 }}>{s.branch}</p>
          </div>
        </div>

        {/* Academic Info */}
        <SectionCard title="Academic Information" icon={<BookOpen size={16} color="#7c3aed" />} delay={100}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[
              ['Full Name',        s.name],
              ['Roll Number',      s.rollNo],
              ['Class',            s.class],
              ['Section',          s.section],
              ['Academic Year',    s.academicYear],
              ['Year of Joining',  s.yearOfJoining],
            ].map(([l, v]) => <InfoField key={l} label={l} value={v} />)}
          </div>
        </SectionCard>

        {/* Personal Info */}
        <SectionCard title="Personal Details" icon={<User size={16} color="#7c3aed" />} delay={200}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[
              ['Gender',       s.gender],
              ['Blood Group',  s.bloodGroup],
              ['Caste',        s.caste],
              ['Aadhaar',      s.aadhaar],
            ].map(([l, v]) => <InfoField key={l} label={l} value={v} />)}
          </div>
        </SectionCard>

        {/* Contact Info */}
        <SectionCard title="Parent & Contact" icon={<Phone size={16} color="#7c3aed" />} delay={300}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[
              ['Parent Name', s.parentName],
              ['Phone',       s.phone],
              ['Email',       s.email],
              ['Address',     s.address],
            ].map(([l, v]) => <InfoField key={l} label={l} value={v} />)}
          </div>
        </SectionCard>
      </div>

      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </AppLayout>
  );
}
