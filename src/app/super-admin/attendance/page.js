'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, Pagination, EmptyState } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SuperAdminAttendance() {
  const [students, setStudents]   = useState([]);
  const [branches, setBranches]   = useState([]);
  const [branch, setBranch]       = useState('');
  const [type, setType]           = useState('student');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const perPage = 10;

  useEffect(() => {
    Promise.all([
      fetch(`/api/students${branch ? `?branch=${branch}` : ''}`).then(r => r.json()),
      fetch('/api/branches').then(r => r.json()),
    ]).then(([s, b]) => {
      if (s.success) setStudents(s.data);
      if (b.success) setBranches(b.data);
      setLoading(false);
    });
  }, [branch]);

  const filtered = useMemo(() => students.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const paginated = filtered.slice((page-1)*perPage, page*perPage);
  const totalPresent = filtered.filter(s => s.todayAttendance === 'Present').length;
  const totalAbsent  = filtered.length - totalPresent;

  // Branch-wise chart data
  const chartData = branches.map(b => {
    const branchStudents = students.filter(s => s.branch === b.name);
    return {
      branch: b.name,
      present: branchStudents.filter(s => s.todayAttendance === 'Present').length,
      absent:  branchStudents.filter(s => s.todayAttendance === 'Absent').length,
    };
  });

  return (
    <AppLayout requiredRole="super-admin">
      <PageHeader title="Attendance" subtitle="Branch-wise attendance overview" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 20 }}>
        {[
          { t: 'Total', v: filtered.length, c: '#4f46e5' },
          { t: 'Present', v: totalPresent, c: '#10b981' },
          { t: 'Absent', v: totalAbsent, c: '#ef4444' },
          { t: 'Att %', v: `${filtered.length ? Math.round(totalPresent/filtered.length*100) : 0}%`, c: '#f59e0b' },
        ].map(({ t, v, c }) => (
          <div key={t} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${c}` }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>{t}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Branch-wise Attendance</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <XAxis dataKey="branch" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="present" name="Present" fill="#10b981" radius={[3,3,0,0]} />
            <Bar dataKey="absent"  name="Absent"  fill="#ef4444" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="select" value={branch} onChange={e => { setBranch(e.target.value); setPage(1); }}>
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id}>{b.name}</option>)}

          </select>
          <input className="input" placeholder="Search student..." onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ maxWidth: 240 }} />
        </div>
      </div>

      <div className="card">
        <TableWrapper>
          <thead>
            <tr><th>S.No</th><th>Status</th><th>Roll No</th><th>Student Name</th><th>Class</th><th>Branch</th><th>Today</th><th>Total Att.</th></tr>
          </thead>
          <tbody>
  {loading ? (
    <tr key="loading-row">
      <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</td>
    </tr>
  ) : paginated.length === 0 ? (
    <tr key="empty-row">
      <td colSpan={8}><EmptyState /></td>
    </tr>
  ) : paginated.map((s, i) => {
              const pct = s.totalWorkingDays ? Math.round(s.presentDays/s.totalWorkingDays*100) : 0;
              return (
                  <tr key={s._id || s.id || `row-${i}`}>
                  <td style={{ color: '#94a3b8' }}>{(page-1)*perPage+i+1}</td>
                  <td><Badge>{s.status}</Badge></td>
                  <td style={{ fontWeight: 600 }}>{s.rollNo}</td>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.class} — {s.section}</td>
                  <td>{s.branch}</td>
                  <td>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: s.todayAttendance === 'Present' ? '#dcfce7' : '#fee2e2', color: s.todayAttendance === 'Present' ? '#16a34a' : '#dc2626' }}>
                      {s.todayAttendance || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 50, height: 5, background: '#f1f5f9', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 75 ? '#10b981' : '#ef4444', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '0.75rem' }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
        <Pagination total={filtered.length} page={page} perPage={perPage} onChange={setPage} />
      </div>
    </AppLayout>
  );
}
